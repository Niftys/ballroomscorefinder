import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';

interface AutocompleteFieldProps {
  placeholder: string;
  yort: string;
  fetchUrl: string;
  onSelect: (value: string) => void;
  value?: string;
  allowFreeInput?: boolean;
  onKeyPress?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

interface Suggestion {
  id: number;
  name: string;
}

const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  placeholder,
  yort,
  fetchUrl,
  onSelect,
  value = '',
  onKeyPress,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value) {
      fetch(`${fetchUrl}?${yort}=${encodeURIComponent(value)}`)
        .then((res) => res.json())
        .then((data) => {
          console.log('Suggestions data:', data);
          setSuggestions(data); // Ensure you set the dynamic results from the API
        })
        .catch((error) => {
          console.error('Error fetching suggestions:', error);
        });
    } else {
      setSuggestions([]);
    }
  }, [value, fetchUrl]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSelect(e.target.value); // Update temporary state
    setShowSuggestions(!!e.target.value); // Show suggestions if input exists
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    onSelect(suggestion.name); // Select the name of the suggestion
    setShowSuggestions(false); // Hide suggestions after selecting one
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyPress={onKeyPress}
        className="p-3 bg-gray-800 border border-gray-500 hover:border-gold-500 hover:ring-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500 rounded-lg w-full"
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // Delay for better user experience
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute bg-gray-700 text-white border border-gray-500 rounded-lg w-full mt-1 max-h-40 overflow-y-auto z-10">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="p-2 hover:bg-gray-600 cursor-pointer"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteField;
