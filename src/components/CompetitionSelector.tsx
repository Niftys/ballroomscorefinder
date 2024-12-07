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
    <div className="flex flex-col items-center space-y-4 w-full sm:w-1/3 max-w-4xl mx-auto">
      <select
        id="competitionSelect"
        multiple
        value={selectedCompetitions}
        onChange={handleChange}
        className="text-center w-full p-3 bg-gray-800 border border-gray-500 rounded-lg hover:ring-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus-transition:200"
      >
        {competitions.map((competition, index) => (
          <option key={index} value={competition.name}>
            {competition.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSelectAll}
        className="bg-gray-500 hover:bg-gray-600 transition duration-200 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gold-300 shadow-md w-full"
      >
        Select All (not recommended)
      </button>
    </div>
  );
};

export default CompetitionSelector;