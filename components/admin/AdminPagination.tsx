import Link from "next/link";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  hrefForPage,
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Link
        href={hrefForPage(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className="admin-link-button aria-disabled:pointer-events-none aria-disabled:opacity-40"
      >
        Prev
      </Link>

      {pages.map((page) => (
        <Link
          key={page}
          href={hrefForPage(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`admin-link-button min-w-[3rem] ${page === currentPage ? "" : "admin-button-secondary"}`}
          style={page === currentPage ? {
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderColor: "#6366f1",
            color: "#fff",
          } : {}}
        >
          {page}
        </Link>
      ))}

      <Link
        href={hrefForPage(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className="admin-link-button aria-disabled:pointer-events-none aria-disabled:opacity-40"
      >
        Next
      </Link>
    </div>
  );
}
