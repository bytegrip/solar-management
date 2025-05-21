import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get('timeRange') || '1d'
  const dataType = searchParams.get('dataType') || 'all'

  try {
    await client.connect()
    const db = client.db('solar')
    const collection = db.collection('solar_data')

    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case '1d':
        startDate.setDate(now.getDate() - 1)
        break
      case '3d':
        startDate.setDate(now.getDate() - 3)
        break
      case '1w':
        startDate.setDate(now.getDate() - 7)
        break
      case '1m':
        startDate.setMonth(now.getMonth() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 1)
    }

    let query = {
      timestamp: { $gte: startDate }
    }

    if (dataType === 'day') {
      query['$expr'] = {
        $and: [
          { $gte: [{ $hour: '$timestamp' }, 6] },
          { $lt: [{ $hour: '$timestamp' }, 18] }
        ]
      }
    } else if (dataType === 'night') {
      query['$expr'] = {
        $or: [
          { $lt: [{ $hour: '$timestamp' }, 6] },
          { $gte: [{ $hour: '$timestamp' }, 18] }
        ]
      }
    }

    const data = await collection.find(query).sort({ timestamp: 1 }).toArray()
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  } finally {
    await client.close()
  }
} 