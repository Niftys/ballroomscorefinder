import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

interface CompetitorData {
  competitor: string;
  place_count: number;
}

const LeaderboardTable: React.FC = () => {
  const [data, setData] = useState<CompetitorData[]>([]);
  const [placement, setPlacement] = useState<string>('1');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/fetchTotalPlacements?placement=${placement}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        console.log("Raw API Response:", result);

        const data = JSON.parse(result.body);
        setData(data); // Set the array of competitors
        setError(null);
      } catch (err) {
        console.error('Error fetching top competitors:', err);
        setError('An error occurred while fetching the data.');
        setData([]);
      }
    };

    fetchLeaderboardData();
  }, [placement]);

  return (
    <motion.div 
      className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-2xl border border-purple-600/30 overflow-hidden p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <motion.h1
          className="text-3xl font-bold text-gold-300"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Placements Leaderboard
        </motion.h1>
        <motion.button
          onClick={() => (window.location.href = '/')}
          className="bg-gradient-to-r from-purple-700/80 to-purple-800/90 hover:from-purple-800 hover:to-purple-900 px-5 py-2.5 rounded-lg font-semibold shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Search
        </motion.button>
      </div>

      {/* Placement Buttons */}
      <motion.div
        className="flex flex-wrap gap-2 mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {Array.from({ length: 8 }, (_, i) => i + 1).map((place) => (
          <motion.button
            key={place}
            onClick={() => setPlacement(String(place))}
            className={`px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 ${
              placement === String(place)
                ? 'bg-gradient-to-r from-gold-600 to-gold-700 text-purple-900'
                : 'bg-gray-800/50 text-gold-100 hover:bg-gray-700/50'
            }`}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            {place}{place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} Place
          </motion.button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        className="border border-purple-600/30 rounded-lg overflow-hidden max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-800/50 scrollbar-track-gray-900/30"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <table className="w-full bg-gray-900/70">
          <thead className="bg-purple-900/20 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-gold-300 font-semibold">Competitor</th>
              <th className="px-4 py-3 text-left text-gold-300 font-semibold">Placements</th>
            </tr>
          </thead>
          <tbody>
            {data.map((competitor, index) => (
              <motion.tr
                key={index}
                className="hover:bg-purple-900/10 border-t border-purple-600/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="px-4 py-3 text-gold-100">{competitor.competitor}</td>
                <td className="px-4 py-3 text-gold-100">{competitor.place_count}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
};

export default LeaderboardTable;
