import React, { useState, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import AutocompleteField from './AutocompleteField';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

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
      <div className="w-full">
        <AutocompleteField
          placeholder="Enter Competitor"
          fetchUrl={`${BASE_URL}/fetchCompetitors`}
          onSelect={(value) => handleInputChange('competitor', value)}
          value={fields.competitor || ''}
          allowFreeInput
          onKeyPress={handleKeyPress} // Search on Enter
        />
      </div>

      {/* Style Input */}
      <div className="w-full">
        <AutocompleteField
          placeholder="Enter Style"
          fetchUrl={`${BASE_URL}/fetchStyles`}
          onSelect={(value) => handleInputChange('style', value)}
          value={fields.style || ''}
          allowFreeInput
          onKeyPress={handleKeyPress} // Search on Enter
        />
      </div>

      {/* Score Input */}
      <div className="w-full">
        <input
          type="text"
          placeholder="Enter Score"
          value={fields.score || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleInputChange('score', e.target.value)
          }
          onKeyPress={handleKeyPress} // Search on Enter
          className="p-3 bg-gray-800 border border-gray-500 hover:border-gold-500 hover:ring-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500 rounded-lg w-full"
        />
      </div>
    </div>
  );
};

export default SearchFields;
