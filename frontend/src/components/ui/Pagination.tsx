'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, pages, total, limit, onPage }: PaginationProps) {
  if (pages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-aws-gray-200 bg-white">
      <p className="text-xs text-aws-gray-500">Showing {start}–{end} of {total}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded border border-aws-gray-300 text-aws-gray-600 hover:bg-aws-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`px-3 py-1 text-xs rounded border ${page === p ? 'bg-aws-blue text-white border-aws-blue' : 'border-aws-gray-300 text-aws-gray-600 hover:bg-aws-gray-100'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded border border-aws-gray-300 text-aws-gray-600 hover:bg-aws-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
