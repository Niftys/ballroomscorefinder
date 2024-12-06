import React, { useState, useEffect } from 'react';
import CompetitionSelector from '../components/CompetitionSelector';
import SearchFields from '../components/SearchFields';
import ResultsTable from '../components/ResultsTable';
import Analytics from '../components/Analytics';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useState<Record<string, string>>({
    competitor: '',
    style: '',
    score: '',
  });
  const [viewAnalytics, setViewAnalytics] = useState<boolean>(false); // Toggle for analytics view
  const [error, setError] = useState<string | null>(null); // Store error messages

  const handleCompetitionChange = (selected: string[]) => {
    setSelectedCompetitions(selected);
  };

  // This function is triggered when the search button is clicked
  const handleSearch = async () => {
    if (selectedCompetitions.length === 0) {
      alert('Please select at least one competition.');
      return;
    }

    setLoading(true);
    try {
      // Construct the query string for the API
      const queryString = new URLSearchParams({
        ...searchParams, // Use the latest searchParams state
        competition: selectedCompetitions.join(','),
      }).toString();

      console.log(`Fetching data with query: http://18.217.200.160/fetchData.php?${queryString}`);

      const response = await fetch(`http://18.217.200.160/fetchData.php?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch competition results');
      }
      const data = await response.json();
      setResults(data);
      setViewAnalytics(false);
    } catch (error) {
      console.error('Error fetching competition results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle analytics view toggle
  const handleAnalyticsClick = () => {
    if (!searchParams.competitor) {
      alert('Please enter a competitor name to view analytics.');
      return;
    }
    setViewAnalytics(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-400 text-gray-100">
      <div className="container mx-auto p-8 flex flex-col items-center space-y-8">
        <h1 className="text-5xl font-extrabold text-white text-center drop-shadow-md">
          Ballroom Score Finder
        </h1>
        <button
          onClick={() => navigate('/leaderboard')}
          className="text-white bg-purple-900 hover:bg-purple-800 px-6 py-3 rounded-lg shadow-lg transition duration-200 font-bold"
        >
          Placements Leaderboard
        </button>
        <CompetitionSelector onSelectionChange={handleCompetitionChange} />
        <div className="container mx-auto flex items-center space-x-5">
          <SearchFields
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            selectedCompetitions={selectedCompetitions}
            onSearch={handleSearch} // Directly call handleSearch when search is triggered
          />

          <button
            onClick={handleSearch} // Ensure handleSearch is called with the latest searchParams
            className="bg-gold-600 text-white px-6 py-3 rounded-lg hover:bg-gold-500 transition duration-200 shadow-md"
          >
            Search
          </button>

          <button
            onClick={handleAnalyticsClick}
            className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition duration-200 shadow-md"
          >
            Analytics
          </button>
          {viewAnalytics && (
            <button
              onClick={() => setViewAnalytics(false)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-500 transition duration-200 shadow-md"
            >
              Back to Results
            </button>
          )}
        </div>

        {viewAnalytics ? (
          <Analytics
            competitor={searchParams.competitor}
            onDataLoad={(data) => setAnalyticsData(data)}
            onError={(err) => {
              console.error('Error in Analytics:', err);
              setAnalyticsData([]);
              setError(err);
            }}
          />
        ) : loading ? (
          <p className="text-center text-gray-400 mt-8">Loading...</p>
        ) : (
          <ResultsTable results={results} />
        )}
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default Home;
