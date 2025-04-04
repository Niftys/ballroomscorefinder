import React, { ChangeEvent, KeyboardEvent, useCallback } from 'react';
import AutocompleteField from './AutocompleteField';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const inputClassName = "p-3 bg-gray-900/80 border border-purple-600/30 rounded-lg text-gold-100 placeholder-purple-400/60 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all w-full";

interface SearchFieldsProps {
  searchParams: Record<string, string>;
  setSearchParams: (params: (prev: Record<string, string>) => Record<string, string>) => void;
  selectedCompetitions: string[];
  onSearch: () => void;
}

const SearchFields: React.FC<SearchFieldsProps> = ({
  searchParams,
  setSearchParams,
  onSearch,
}) => {
  const handleInputChange = useCallback((field: string, value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      [field]: value
    }));
  }, [setSearchParams]);

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch(); // trigger search with freshest state
    }
  };  

  return (
    <div className="flex w-full gap-4">
      {/* Competitor Input */}
      <div className="flex-1">
        <AutocompleteField
          placeholder="Enter Name"
          fetchUrl={`${BASE_URL}/fetchCompetitors`}
          queryParam="competitor"
          onSelect={(value) => handleInputChange('competitor', value)}
          value={searchParams.competitor || ''}
          allowFreeInput={true}
          onKeyPress={handleKeyPress}
        />
      </div>

      {/* Style Input */}
      <div className="flex-1">
        <AutocompleteField
          placeholder="Enter Style"
          fetchUrl={`${BASE_URL}/fetchStyles`}
          queryParam="style"
          onSelect={(value) => handleInputChange('style', value)}
          value={searchParams.style || ''}
          allowFreeInput={true}
          onKeyPress={handleKeyPress}
        />
      </div>

      {/* Score Input */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Enter Score"
          value={searchParams.score || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleInputChange('score', e.target.value)
          }
          onKeyPress={handleKeyPress}
          className={inputClassName}
        />
      </div>
    </div>
  );
};

export default SearchFields;
