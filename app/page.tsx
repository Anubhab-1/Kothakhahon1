import HomePageClient from "@/components/home/HomePageClient";
import {
  getAllAuthors,
  getAllBooks,
  getFeaturedBooks,
  getLatestBlogPosts,
  getSiteSettings,
} from "@/lib/content";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, featuredBooks, latestPosts, authors, allBooks] = await Promise.all([
    getSiteSettings(),
    getFeaturedBooks(),
    getLatestBlogPosts(),
    getAllAuthors(),
    getAllBooks(),
  ]);

  return (
    <HomePageClient
      allBooks={allBooks}
      featuredBooks={featuredBooks}
      latestPosts={latestPosts}
      featuredAuthor={settings.featuredAuthor ?? authors[0] ?? null}
      heroTagline={settings.heroTagline}
      heroTaglineEn={settings.heroTaglineEn}
      missionStatement={settings.missionStatement}
    />
  );
}
