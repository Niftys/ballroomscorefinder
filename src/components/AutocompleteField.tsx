import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';

interface AutocompleteFieldProps {
  placeholder: string; // Placeholder text for the input field
  fetchUrl: string; // URL to fetch suggestions
  onSelect: (value: string) => void; // Callback when a suggestion is selected
  value?: string; // Current value of the input field
  allowFreeInput?: boolean; // Whether free typing is allowed
  onKeyPress?: (event: KeyboardEvent<HTMLInputElement>) => void; // Callback for key press events
}

const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  placeholder,
  fetchUrl,
  onSelect,
  value = '',
  allowFreeInput = false,
  onKeyPress, // Pass the onKeyPress prop
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value) {
      fetch(`${fetchUrl}?query=${encodeURIComponent(value)}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data))
        .catch((error) => console.error('Error fetching suggestions:', error));
    } else {
      setSuggestions([]);
    }
  }, [value, fetchUrl]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSelect(e.target.value); // Update temporary state
    setShowSuggestions(!!e.target.value); // Show suggestions if input exists
  };
  
  const handleSuggestionSelect = (suggestion: string) => {
    onSelect(suggestion); // Update parent state
    setShowSuggestions(false);
  };  

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyPress={onKeyPress} // Add key press event
        className="p-3 bg-gray-800 border border-gray-500 hover:border-gold-500 hover:ring-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500 rounded-lg w-full"
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute bg-gray-700 text-white border border-gray-500 rounded-lg w-full mt-1 max-h-40 overflow-y-auto z-10">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="p-2 hover:bg-gray-600 cursor-pointer"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteField;