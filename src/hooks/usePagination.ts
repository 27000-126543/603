import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

interface UsePaginationResult {
  page: number;
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  offset: number;
  currentData: any[];
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
  canNext: boolean;
  canPrev: boolean;
}

export function usePagination(
  data?: any[],
  initialPageSize?: number,
  options?: UsePaginationOptions
): UsePaginationResult {
  const { initialPage = 1, initialPageSize: optInitialPageSize = 10 } = options || {};
  const pageSizeValue = initialPageSize || optInitialPageSize;
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(pageSizeValue);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => {
    const dataLength = data?.length || total;
    return Math.ceil(dataLength / pageSize) || 1;
  }, [data, total, pageSize]);

  const offset = useMemo(() => {
    return (page - 1) * pageSize;
  }, [page, pageSize]);

  const currentData = useMemo(() => {
    if (!data) return [];
    const start = offset;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, offset, pageSize]);

  const canNext = useMemo(() => page < totalPages, [page, totalPages]);
  const canPrev = useMemo(() => page > 1, [page]);

  const nextPage = useCallback(() => {
    if (canNext) {
      setPage((p) => p + 1);
    }
  }, [canNext]);

  const prevPage = useCallback(() => {
    if (canPrev) {
      setPage((p) => p - 1);
    }
  }, [canPrev]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(pageSizeValue);
    setTotal(0);
  }, [initialPage, pageSizeValue]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    page,
    currentPage: page,
    pageSize,
    total,
    totalPages,
    offset,
    currentData,
    setPage,
    setPageSize: handleSetPageSize,
    setTotal,
    nextPage,
    prevPage,
    goToPage,
    reset,
    canNext,
    canPrev,
  };
}
