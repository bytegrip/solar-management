import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  predictedPower: {
    type: Number,
    required: true
  },
  weatherData: {
    type: Object,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient querying
predictionSchema.index({ date: 1, lastUpdated: 1 });

export const Prediction = mongoose.models.Prediction || mongoose.model('Prediction', predictionSchema); 