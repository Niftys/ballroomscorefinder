import React, { useState, useEffect } from 'react';
import CompetitionSelector from '../components/CompetitionSelector';
import SearchFields from '../components/SearchFields';
import ResultsTable from '../components/ResultsTable';
import Analytics from '../components/Analytics';
import { useNavigate } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

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
  const [viewAnalytics, setViewAnalytics] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      const queryString = new URLSearchParams({
        ...searchParams,
        competition: selectedCompetitions.join(','),
      }).toString();
  
      console.log(`Fetching data with query: ${BASE_URL}/fetchData?${queryString}`);
  
      const response = await fetch(`${BASE_URL}/fetchData?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch competition results');
      }
  
      const data = await response.json();
      console.log("API Response:", data);  // Log the data for debugging
  
      // Check if the data has a 'body' string and parse it
      if (data.body) {
        const parsedData = JSON.parse(data.body);  // Parse the 'body' string into JSON
        setResults(parsedData);  // Set the parsed data
      } else {
        // Handle cases where there is no 'body' or unexpected data format
        console.error("Unexpected data format:", data);
        setError("Unexpected data format.");
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching competition results:', error);
      setError('An error occurred while fetching the data.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };  

  // Handle analytics view toggle
  const handleAnalyticsClick = () => {
    alert("Analytics is under construction!");
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
            onSearch={handleSearch} 
          />
          <button
            onClick={handleSearch}
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
