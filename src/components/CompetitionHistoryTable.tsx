import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CompetitionHistoryData {
  competition_name: string;
  placements: { placement: number; count: number }[];
  total_entries: number;
}

interface CompetitionHistoryTableProps {
  data: CompetitionHistoryData[];
  itemsPerPage?: number;
}

const CompetitionHistoryTable: React.FC<CompetitionHistoryTableProps> = ({ 
  data, 
  itemsPerPage = 25 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof CompetitionHistoryData>('competition_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sort data with useMemo for performance
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'competition_name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (field: keyof CompetitionHistoryData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  if (!data || data.length === 0) {
    return <p className="text-center text-gray-400">No competition history found.</p>;
  }

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

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-800/50 scrollbar-track-gray-900/30 border border-purple-600/30 rounded-lg">
        <table className="w-full bg-gray-900/70">
          <thead className="bg-purple-900/20 sticky top-0">
            <tr>
              <motion.th
                className="px-4 py-3 text-left text-gold-300 font-semibold cursor-pointer select-none hover:bg-purple-900/10 transition-colors"
                onClick={() => handleSort('competition_name')}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2">
                  Competition Name {sortField === 'competition_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </div>
              </motion.th>
              <th className="px-4 py-3 text-left text-gold-300 font-semibold">
                Placements
              </th>
              <motion.th
                className="px-4 py-3 text-left text-gold-300 font-semibold cursor-pointer select-none hover:bg-purple-900/10 transition-colors"
                onClick={() => handleSort('total_entries')}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2">
                  Total Entries {sortField === 'total_entries' && (sortDirection === 'asc' ? '↑' : '↓')}
                </div>
              </motion.th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((competition, index) => (
              <motion.tr
                key={index}
                className="hover:bg-purple-900/10 border-t border-purple-600/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td className="px-4 py-3 text-gold-100">{competition.competition_name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {competition.placements.map((placement, idx) => (
                      <motion.span 
                        key={idx}
                        className="bg-purple-600/80 hover:bg-purple-500/80 text-white px-2 py-1 rounded text-sm transition-colors"
                        title={`${placement.count} time${placement.count > 1 ? 's' : ''} placed ${placement.placement}${placement.placement === 1 ? 'st' : placement.placement === 2 ? 'nd' : placement.placement === 3 ? 'rd' : 'th'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {placement.placement}{placement.placement === 1 ? 'st' : placement.placement === 2 ? 'nd' : placement.placement === 3 ? 'rd' : 'th'} × {placement.count}
                      </motion.span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gold-100">{competition.total_entries}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
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

export default CompetitionHistoryTable;
