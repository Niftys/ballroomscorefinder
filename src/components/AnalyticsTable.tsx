import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type JudgeRow = {
  judgeName: string;
  averageScore: number;
  styleCount: number;
};

type StyleRow = {
  styleName: string;
  averagePlacement: number;
};

type AnalyticsRow = JudgeRow | StyleRow;

interface AnalyticsTableProps {
  data: AnalyticsRow[];
  itemsPerPage?: number;
}

const AnalyticsTable: React.FC<AnalyticsTableProps> = ({ data, itemsPerPage = 25 }) => {
  const [sortColumn, setSortColumn] = useState<string>('judgeName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const isJudgeData = (row: AnalyticsRow): row is JudgeRow => row && 'judgeName' in row;

  // Adjust default sort column after data loads
  useEffect(() => {
    if (data.length > 0) {
      setSortColumn(isJudgeData(data[0]) ? 'judgeName' : 'styleName');
    }
    setCurrentPage(1); // Reset to first page when data changes
  }, [data]);

  const sortedAnalytics = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a: any, b: any) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc'
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      }
    });
    return sorted;
  }, [data, sortColumn, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedAnalytics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAnalytics = sortedAnalytics.slice(startIndex, endIndex);

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

  if (!data || data.length === 0) {
    return <p className="text-center text-gray-400">No analytics data available.</p>;
  }

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
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
          Showing {startIndex + 1}-{Math.min(endIndex, sortedAnalytics.length)} of {sortedAnalytics.length} results
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
              {isJudgeData(data[0]) ? (
                <>
                  <motion.th
                    className="px-4 py-3 text-left text-gold-300 font-semibold cursor-pointer select-none hover:bg-purple-900/10 transition-colors"
                    onClick={() => handleSort('judgeName')}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      Judge {sortColumn === 'judgeName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </motion.th>
                  <motion.th
                    className="px-4 py-3 text-left text-gold-300 font-semibold cursor-pointer select-none hover:bg-purple-900/10 transition-colors"
                    onClick={() => handleSort('averageScore')}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      Average Score {sortColumn === 'averageScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </motion.th>
                  <motion.th
                    className="px-4 py-3 text-left text-gold-300 font-semibold cursor-pointer select-none hover:bg-purple-900/10 transition-colors"
                    onClick={() => handleSort('styleCount')}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      # of Styles Judged {sortColumn === 'styleCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </motion.th>
                </>
              ) : (
                <>
                  <motion.th
                    className="px-4 py-3 text-left text-gold-300 font-semibold cursor-pointer select-none hover:bg-purple-900/10 transition-colors"
                    onClick={() => handleSort('styleName')}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      Style {sortColumn === 'styleName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </motion.th>
                  <motion.th
                    className="px-4 py-3 text-left text-gold-300 font-semibold cursor-pointer select-none hover:bg-purple-900/10 transition-colors"
                    onClick={() => handleSort('averagePlacement')}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      Avg Placement {sortColumn === 'averagePlacement' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                  </motion.th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedAnalytics.map((row: any, index: number) => (
              <motion.tr
                key={index}
                className="hover:bg-purple-900/10 border-t border-purple-600/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {isJudgeData(row) ? (
                  <>
                    <td className="px-4 py-3 text-gold-100">{row.judgeName}</td>
                    <td className="px-4 py-3 text-gold-100">{row.averageScore.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gold-100">{row.styleCount}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-gold-100">{row.styleName}</td>
                    <td className="px-4 py-3 text-gold-100">{row.averagePlacement.toFixed(2)}</td>
                  </>
                )}
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

export default AnalyticsTable;
