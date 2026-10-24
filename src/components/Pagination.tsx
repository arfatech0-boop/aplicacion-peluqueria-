import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  itemLabel = 'registros',
  className = ''
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600 rounded-b-xl select-none ${className}`}>
      {/* Total Items Info & Page Size Selector */}
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="font-medium text-slate-500">
          Mostrando <strong className="text-slate-800 font-bold">{startItem}</strong> - <strong className="text-slate-800 font-bold">{endItem}</strong> de <strong className="text-indigo-600 font-black">{totalItems.toLocaleString('es-AR')}</strong> {itemLabel}
        </span>

        {showPageSize && onPageSizeChange && (
          <div className="flex items-center space-x-1.5 pl-2 sm:border-l border-slate-200">
            <span className="text-[11px] text-slate-400 hidden md:inline">Por pág:</span>
            <select
              value={pageSize}
              onChange={e => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {pageSizeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Primera Página"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Prev Page */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Página Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1 px-1">
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">
                    •••
                  </span>
                );
              }
              const isCurrent = p === safeCurrentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(p as number)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Página Siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Última Página"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
