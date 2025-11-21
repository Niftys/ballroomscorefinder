import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AutocompleteFieldProps {
  placeholder: string;
  fetchUrl: string;
  onSelect: (value: string) => void;
  value: string;
  allowFreeInput?: boolean;
  queryParam?: string;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  minCharacters?: number;
  debounceMs?: number;
}

// Cache for autocomplete suggestions
const suggestionCache = new Map<string, { data: string[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  placeholder,
  fetchUrl,
  onSelect,
  value,
  allowFreeInput = false,
  queryParam,
  onKeyPress,
  minCharacters = 2,
  debounceMs = 300,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external value
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Optimized fetch with caching, debouncing, and request cancellation
  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    const cacheKey = `${fetchUrl}:${trimmedQuery}`;
    
    // Check cache first
    const cached = suggestionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setSuggestions(cached.data);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setIsFetching(true);
      const queryKey = queryParam || 'q';
      const response = await fetch(`${fetchUrl}?${queryKey}=${encodeURIComponent(trimmedQuery)}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        console.error('Autocomplete fetch error:', response.status);
        setSuggestions([]);
        return;
      }
      
      const result = await response.json();
      let data;
      
      // Handle different response formats
      if (result.body) {
        data = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      } else {
        data = result;
      }
      
      // Extract names if array of objects, otherwise use as is
      let names: string[] = [];
      if (Array.isArray(data)) {
        names = data.map((item: any) => {
          // Handle both object and string responses
          if (typeof item === 'string') return item;
          return item.name || item.style || item.value || item.label || '';
        }).filter(Boolean);
      }
      
      // Cache the results
      suggestionCache.set(cacheKey, { data: names, timestamp: Date.now() });
      setSuggestions(names);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsFetching(false);
    }
  }, [fetchUrl, queryParam]);

  // Debounced fetch with minimum character threshold
  useEffect(() => {
    if (!inputValue || inputValue.trim().length < minCharacters) {
      setSuggestions([]);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      fetchSuggestions(inputValue);
    }, debounceMs);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, fetchSuggestions, minCharacters, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    if (allowFreeInput) {
      // Only sync with parent if free input is allowed
      onSelect(newValue);
    }
  };

  const handleSelect = (val: string) => {
    setInputValue(val);
    setShowSuggestions(false);
    onSelect(val); // Update parent state
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          handleInputChange(e.target.value);
          setShowSuggestions(true);
        }}
        onBlur={() => {
          // If free input is allowed, sync with parent on blur
          if (allowFreeInput && inputValue !== value) {
            onSelect(inputValue.trim());
          }
          
          // Delayed hide to allow for click on suggestion
          setTimeout(() => {
            setShowSuggestions(false);
          }, 150);
        }}
        onFocus={() => {
          // Only show suggestions if we have any or we're actively fetching
          if (suggestions.length > 0 || isFetching) {
            setShowSuggestions(true);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            
            if (allowFreeInput) {
              onSelect(inputValue.trim());
            }
            
            setShowSuggestions(false);
            
            // Pass the event to parent
            if (onKeyPress) {
              onKeyPress(e);
            }
          }
        }}
        className="p-3 bg-gray-900/80 border border-purple-600/30 rounded-lg text-gold-100 placeholder-purple-400/60 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all w-full"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-[150] w-full bg-gray-900 border border-purple-600/30 rounded-md mt-1 max-h-60 overflow-y-auto shadow-xl">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-2 hover:bg-purple-700 cursor-pointer"
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
