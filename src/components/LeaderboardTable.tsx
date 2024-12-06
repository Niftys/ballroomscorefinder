import React, { useState, useEffect } from 'react';

interface CompetitorData {
  competitor: string;
  place_count: number;
}

const LeaderboardTable: React.FC = () => {
  const [data, setData] = useState<CompetitorData[]>([]);
  const [placement, setPlacement] = useState<string>('1'); // Default to 1st place
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data whenever the placement value changes
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch(
          `http://18.217.200.160/fetchTotalPlacements.php?placement=${placement}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching top competitors:', err);
        setError('An error occurred while fetching the data.');
        setData([]);
      }
    };

    fetchLeaderboardData();
  }, [placement]); // Dependency on placement to refetch data when it changes

  return (
    <div className="max-w-4xl mx-auto bg-gray-800 bg-opacity-50 rounded-lg shadow-lg overflow-hidden p-6">
      <button
        onClick={() => (window.location.href = '/')}
        className="bg-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition duration-200 shadow-md"
      >
        Back to Home
      </button>
      <h1 className="text-4xl font-bold text-center mb-8">Leaderboard</h1>

      {/* Placement Buttons */}
      <div className="flex justify-center mb-6 space-x-2">
        {Array.from({ length: 8 }, (_, i) => i + 1).map((place) => (
          <button
            key={place}
            onClick={() => setPlacement(String(place))}
            className={`px-4 py-2 rounded-lg font-semibold transition duration-200 shadow-md ${
              placement === String(place)
                ? 'bg-purple-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {place}{place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} Place
          </button>
        ))}
      </div>

      {/* Error Handling */}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Results Table */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto border border-gray-700 rounded-lg">
        <table className="table-auto w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Competitor</th>
              <th className="px-4 py-2 text-left">Placement Count</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((competitor, index) => (
                <tr key={index} className="hover:bg-gray-600">
                  <td className="px-4 py-2">{competitor.competitor}</td>
                  <td className="px-4 py-2">{competitor.place_count}</td>
                </tr>
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
      </div>
    </div>
  );
};

export default LeaderboardTable;