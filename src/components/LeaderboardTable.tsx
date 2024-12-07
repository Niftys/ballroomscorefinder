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
      className="max-w-4xl mx-auto bg-gray-800 bg-opacity-50 rounded-lg shadow-lg overflow-hidden p-6"
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Back to Home Button */}
      <motion.button
        onClick={() => (window.location.href = '/')}
        className="bg-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition duration-200 shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ease: 'easeOut', duration: 0.5 }}
      >
        Back to Home
      </motion.button>

      {/* Title Animation */}
      <motion.h1
        className="text-4xl font-bold text-center mb-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Leaderboard
      </motion.h1>

      {/* Placement Buttons Animation */}
      <motion.div
        className="overflow-x-auto sm:overflow-hidden flex justify-start mb-4 space-x-2 px-4 py-2 sm:px-0"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {Array.from({ length: 8 }, (_, i) => i + 1).map((place) => (
          <motion.button
            key={place}
            onClick={() => setPlacement(String(place))}
            className={`min-w-[90px] sm:min-w-screen sm:px-4 px-2 py-2 rounded-lg font-semibold shadow-md text-center 
              ${placement === String(place)
                ? 'bg-purple-700 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-[#5a3e95]'
              }`}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }} // Slight scale down on click
            transition={{ ease: 'easeOut', duration: 0.1 }}
          >
            {place}{place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} Place
          </motion.button>
        ))}
      </motion.div>

      {/* Error Handling Animation */}
      {error && (
        <motion.p
          className="text-red-500 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {error}
        </motion.p>
      )}

      {/* Results Table Animation */}
      <motion.div
        className="max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-auto border border-gray-700 rounded-lg scrollbar-thin scrollbar-thumb-purple-800 scrollbar-track-gray-700"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <table className="table-auto w-full text-sm sm:text-base">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Competitor</th>
              <th className="px-4 py-2 text-left">Placement Count</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((competitor, index) => (
                <motion.tr
                  key={index}
                  className="hover:bg-gray-600"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }} // Staggered animation for each row
                >
                  <td className="px-4 py-2">{competitor.competitor}</td>
                  <td className="px-4 py-2">{competitor.place_count}</td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-4 py-2 text-center text-gray-400">
                  No data available for {placement}{placement === '1' ? 'st' : placement === '2' ? 'nd' : placement === '3' ? 'rd' : 'th'} place
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
};

export default LeaderboardTable;
