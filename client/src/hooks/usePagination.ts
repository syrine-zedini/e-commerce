import { useState } from "react";

// Page-number slicing with ellipsis, shared between Produits and
// ProduitsMobile (identical logic, different `perPage`/UI).
export function usePagination<T>(items: T[], perPage: number) {
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentItems = items.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(items.length / perPage);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return { currentPage, setCurrentPage, currentItems, totalPages, goToPage, getPageNumbers };
}
