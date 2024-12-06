import React, { useEffect, useState } from 'react';

interface Competition {
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
        const response = await fetch('http://18.217.200.160/fetchCompetitions.php');
        if (!response.ok) {
          throw new Error('Failed to fetch competitions');
        }
        const data = await response.json();
        setCompetitions(data);
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
    <div className="flex flex-col items-center space-y-4">
      <select
        id="competitionSelect"
        multiple
        value={selectedCompetitions}
        onChange={handleChange}
        className="w-full p-3 bg-gray-800 border border-gray-500 rounded-lg hover:ring-gold-500"
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
        className="bg-gray-500 hover:bg-gray-600 transition duration-200 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gold-300 shadow-md"
      >
        Select All (not recommended)
      </button>
    </div>
  );
};

export default CompetitionSelector;
