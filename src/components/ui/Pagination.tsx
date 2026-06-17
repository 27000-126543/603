import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page?: number;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  totalItems?: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  canPrev?: boolean;
  canNext?: boolean;
}

const pageSizeOptions = [10, 20, 50, 100];

export const Pagination = ({
  page,
  currentPage,
  pageSize = 10,
  total,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  canPrev,
  canNext,
}: PaginationProps) => {
  const activePage = currentPage || page || 1;
  const totalCount = totalItems || total || 0;
  const canGoPrev = canPrev !== undefined ? canPrev : activePage > 1;
  const canGoNext = canNext !== undefined ? canNext : activePage < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <span>共</span>
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{totalCount}</span>
        <span>条记录</span>
        {onPageSizeChange && (
          <>
            <span className="mx-2">|</span>
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="input w-20 py-1 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>条</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          className="btn-ghost p-2 disabled:opacity-30"
          title="第一页"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(activePage - 1)}
          disabled={!canGoPrev}
          className="btn-ghost p-2 disabled:opacity-30"
          title="上一页"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (activePage <= 3) {
              pageNum = i + 1;
            } else if (activePage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = activePage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  pageNum === activePage
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(activePage + 1)}
          disabled={!canGoNext}
          className="btn-ghost p-2 disabled:opacity-30"
          title="下一页"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className="btn-ghost p-2 disabled:opacity-30"
          title="最后一页"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        第 <span className="font-semibold text-neutral-800 dark:text-neutral-200">{activePage}</span> / {totalPages} 页
      </div>
    </div>
  );
};
