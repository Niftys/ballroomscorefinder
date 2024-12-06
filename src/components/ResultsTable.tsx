import React, { useState } from 'react';

interface ResultsTableProps {
  results: any[];
  customHeaders?: { key: string; label: string }[] | null; // Optional custom headers
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, customHeaders }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Default headers for the table
  const defaultHeaders = [
    { key: 'placement', label: 'Overall Score' },
    { key: 'person_name', label: 'Competitor' },
    { key: 'style_name', label: 'Style' },
    { key: 'comp_name', label: 'Competition' },
  ];

  const headers = customHeaders || defaultHeaders;

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === bValue) return 0;

    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
    return aValue > bValue ? directionMultiplier : -directionMultiplier;
  });

  // Handle header click for sorting
  const handleHeaderClick = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div
      className="mt-6 overflow-y-auto w-full shadow-lg"
      style={{ maxHeight: 'calc(100vh - 550px)', scrollbarGutter: 'stable' }}
    >
      <table className="table-auto w-full border-collapse border border-opacity-0 shadow-lg bg-gray-700 bg-opacity-70">
        <thead>
          <tr className="bg-gray-800 text-gray-200">
            {headers.map((header) => (
              <th
                key={header.key}
                className="px-4 py-2 border border-gray-500 border-opacity-50 cursor-pointer"
                onClick={() => handleHeaderClick(header.key)}
              >
                {header.label}{' '}
                {sortColumn === header.key && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedResults.length > 0 ? (
            sortedResults.map((result, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td
                    key={header.key}
                    className="px-4 py-2 border border-gray-500 border-opacity-50 text-center"
                  >
                    {result[header.key]}
                  </td>
                ))}
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
