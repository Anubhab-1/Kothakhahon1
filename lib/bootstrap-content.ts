import { db } from "@/lib/db";
import { seedAuthors, seedBlogPosts, seedBooks, seedSiteSettings } from "@/lib/content";

function collectGenres() {
  const genreMap = new Map<string, { id: string; name: string; slug: string; description?: string }>();

  for (const book of seedBooks) {
    for (const genre of book.genre ?? []) {
      genreMap.set(genre.slug, {
        id: genre._id,
        name: genre.name,
        slug: genre.slug,
        description: genre.description,
      });
    }
  }

  return Array.from(genreMap.values());
}

function countContentRecords() {
  return Promise.all([db.author.count(), db.book.count(), db.blogPost.count()]).then(([authors, books, posts]) => ({
    authors,
    books,
    posts,
  }));
}

export async function bootstrapSeedContent(options?: { force?: boolean }) {
  const force = Boolean(options?.force);
  const currentCounts = await countContentRecords();

  if (!force && currentCounts.authors + currentCounts.books + currentCounts.posts > 0) {
    return {
      imported: false,
      counts: currentCounts,
      reason: "Content already exists.",
    } as const;
  }

  const genres = collectGenres();
  const genreIdBySlug = new Map(genres.map((genre) => [genre.slug, genre.id]));

  await db.$transaction(async (tx) => {
    if (force) {
      await tx.bookGenre.deleteMany();
      await tx.authorAward.deleteMany();
      await tx.blogPost.deleteMany();
      await tx.book.deleteMany();
      await tx.genre.deleteMany();
      await tx.siteSettings.deleteMany();
      await tx.author.deleteMany();
    }

    for (const author of seedAuthors) {
      await tx.author.upsert({
        where: { id: author._id },
        update: {
          name: author.name,
          slug: author.slug,
          bio: author.bio,
          photoUrl: author.photoUrl,
          featured: Boolean(author.featured),
        },
        create: {
          id: author._id,
          name: author.name,
          slug: author.slug,
          bio: author.bio,
          photoUrl: author.photoUrl,
          featured: Boolean(author.featured),
        },
      });

      await tx.authorAward.deleteMany({
        where: {
          authorId: author._id,
        },
      });

      const awards = (author.awards ?? []).map((label, index) => ({
        id: `${author._id}-award-${index + 1}`,
        authorId: author._id,
        label,
        position: index,
      }));

      if (awards.length > 0) {
        await tx.authorAward.createMany({
          data: awards,
        });
      }
    }

    for (const genre of genres) {
      await tx.genre.upsert({
        where: { id: genre.id },
        update: {
          name: genre.name,
          slug: genre.slug,
          description: genre.description,
        },
        create: {
          id: genre.id,
          name: genre.name,
          slug: genre.slug,
          description: genre.description,
        },
      });
    }

    for (const book of seedBooks) {
      await tx.book.upsert({
        where: { id: book._id },
        update: {
          title: book.title,
          titleEn: book.titleEn,
          slug: book.slug,
          authorId: book.author?._id,
          coverImageUrl: book.coverImageUrl,
          synopsis: book.synopsis,
          pullQuote: book.pullQuote,
          price: book.price,
          buyLink: book.buyLink,
          publicationDate: book.publicationDate,
          pageCount: book.pageCount,
          isbn: book.isbn,
          language: book.language,
          featured: Boolean(book.featured),
          chapterPreview: book.chapterPreview,
          averageRating: book.averageRating,
          reviewCount: book.reviewCount ?? 0,
        },
        create: {
          id: book._id,
          title: book.title,
          titleEn: book.titleEn,
          slug: book.slug,
          authorId: book.author?._id,
          coverImageUrl: book.coverImageUrl,
          synopsis: book.synopsis,
          pullQuote: book.pullQuote,
          price: book.price,
          buyLink: book.buyLink,
          publicationDate: book.publicationDate,
          pageCount: book.pageCount,
          isbn: book.isbn,
          language: book.language,
          featured: Boolean(book.featured),
          chapterPreview: book.chapterPreview,
          averageRating: book.averageRating,
          reviewCount: book.reviewCount ?? 0,
        },
      });

      await tx.bookGenre.deleteMany({
        where: {
          bookId: book._id,
        },
      });

      const bookGenres = (book.genre ?? [])
        .map((genre, index) => {
          const canonicalGenreId = genreIdBySlug.get(genre.slug);
          if (!canonicalGenreId) {
            return null;
          }

          return {
            id: `${book._id}-genre-${index + 1}`,
            bookId: book._id,
            genreId: canonicalGenreId,
            position: index,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

      if (bookGenres.length > 0) {
        await tx.bookGenre.createMany({
          data: bookGenres,
        });
      }
    }

    for (const post of seedBlogPosts) {
      await tx.blogPost.upsert({
        where: { id: post._id },
        update: {
          title: post.title,
          slug: post.slug,
          category: post.category,
          coverImageUrl: post.coverImageUrl,
          excerpt: post.excerpt,
          body: post.body,
          publishedAt: post.publishedAt,
          featured: Boolean(post.featured),
          authorId: post.author?._id,
        },
        create: {
          id: post._id,
          title: post.title,
          slug: post.slug,
          category: post.category,
          coverImageUrl: post.coverImageUrl,
          excerpt: post.excerpt,
          body: post.body,
          publishedAt: post.publishedAt,
          featured: Boolean(post.featured),
          authorId: post.author?._id,
        },
      });
    }

    await tx.siteSettings.upsert({
      where: {
        id: seedSiteSettings._id,
      },
        update: {
          heroTagline: seedSiteSettings.heroTagline,
          heroTaglineEn: seedSiteSettings.heroTaglineEn,
          missionStatement: seedSiteSettings.missionStatement,
          featuredAuthorId: seedSiteSettings.featuredAuthor?._id,
          facebookUrl: seedSiteSettings.social?.facebook,
          instagramUrl: seedSiteSettings.social?.instagram,
          youtubeUrl: seedSiteSettings.social?.youtube,
          linkedinUrl: seedSiteSettings.social?.linkedin,
          editorialEmail: seedSiteSettings.support?.editorialEmail,
          submissionsEmail: seedSiteSettings.support?.submissionsEmail,
          rightsEmail: seedSiteSettings.support?.rightsEmail,
          supportPhone: seedSiteSettings.support?.supportPhone,
          whatsappPhone: seedSiteSettings.support?.whatsappPhone,
          postalAddress: seedSiteSettings.support?.postalAddress,
        },
        create: {
          id: seedSiteSettings._id,
          heroTagline: seedSiteSettings.heroTagline,
          heroTaglineEn: seedSiteSettings.heroTaglineEn,
          missionStatement: seedSiteSettings.missionStatement,
          featuredAuthorId: seedSiteSettings.featuredAuthor?._id,
          facebookUrl: seedSiteSettings.social?.facebook,
          instagramUrl: seedSiteSettings.social?.instagram,
          youtubeUrl: seedSiteSettings.social?.youtube,
          linkedinUrl: seedSiteSettings.social?.linkedin,
          editorialEmail: seedSiteSettings.support?.editorialEmail,
          submissionsEmail: seedSiteSettings.support?.submissionsEmail,
          rightsEmail: seedSiteSettings.support?.rightsEmail,
          supportPhone: seedSiteSettings.support?.supportPhone,
          whatsappPhone: seedSiteSettings.support?.whatsappPhone,
          postalAddress: seedSiteSettings.support?.postalAddress,
        },
      });
  }, { timeout: 30000 });

  return {
    imported: true,
    counts: await countContentRecords(),
  } as const;
}
