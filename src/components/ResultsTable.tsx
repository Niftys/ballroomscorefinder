import React, { useState } from 'react';

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
  const [sortColumn, setSortColumn] = useState<keyof CompetitorData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Default headers for the table
  const defaultHeaders = [
    { key: 'placement', label: 'Placement' },
    { key: 'person_name', label: 'Competitor' },
    { key: 'style_name', label: 'Style' },
    { key: 'comp_name', label: 'Competition' },
  ];

  const headers = defaultHeaders;

  // Sort results based on the selected column
  const sortedResults = [...results].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === bValue) return 0;

    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
    return aValue > bValue ? directionMultiplier : -directionMultiplier;
  });

  // Handle header click for sorting
  const handleHeaderClick = (column: keyof CompetitorData) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="max-h-[calc(100vh-550px)] mt-6 overflow-y-auto w-full shadow-lg text-center">
      <table className="table-auto w-full border-collapse border border-opacity-0 shadow-lg bg-gray-700 bg-opacity-70">
        <thead>
          <tr className="bg-gray-800 text-gray-200">
            {headers.map((header) => (
              <th
                key={header.key as string} 
                className="px-4 py-2 border border-gray-500 border-opacity-50 cursor-pointer"
                onClick={() => handleHeaderClick(header.key as keyof CompetitorData)}
              >
                {header.label}{' '}
                {sortColumn === header.key && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedResults.length > 0 ? (
            sortedResults.map((competitor, index) => (
              <tr key={index}>
                <td className="px-4 py-2">{competitor.placement}</td>
                <td className="px-4 py-2">{competitor.person_name}</td>
                <td className="px-4 py-2">{competitor.style_name}</td>
                <td className="px-4 py-2">{competitor.comp_name}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-2 text-center text-gray-400">
                No results found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;