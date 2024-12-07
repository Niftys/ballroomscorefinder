import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface CompetitorData {
  placement: number;
  person_name: string;
  style_name: string;
  comp_name: string;
}

interface ResultsTableProps {
  results: CompetitorData[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [sortedResults, setSortedResults] = useState<CompetitorData[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof CompetitorData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);

  // Mapping column names to object keys
  const columnMapping: { [key: string]: keyof CompetitorData } = {
    'Placement': 'placement',
    'Competitor': 'person_name',
    'Style': 'style_name',
    'Competition': 'comp_name',
  };

  // Handle header click for sorting
  const handleHeaderClick = (column: string) => {
    const columnKey = columnMapping[column];
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    // Sort results when column or direction changes
    const sortedData = [...results].sort((a, b) => {
      if (!sortColumn) return 0;

      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

      // Sorting numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * directionMultiplier;
      }

      // Sorting strings (case-insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aNormalized = aValue.toLowerCase();
        const bNormalized = bValue.toLowerCase();
        return aNormalized > bNormalized ? directionMultiplier : -directionMultiplier;
      }

      return 0;
    });

    setSortedResults(sortedData);
  }, [results, sortColumn, sortDirection]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const bottom = e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.clientHeight;
    if (bottom && !loading) {
      setLoading(true);
      // Logic to load more data (pagination) can be placed here
      setLoading(false); // After loading is done
    }
  };

  return (
    <motion.div
      className="mt-6 w-full shadow-lg text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div
        className="overflow-x-auto max-h-96 overflow-y-auto scrollbar scrollbar-thumb-purple-800 scrollbar-track-gray-700"
        onScroll={handleScroll}
      >
        <table className="table-auto w-full min-w-max border-collapse border border-opacity-0 shadow-lg bg-gray-700 bg-opacity-70">
          <thead>
            <tr className="bg-gray-800 text-gray-200">
              {['Placement', 'Competitor', 'Style', 'Competition'].map((label, index) => (
                <motion.th
                  key={index}
                  className="px-4 py-2 border border-gray-500 border-opacity-50 cursor-pointer text-sm sm:text-base"
                  onClick={() => handleHeaderClick(label)}
                  whileHover={{ scale: 1.05 }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                >
                  {label}
                  {sortColumn === columnMapping[label] && (sortDirection === 'asc' ? '▲' : '▼')}
                </motion.th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedResults.length > 0 ? (
              sortedResults.map((competitor, index) => (
                <motion.tr
                  key={index}
                  className="hover:bg-gray-600"
                  initial={{ opacity: 0, y: 10 }} // Initial hidden state
                  animate={{ opacity: 1, y: 0 }}   // Fade and slide up animation
                  transition={{ delay: index * 0.05, duration: 0.3 }} // Stagger animation for rows
                >
                  <td className="px-4 py-2 text-sm sm:text-base">{competitor.placement}</td>
                  <td className="px-4 py-2 text-sm sm:text-base">{competitor.person_name}</td>
                  <td className="px-4 py-2 text-sm sm:text-base">{competitor.style_name}</td>
                  <td className="px-4 py-2 text-sm sm:text-base">{competitor.comp_name}</td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-2 text-center text-gray-400">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ResultsTable;
