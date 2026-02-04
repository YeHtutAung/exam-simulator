import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  makeHref: (page: number) => string;
};

export function Pagination({ currentPage, totalPages, makeHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="mt-8 flex flex-wrap items-center gap-2 text-sm">
      {pages.map((page) => (
        <Link
          key={page}
          href={makeHref(page)}
          className={`rounded-full px-3 py-1.5 ${
            page === currentPage
              ? "bg-accent text-white"
              : "border border-sand-300 bg-white text-slate-700 hover:text-slate-900"
          }`}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}
