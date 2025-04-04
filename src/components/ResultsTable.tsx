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
      className="w-full shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-800/50 scrollbar-track-gray-900/30 border border-purple-600/30 rounded-lg">
        <table className="w-full bg-gray-900/70">
          <thead className="bg-purple-900/20 sticky top-0">
            <tr>
              {['Placement', 'Competitor', 'Style', 'Competition'].map((label, index) => (
                <motion.th
                  key={index}
                  className="px-4 py-3 text-left text-gold-300 font-semibold cursor-pointer hover:bg-purple-900/10 transition-colors"
                  onClick={() => handleHeaderClick(label)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-2">
                    {label}
                    {sortColumn === columnMapping[label] && (
                      <span className="text-sm">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </motion.th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((competitor, index) => (
              <motion.tr
                key={index}
                className="hover:bg-purple-900/10 border-t border-purple-600/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="px-4 py-3 text-gold-100">{competitor.placement}</td>
                <td className="px-4 py-3 text-gold-100">{competitor.person_name}</td>
                <td className="px-4 py-3 text-gold-100">{competitor.style_name}</td>
                <td className="px-4 py-3 text-gold-100">{competitor.comp_name}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ResultsTable;
