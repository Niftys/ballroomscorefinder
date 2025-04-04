import React, { useEffect, useState } from 'react';
import LeaderboardTable from '../components/LeaderboardTable';

const Leaderboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (or connect to real fetch trigger)
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 800); // 800ms delay

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 p-8">
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <LeaderboardTable />
      )}
    </div>
  );
};

export default Leaderboard;
