import type { Metadata } from "next";
import AuthorsIndexClient, {
  type AuthorIndexItem,
} from "@/components/authors/AuthorsIndexClient";
import { getAllAuthors, getAllBooks } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our Authors | Kothakhahon Editorial Desk",
  description: "Explore profiles, biographies, and publications of the writers and poets who shape the Kothakhahon catalog.",
  alternates: {
    canonical: "/authors",
  },
};

export const revalidate = 60;

export default async function AuthorsPage() {
  const [authors, books] = await Promise.all([getAllAuthors(), getAllBooks()]);

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

  return <AuthorsIndexClient authors={items} />;
}
