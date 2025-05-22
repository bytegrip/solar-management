'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

export default function PowerPredictionGraph() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch('/api/predictions');
        if (!response.ok) throw new Error('Failed to fetch predictions');
        const data = await response.json();
        setPredictions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <Card className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700">
        <div className="flex items-center justify-center h-64">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
            </div>
          </motion.div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error loading predictions</div>
        </div>
      </Card>
    );
  }

  if (!predictions?.length) {
    return null;
  }

  const chartData = predictions.map(pred => ({
    date: new Date(pred.date).toLocaleDateString('en-US', { weekday: 'short' }),
    predicted: pred.predictedPower,
    confidence: pred.confidence * 100
  }));

  return (
    <Card className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
      <h2 className="text-lg font-semibold text-white mb-4">7-Day Power Generation Forecast</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
              label={{ 
                value: 'Power (W)', 
                angle: -90, 
                position: 'insideLeft',
                fill: '#9CA3AF'
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.375rem',
                color: '#F3F4F6'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted Power"
              stroke="#60A5FA"
              strokeWidth={2}
              dot={{ fill: '#60A5FA', strokeWidth: 2 }}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              name="Confidence %"
              stroke="#34D399"
              strokeWidth={2}
              dot={{ fill: '#34D399', strokeWidth: 2 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
} 