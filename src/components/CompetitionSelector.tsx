import React, { useEffect, useState, useRef } from 'react';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5001/ballroom-score-finder/us-central1';

interface Competition {
  id: string;
  name: string;
}

interface CompetitionSelectorProps {
  onSelectionChange: (selectedCompetitions: string[]) => void;
}

// Cache for competitions list
let competitionsCache: Competition[] | null = null;
let competitionsCacheTimestamp: number = 0;
const COMPETITIONS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const CompetitionSelector: React.FC<CompetitionSelectorProps> = ({ onSelectionChange }) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      // Check cache first
      if (competitionsCache && Date.now() - competitionsCacheTimestamp < COMPETITIONS_CACHE_DURATION) {
        setCompetitions(competitionsCache);
        setLoading(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/fetchCompetitions`, {
          signal: abortControllerRef.current.signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch competitions');
        }

        const result = await response.json();
        // Firebase Functions return data directly, not wrapped in a body
        setCompetitions(result);
        
        // Cache the results
        competitionsCache = result;
        competitionsCacheTimestamp = Date.now();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, ignore
          return;
        }
        console.error('Error fetching competitions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSelectAll = () => {
    const allCompetitionNames = competitions.map((competition) => competition.name);
    setSelectedCompetitions(allCompetitionNames);
    onSelectionChange(allCompetitionNames);
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions).map((option) => option.value);
    setSelectedCompetitions(selectedOptions);
    onSelectionChange(selectedOptions);
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full z-[1001]">
      {loading ? (
        <div className="w-full p-3 bg-gray-900/80 border border-purple-600/30 rounded-lg text-gold-100 text-center">
          Loading competitions...
        </div>
      ) : (
        <select
          id="competitionSelect"
          multiple
          value={selectedCompetitions}
          onChange={handleChange}
          aria-label="Select competitions"
          className=" z-[1001] w-full p-3 bg-gray-900/80 border border-purple-600/30 rounded-lg text-gold-100 focus:outline-none focus:ring-2 focus:ring-gold-500 scrollbar-thin scrollbar-thumb-purple-800/50 scrollbar-track-gray-900 hover:border-gold-500 transition-colors"
        >
          {competitions.map((competition, index) => (
            <option
              key={index}
              value={competition.name}
              className={`z-[1001] px-4 py-2 transition-colors ${
                selectedCompetitions.includes(competition.name)
                  ? 'bg-purple-900/20 text-gold-400' // Selected style
                  : 'bg-gray-900 text-gold-100 hover:bg-purple-900/20' // Default style
              }`}
            >
              {competition.name}
            </option>
          ))}
        </select>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          #competitionSelect option:checked {
            background-color: rgba(91, 33, 182, 0.2) !important;
            color: #facc15 !important;
          }
        `
      }} />

      <button
        type="button"
        onClick={handleSelectAll}
        className="w-full bg-purple-800 hover:bg-purple-900 px-6 py-3 rounded-lg font-semibold text-gold-100 shadow-lg transition-all"
      >
        Select All Competitions
      </button>
    </div>
  );
};

export default CompetitionSelector;
