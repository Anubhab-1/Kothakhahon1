import type { Metadata } from "next";
import AuthorsIndexClient, {
  type AuthorIndexItem,
} from "@/components/authors/AuthorsIndexClient";
import { getAllAuthors, getAllBooks, getAuthorsCount } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our Authors | Kothakhahon Editorial Desk",
  description: "Explore profiles, biographies, and publications of the writers and poets who shape the Kothakhahon catalog.",
  alternates: {
    canonical: "/authors",
  },
};

export const revalidate = 60;

interface AuthorsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 24;

  const [authors, books, totalCount] = await Promise.all([
    getAllAuthors({ page, limit }),
    getAllBooks(),
    getAuthorsCount(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const items: AuthorIndexItem[] = authors
    .map((author) => ({
      id: author._id,
      slug: author.slug,
      name: author.name,
      bio: author.bio,
      photoUrl: author.photoUrl,
      bookCount: books.filter((book) => book.author?.slug === author.slug).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <AuthorsIndexClient authors={items} currentPage={page} totalPages={totalPages} />;
}
