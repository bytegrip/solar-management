import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Solar panel efficiency factors based on real-world data
const WEATHER_IMPACT = {
  // Cloud coverage impact on solar efficiency (based on NREL data)
  CLOUD_IMPACT: {
    CLEAR: 1.0,           // 0-10% clouds
    PARTLY_CLOUDY: 0.7,   // 11-50% clouds
    MOSTLY_CLOUDY: 0.4,   // 51-90% clouds
    OVERCAST: 0.2,        // 91-100% clouds
  },
  // Temperature impact (based on solar panel temperature coefficient)
  TEMP_IMPACT: {
    OPTIMAL: 1.0,         // 25°C (optimal temperature)
    COLD: 0.95,           // < 10°C
    HOT: 0.85,            // > 35°C
  },
  // Rain impact
  RAIN_IMPACT: {
    NONE: 1.0,            // 0% chance
    LIGHT: 0.8,           // 1-30% chance
    MODERATE: 0.6,        // 31-60% chance
    HEAVY: 0.4,           // 61-100% chance
  }
};

async function fetchWeatherData() {
  const response = await fetch(
    `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=47.06149235737582,28.86683069635403&days=7&aqi=no`
  );
  if (!response.ok) throw new Error('Failed to fetch weather data');
  return response.json();
}

function getCloudImpact(cloudCover) {
  if (cloudCover <= 10) return WEATHER_IMPACT.CLOUD_IMPACT.CLEAR;
  if (cloudCover <= 50) return WEATHER_IMPACT.CLOUD_IMPACT.PARTLY_CLOUDY;
  if (cloudCover <= 90) return WEATHER_IMPACT.CLOUD_IMPACT.MOSTLY_CLOUDY;
  return WEATHER_IMPACT.CLOUD_IMPACT.OVERCAST;
}

function getTempImpact(temp) {
  if (temp >= 10 && temp <= 35) {
    // Linear interpolation for temperatures between optimal ranges
    if (temp <= 25) {
      return 1.0 - ((25 - temp) * 0.003); // 0.3% loss per degree below optimal
    } else {
      return 1.0 - ((temp - 25) * 0.01); // 1% loss per degree above optimal
    }
  }
  return temp < 10 ? WEATHER_IMPACT.TEMP_IMPACT.COLD : WEATHER_IMPACT.TEMP_IMPACT.HOT;
}

function getRainImpact(rainChance) {
  if (rainChance <= 0) return WEATHER_IMPACT.RAIN_IMPACT.NONE;
  if (rainChance <= 30) return WEATHER_IMPACT.RAIN_IMPACT.LIGHT;
  if (rainChance <= 60) return WEATHER_IMPACT.RAIN_IMPACT.MODERATE;
  return WEATHER_IMPACT.RAIN_IMPACT.HEAVY;
}

async function calculatePrediction(weatherData, historicalData) {
  // Validate historical data
  if (!historicalData || historicalData.length === 0) {
    throw new Error('No historical data available for predictions');
  }

  // Filter out invalid data points and calculate average
  const validHistoricalData = historicalData.filter(data => 
    data && 
    data.data && 
    typeof data.data.pv_input_power === 'number' && 
    !isNaN(data.data.pv_input_power)
  );

  if (validHistoricalData.length === 0) {
    throw new Error('No valid historical power data available');
  }

  // Calculate base power from historical data
  const historicalAvg = validHistoricalData.reduce((sum, data) => sum + data.data.pv_input_power, 0) / validHistoricalData.length;
  const basePower = Math.max(200, historicalAvg); // Minimum 200W baseline

  // Calculate predictions for each day
  const predictions = weatherData.forecast.forecastday.map(day => {
    // Ensure we have the required data
    if (!day || !day.day) {
      throw new Error('Invalid weather data structure');
    }

    const cloudCover = day.day.cloud || 0;
    const rainChance = day.day.daily_chance_of_rain || 0;
    const avgTemp = ((day.day.maxtemp_c || 0) + (day.day.mintemp_c || 0)) / 2;
    
    // Validate weather data
    if (typeof cloudCover !== 'number' || typeof rainChance !== 'number' || typeof avgTemp !== 'number') {
      console.error('Weather data validation failed:', { cloudCover, rainChance, avgTemp });
      throw new Error('Invalid weather data received');
    }
    
    // Calculate weather impact factors
    const cloudImpact = getCloudImpact(cloudCover);
    const tempImpact = getTempImpact(avgTemp);
    const rainImpact = getRainImpact(rainChance);
    
    // Calculate final prediction with all factors
    const weatherFactor = cloudImpact * tempImpact * rainImpact;
    const predictedPower = Math.round(basePower * weatherFactor);
    
    // Calculate confidence based on weather stability
    const weatherStability = 1 - (Math.abs(cloudImpact - 1) + Math.abs(tempImpact - 1) + Math.abs(rainImpact - 1)) / 3;
    const confidence = 0.7 + (weatherStability * 0.3);
    
    return {
      date: new Date(day.date),
      predictedPower,
      weatherData: day,
      confidence: Math.round(confidence * 100) / 100,
      factors: {
        cloudImpact,
        tempImpact,
        rainImpact
      }
    };
  });
  
  return predictions;
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const now = new Date();
    
    // Check for cached predictions
    const cachedPredictions = await db.collection('predictions')
      .find({
        date: { $gte: now },
        lastUpdated: { $gte: new Date(now.getTime() - CACHE_DURATION) }
      })
      .sort({ date: 1 })
      .toArray();
    
    if (cachedPredictions.length === 7) {
      return NextResponse.json(cachedPredictions);
    }
    
    // Fetch fresh weather data
    const weatherData = await fetchWeatherData();
    
    // Get historical power data for the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const historicalData = await db.collection('solar_data')
      .find({ timestamp: { $gte: thirtyDaysAgo } })
      .toArray();
    
    // Calculate new predictions
    const predictions = await calculatePrediction(weatherData, historicalData);
    
    // Store predictions in database
    const bulkOps = predictions.map(prediction => ({
      updateOne: {
        filter: { date: prediction.date },
        update: { $set: prediction },
        upsert: true
      }
    }));
    
    if (bulkOps.length > 0) {
      await db.collection('predictions').bulkWrite(bulkOps);
    }
    
    return NextResponse.json(predictions);
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate predictions' },
      { status: 500 }
    );
  }
} 