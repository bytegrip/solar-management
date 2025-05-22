import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

const CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
const COORDS = {
  lat: 47.06149235737582,
  lon: 28.86683069635403
}

async function fetchWeatherFromAPI() {
  const response = await fetch(
    `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${COORDS.lat},${COORDS.lon}&days=7&aqi=no`
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data')
  }
  
  return response.json()
}

export async function GET() {
  try {
    // Ensure database connection
    const { db } = await connectToDatabase()

    // Check if we have cached data
    const cachedWeather = await db.collection('weather').findOne({
      'location.lat': COORDS.lat,
      'location.lon': COORDS.lon
    })

    const now = new Date()
    const isCacheValid = cachedWeather && 
      (now - new Date(cachedWeather.lastUpdated)) < CACHE_DURATION

    // If cache is valid, return cached data
    if (isCacheValid) {
      return NextResponse.json(cachedWeather)
    }

    // If no cache or cache is invalid, fetch fresh data
    const weatherData = await fetchWeatherFromAPI()
    
    // Add metadata to the weather data
    const weatherWithMetadata = {
      ...weatherData,
      location: COORDS,
      lastUpdated: now
    }

    // Update or create weather document
    await db.collection('weather').updateOne(
      {
        'location.lat': COORDS.lat,
        'location.lon': COORDS.lon
      },
      { $set: weatherWithMetadata },
      { upsert: true }
    )

    return NextResponse.json(weatherWithMetadata)
  } catch (error) {
    console.error('Weather API Error:', error)
    // If we have cached data but failed to fetch new data, return cached data
    if (cachedWeather) {
      return NextResponse.json(cachedWeather)
    }
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
} 