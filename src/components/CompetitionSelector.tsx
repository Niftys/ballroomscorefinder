import React, { useEffect, useState } from 'react';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

interface Competition {
  id: number;
  name: string;
}

interface CompetitionSelectorProps {
  onSelectionChange: (selectedCompetitions: string[]) => void;
}

const CompetitionSelector: React.FC<CompetitionSelectorProps> = ({ onSelectionChange }) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await fetch(`${BASE_URL}/fetchCompetitions`);
        if (!response.ok) {
          throw new Error('Failed to fetch competitions');
        }

        // Parse the body as JSON after extracting it from the response
        const result = await response.json();
        const competitionsData = JSON.parse(result.body); // Parse the 'body' string into JSON
        setCompetitions(competitionsData);  // Set the parsed competitions data
      } catch (error) {
        console.error('Error fetching competitions:', error);
      }
    };

    fetchCompetitions();
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
        className="w-full bg-gradient-to-r from-purple-700/80 to-purple-800/90 hover:from-purple-800 hover:to-purple-900 px-6 py-3 rounded-lg font-semibold text-gold-100 shadow-lg transition-all"
      >
        Select All Competitions
      </button>
    </div>
  );
};

export default CompetitionSelector;
