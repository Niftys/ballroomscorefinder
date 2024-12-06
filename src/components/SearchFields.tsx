import React, { useState, ChangeEvent, useEffect, KeyboardEvent } from 'react';
import AutocompleteField from './AutocompleteField';

interface SearchFieldsProps {
  searchParams: Record<string, string>; // Current search params
  setSearchParams: (params: (prev: Record<string, string>) => Record<string, string>) => void;
  selectedCompetitions: string[]; // List of selected competitions
  onSearch: () => void; // Callback to trigger search
}

const SearchFields: React.FC<SearchFieldsProps> = ({
  searchParams,
  setSearchParams,
  onSearch,
}) => {
  const [fields, setFields] = useState(searchParams);

  // Sync local state with parent state
  useEffect(() => {
    setFields(searchParams);
  }, [searchParams]);

  // Update the local state and parent state when the input changes
  const handleInputChange = (field: string, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value })); // Update local state
    setSearchParams((prev) => ({ ...prev, [field]: value })); // Update parent state
  };

  const handleSearchClick = () => {
    onSearch(); // Simply trigger the parent search callback
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearchClick(); // Trigger the search when Enter is pressed
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {/* Competitor Input */}
      <AutocompleteField
        placeholder="Enter Competitor"
        fetchUrl="http://18.217.200.160/fetchCompetitors.php"
        onSelect={(value) => handleInputChange('competitor', value)}
        value={fields.competitor || ''}
        allowFreeInput
        onKeyPress={handleKeyPress} // Search on Enter
      />

      {/* Style Input */}
      <AutocompleteField
        placeholder="Enter Style"
        fetchUrl="http://18.217.200.160/fetchStyles.php"
        onSelect={(value) => handleInputChange('style', value)}
        value={fields.style || ''}
        allowFreeInput
        onKeyPress={handleKeyPress} // Search on Enter
      />

      {/* Score Input */}
      <input
        type="text"
        placeholder="Enter Score"
        value={fields.score || ''}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          handleInputChange('score', e.target.value)
        }
        onKeyPress={handleKeyPress} // Search on Enter
        className="p-3 bg-gray-800 border border-gray-500 hover:border-gold-500 rounded-lg w-full"
      />
    </div>
  );
};

export default SearchFields;
