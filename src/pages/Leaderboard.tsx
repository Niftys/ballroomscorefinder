import React from 'react';
import LeaderboardTable from '../components/LeaderboardTable';

const Leaderboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-400 text-gray-100 p-8">
      <LeaderboardTable />
    </div>
  );
};

export default Leaderboard;
