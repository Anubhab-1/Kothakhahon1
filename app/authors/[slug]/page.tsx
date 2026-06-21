import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AuthorDetailClient, {
  type AuthorBookItem,
  type AuthorDetailItem,
} from "@/components/authors/AuthorDetailClient";
import { getAllAuthors, getAuthorBySlug, getBooksByAuthor } from "@/lib/content";

interface AuthorPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 3600; // 1 hour

function mapAuthor(author: NonNullable<Awaited<ReturnType<typeof getAuthorBySlug>>>): AuthorDetailItem {
  return {
    id: author._id,
    slug: author.slug,
    name: author.name,
    bio: author.bio,
    photoUrl: author.photoUrl,
    awards: author.awards,
  };
}

function mapAuthorBook(book: Awaited<ReturnType<typeof getBooksByAuthor>>[number]): AuthorBookItem {
  return {
    id: book._id,
    slug: book.slug,
    title: book.title,
    price: book.price,
    coverImageUrl: book.coverImageUrl,
    genres: (book.genre ?? []).map((genre) => genre.name).filter(Boolean),
    language: book.language,
  };
}

export async function generateStaticParams() {
  const authors = await getAllAuthors();
  return authors.map((author) => ({ slug: author.slug }));
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const [author, books] = await Promise.all([getAuthorBySlug(slug), getBooksByAuthor(slug)]);

  if (!author) {
    notFound();
  }

  return <AuthorDetailClient author={mapAuthor(author)} books={books.map(mapAuthorBook)} />;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [author, books] = await Promise.all([getAuthorBySlug(slug), getBooksByAuthor(slug)]);

  if (!author) {
    notFound();
  }

  const description =
    author.bio?.slice(0, 160) ||
    `Books and editorial profile for ${author.name} at Kothakhahon Prokashoni.`;
  const previewImage = author.photoUrl || books[0]?.coverImageUrl || "/opengraph-image";

  return {
    title: author.name,
    description,
    alternates: {
      canonical: `/authors/${author.slug}`,
    },
    openGraph: {
      title: author.name,
      description,
      type: "profile",
      url: `/authors/${author.slug}`,
      images: [previewImage],
    },
    twitter: {
      card: "summary_large_image",
      title: author.name,
      description,
      images: [previewImage === "/opengraph-image" ? "/twitter-image" : previewImage],
    },
  };
}
