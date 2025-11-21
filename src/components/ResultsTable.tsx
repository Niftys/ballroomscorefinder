import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CompetitorData {
  placement: number;
  person_name: string;
  style_name: string;
  comp_name: string;
}

interface ResultsTableProps {
  results: CompetitorData[];
  itemsPerPage?: number;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, itemsPerPage = 50 }) => {
  const [sortedResults, setSortedResults] = useState<CompetitorData[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof CompetitorData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
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
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Memoized sorting logic
  const sortedData = useMemo(() => {
    return [...results].sort((a, b) => {
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
  }, [results, sortColumn, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = sortedData.slice(startIndex, endIndex);

  // Reset to first page when results change
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  // Pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <motion.div
      className="w-full shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* Results info */}
      <div className="mb-4 flex justify-between items-center text-sm text-purple-300/80">
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {sortedData.length} results
        </span>
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Table */}
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
            {paginatedResults.map((competitor, index) => (
              <motion.tr
                key={startIndex + index}
                className="hover:bg-purple-900/10 border-t border-purple-600/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2">
          <motion.button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 bg-purple-800/50 hover:bg-purple-700/70 disabled:bg-gray-700/50 disabled:cursor-not-allowed rounded-lg text-gold-100 transition-colors"
            whileHover={{ scale: currentPage > 1 ? 1.05 : 1 }}
            whileTap={{ scale: currentPage > 1 ? 0.95 : 1 }}
          >
            <ChevronLeft size={16} />
            Previous
          </motion.button>

          <div className="flex gap-1">
            {getPageNumbers().map((page) => (
              <motion.button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-gold-600 text-purple-900 font-semibold'
                    : 'bg-purple-800/50 hover:bg-purple-700/70 text-gold-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {page}
              </motion.button>
            ))}
          </div>

          <motion.button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 bg-purple-800/50 hover:bg-purple-700/70 disabled:bg-gray-700/50 disabled:cursor-not-allowed rounded-lg text-gold-100 transition-colors"
            whileHover={{ scale: currentPage < totalPages ? 1.05 : 1 }}
            whileTap={{ scale: currentPage < totalPages ? 0.95 : 1 }}
          >
            Next
            <ChevronRight size={16} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default ResultsTable;
