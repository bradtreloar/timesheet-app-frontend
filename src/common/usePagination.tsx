import React, { useMemo, useState } from "react";
import Pager from "common/Pager";

const DEFAULT_ITEMS_PER_PAGE = 10;

interface PaginationOptions {
  itemsPerPage?: number;
}

const usePagination = function <T>(items: T[], options?: PaginationOptions) {
  const [pageIndex, setPageIndex] = useState(0);
  const itemsPerPage =
    options && options.itemsPerPage && options.itemsPerPage > 0
      ? options.itemsPerPage
      : DEFAULT_ITEMS_PER_PAGE;

  const pageCount = useMemo(
    () => (items.length > 0 ? Math.ceil(items.length / itemsPerPage) : 0),
    [items, itemsPerPage]
  );

  const firstItem = pageIndex * itemsPerPage;
  const lastItem = firstItem + itemsPerPage;

  return {
    items: items.slice(firstItem, lastItem),
    Pager: () =>
      pageCount > 1 ? (
        <Pager
          pageIndex={pageIndex}
          pageCount={pageCount}
          onChange={setPageIndex}
        />
      ) : null,
  };
};

export default usePagination;
