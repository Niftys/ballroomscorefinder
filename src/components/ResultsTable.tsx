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

  // Load more data when user scrolls to the bottom
  const loadMoreData = useCallback(() => {
    if (loading) return; // Prevent multiple requests while loading

    setLoading(true);
    // Logic to fetch more data here (mocked for now)
    setTimeout(() => {
      const newData = [
        { placement: 9, person_name: 'Competitor 9', style_name: 'Style 1', comp_name: 'Comp 1' },
        { placement: 10, person_name: 'Competitor 10', style_name: 'Style 2', comp_name: 'Comp 2' },
      ];
      setSortedResults((prevData) => [...prevData, ...newData]);
      setLoading(false);
    }, 1000);
  }, [loading]);

  // Sort results based on the selected column
  const handleHeaderClick = (column: keyof CompetitorData) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    // Apply sorting when the sort column or direction changes
    const sortedData = [...results].sort((a, b) => {
      if (!sortColumn) return 0;

      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
      return aValue > bValue ? directionMultiplier : -directionMultiplier;
    });

    setSortedResults(sortedData);
  }, [results, sortColumn, sortDirection]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const bottom = e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.clientHeight;
    if (bottom) {
      loadMoreData(); // Load more data when scrolled to bottom
    }
  };

  return (
    <motion.div
      className="mt-6 w-full shadow-lg text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar scrollbar-thumb-purple-800 scrollbar-track-gray-700">
        <table className="table-auto w-full min-w-max border-collapse border border-opacity-0 shadow-lg bg-gray-700 bg-opacity-70">
          <thead>
            <tr className="bg-gray-800 text-gray-200">
              {['Placement', 'Competitor', 'Style', 'Competition'].map((label, index) => (
                <motion.th
                  key={index}
                  className="px-4 py-2 border border-gray-500 border-opacity-50 cursor-pointer text-sm sm:text-base"
                  onClick={() => handleHeaderClick(label.toLowerCase() as keyof CompetitorData)}
                  whileHover={{ scale: 1.05 }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                >
                  {label}
                  {sortColumn === label.toLowerCase() && (sortDirection === 'asc' ? '▲' : '▼')}
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
