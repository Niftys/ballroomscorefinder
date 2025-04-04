import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
}

const AnalyticsTable: React.FC<AnalyticsTableProps> = ({ data }) => {
  const [sortColumn, setSortColumn] = useState<string>('judgeName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const isJudgeData = (row: AnalyticsRow): row is JudgeRow => row && 'judgeName' in row;

  // Adjust default sort column after data loads
  useEffect(() => {
    if (data.length > 0) {
      setSortColumn(isJudgeData(data[0]) ? 'judgeName' : 'styleName');
    }
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
            {sortedAnalytics.map((row: any, index: number) => (
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
    </motion.div>
  );
};

export default AnalyticsTable;
