import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

async function fetchWeatherData() {
  const response = await fetch(
    `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=47.06149235737582,28.86683069635403&days=7&aqi=no`
  );
  if (!response.ok) throw new Error('Failed to fetch weather data');
  return response.json();
}

async function calculatePrediction(weatherData, historicalData) {
  // Simple prediction model based on weather conditions and historical data
  const predictions = weatherData.forecast.forecastday.map(day => {
    const cloudCover = day.day.cloud;
    const rainChance = day.day.daily_chance_of_rain;
    const avgTemp = (day.day.maxtemp_c + day.day.mintemp_c) / 2;
    
    // Base prediction on historical average
    const historicalAvg = historicalData.reduce((sum, data) => sum + data.power, 0) / historicalData.length;
    
    // Adjust based on weather conditions
    let weatherFactor = 1.0;
    weatherFactor *= (100 - cloudCover) / 100; // Less clouds = more power
    weatherFactor *= (100 - rainChance) / 100; // Less rain = more power
    weatherFactor *= Math.min(1, 1 - Math.abs(avgTemp - 25) / 50); // Optimal temperature around 25°C
    
    const predictedPower = historicalAvg * weatherFactor;
    const confidence = 0.7 + (weatherFactor * 0.3); // Higher confidence for better weather conditions
    
    return {
      date: new Date(day.date),
      predictedPower: Math.round(predictedPower * 100) / 100,
      weatherData: day,
      confidence: Math.round(confidence * 100) / 100
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
    const historicalData = await db.collection('power')
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
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
} 