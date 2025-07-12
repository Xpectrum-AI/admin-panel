import React from 'react';

interface PaginationProps {
  pageNumber: number; // 0-based
  pageSize: number;
  totalResults: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  if (current < 4) {
    return [0, 1, 2, 3, -1, totalPages - 1];
  }
  if (current > totalPages - 5) {
    return [0, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1];
  }
  return [0, -1, current - 1, current, current + 1, -1, totalPages - 1];
}

export default function Pagination({ pageNumber, pageSize, totalResults, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalResults / pageSize);
  const pageNumbers = getPageNumbers(pageNumber, totalPages);
  const showingTo = Math.min((pageNumber + 1) * pageSize, totalResults);
  return (
    <div className="flex items-center justify-between w-full mt-6 px-2">
      <div className="flex items-center space-x-1">
        <button
          className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 disabled:text-gray-300"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={pageNumber === 0}
        >
          &lt; Previous
        </button>
        {pageNumbers.map((num, idx) =>
          num === -1 ? (
            <span key={idx} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={num}
              className={`px-3 py-1 rounded-full font-medium transition ${num === pageNumber ? 'bg-gray-200 text-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => onPageChange(num)}
              aria-current={num === pageNumber ? 'page' : undefined}
            >
              {num + 1}
            </button>
          )
        )}
        <button
          className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 disabled:text-gray-300"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={pageNumber >= totalPages - 1}
        >
          Next &gt;
        </button>
      </div>
      <div className="text-gray-500 text-sm">
        Showing {showingTo === 0 ? 0 : pageNumber * pageSize + 1} - {showingTo} of {totalResults.toLocaleString()} results
      </div>
    </div>
  );
} 