import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getDerivedStockStatus } from "@/lib/inventory";
import type { Author, BlogPost, Book, SiteSettings } from "@/lib/types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export const seedAuthors: Author[] = [
  {
    _id: "author-1",
    name: "Arindam Sen",
    slug: "arindam-sen",
    bio: "Arindam Sen writes literary fiction centered on memory, migration, and the fragile civic rituals of Kolkata. His novels often follow characters returning to neighborhoods that no longer remember them in the same language.",
    featured: true,
    awards: ["Bengal Fiction Award", "Sabitri Memorial Novel Citation"],
  },
  {
    _id: "author-2",
    name: "Moumita Das",
    slug: "moumita-das",
    bio: "Moumita Das is a poet and essayist whose work explores intimacy, urban solitude, and the emotional architecture of everyday spaces. She publishes across poetry journals and live reading circuits.",
    awards: ["Young Poet Citation", "Little Magazine Poetry Medal"],
  },
  {
    _id: "author-3",
    name: "Sagnik Roy",
    slug: "sagnik-roy",
    bio: "Sagnik Roy writes criticism and long-form essays on language politics, public speech, and literary institutions in South Asia. His work blends research discipline with accessible prose.",
    awards: ["Editorial Excellence Mention"],
  },
  {
    _id: "author-4",
    name: "Lopamudra Bose",
    slug: "lopamudra-bose",
    bio: "Lopamudra Bose is a translator and editor interested in multilingual literary archives, the ethics of translation, and the design of durable bilingual editions.",
    awards: ["Translation Fellowship", "Archive Practice Grant"],
  },
  {
    _id: "author-5",
    name: "Kaushik Saha",
    slug: "kaushik-saha",
    bio: "Kaushik Saha writes social realist fiction rooted in peri-urban Bengal, where ambition, debt, and family obligation constantly collide.",
    awards: ["Readers' Circle Fiction Mention"],
  },
  {
    _id: "author-6",
    name: "Nabanita Paul",
    slug: "nabanita-paul",
    bio: "Nabanita Paul is known for intimate lyric poetry and precise editorial craft. Her work is attentive to domestic memory, silence, and private grief.",
  },
  {
    _id: "author-7",
    name: "Tanmoy Ghosh",
    slug: "tanmoy-ghosh",
    bio: "Tanmoy Ghosh explores urban anxiety, labor precarity, and class aspiration in fiction shaped by fast-moving city life and social fracture.",
    awards: ["Metropolitan Fiction Shortlist"],
  },
  {
    _id: "author-8",
    name: "Debolina Dhar",
    slug: "debolina-dhar",
    bio: "Debolina Dhar writes essays and narrative non-fiction on reading cultures, translation, and Bengali print history. Her work treats literary memory as a public resource.",
    awards: ["Print Culture Essay Prize"],
  },
  {
    _id: "author-9",
    name: "Editorial Desk",
    slug: "editorial-desk",
    bio: "The in-house editorial team of Kothakhahon Prokashoni, writing on publishing craft, acquisitions, reading culture, and the design of a serious independent list.",
  },
  {
    _id: "author-10",
    name: "Ritobroto Das",
    slug: "ritobroto-das",
    bio: "Publishing lead at Kothakhahon, working across production strategy, catalog building, print planning, and long-tail discoverability.",
  },
  {
    _id: "author-11",
    name: "Anirban Choudhury",
    slug: "anirban-choudhury",
    bio: "Editorial director and visual strategist for Kothakhahon titles, focused on durable design systems for serious literature.",
  },
];

const seedAuthorMap = new Map(seedAuthors.map((author) => [author.slug, author]));

function getSeedAuthor(slug: string) {
  const author = seedAuthorMap.get(slug);
  if (!author) {
    throw new Error(`Unknown author slug: ${slug}`);
  }
  return author;
}

export const seedBooks: Book[] = [
  {
    _id: "book-1",
    title: "Shobder Nodi",
    titleEn: "River of Words",
    slug: "shobder-nodi",
    author: getSeedAuthor("arindam-sen"),
    genre: [
      { _id: "genre-fiction", name: "Literary Fiction", slug: "literary-fiction" },
      { _id: "genre-contemporary", name: "Contemporary", slug: "contemporary" },
    ],
    synopsis:
      "A drifting narrator returns to his river town after two decades and discovers that language itself has changed. As old relationships reopen, he confronts family silence, political erasure, and the unfinished letters his mother left behind.",
    pullQuote: "Some rivers do not carry water. They carry unfinished sentences.",
    price: 450,
    publicationDate: "2024-03-11",
    pageCount: 284,
    isbn: "978-93-00000-11-7",
    language: "Bengali",
    chapterPreview:
      "On the morning train, the river came first, then the town. It always arrived like that in memory: a silver line before the names of people.\n\nHe had promised himself he would not write about this place again. Yet every notebook he opened began with the same crooked sentence.\n\nBy noon, the old station clock had stopped exactly where he remembered. The tea vendor looked younger than his own son.",
    averageRating: 4.6,
    reviewCount: 126,
    featured: true,
  },
  {
    _id: "book-2",
    title: "Nirjan Pathshala",
    slug: "nirjan-pathshala",
    author: getSeedAuthor("moumita-das"),
    genre: [{ _id: "genre-poetry", name: "Poetry", slug: "poetry" }],
    synopsis:
      "A poetry collection mapping loneliness across classrooms, hostels, ferries, and borrowed rooms. Each poem works like a small room of withheld confession.",
    pullQuote: "Silence is not empty. It is full of unsent names.",
    price: 390,
    publicationDate: "2023-11-09",
    pageCount: 146,
    isbn: "978-93-00000-06-3",
    language: "Bengali",
    chapterPreview:
      "In the corridor light, her notebook looked like a second window.\n\nEvery poem began where conversation failed.\n\nAt dusk the classroom retained voices the way old walls retain rain.",
    averageRating: 4.4,
    reviewCount: 74,
  },
  {
    _id: "book-3",
    title: "Dhonir Bhasha",
    slug: "dhonir-bhasha",
    author: getSeedAuthor("sagnik-roy"),
    genre: [
      { _id: "genre-essays", name: "Essays", slug: "essays" },
      { _id: "genre-nonfiction", name: "Non-Fiction", slug: "non-fiction" },
    ],
    synopsis:
      "A provocative essay collection on sound, language, identity, and how speech is disciplined in public space. It asks who gets heard, who gets corrected, and who gets erased.",
    pullQuote: "Accent is history wearing the mask of grammar.",
    price: 520,
    publicationDate: "2025-01-18",
    pageCount: 332,
    isbn: "978-93-00000-14-8",
    language: "Bengali",
    chapterPreview:
      "When we say a language is pure, we often mean someone else must remain unheard.\n\nThe first violence is always phonetic.\n\nEvery classroom teaches pronunciation and hierarchy together.",
    averageRating: 4.7,
    reviewCount: 198,
    featured: true,
  },
  {
    _id: "book-4",
    title: "Onubader Ayna",
    slug: "onubader-ayna",
    author: getSeedAuthor("lopamudra-bose"),
    genre: [{ _id: "genre-nonfiction", name: "Non-Fiction", slug: "non-fiction" }],
    synopsis:
      "A reflective account of translation, distortion, and literary memory between Bengali and English. It is both a translator's notebook and an argument for patient cross-language reading.",
    pullQuote: "Every translation is an argument with time.",
    price: 410,
    publicationDate: "2024-09-01",
    pageCount: 256,
    isbn: "978-93-00000-09-4",
    language: "Bengali",
    chapterPreview:
      "The original text sat like a mirror tilted toward another century.\n\nMy work was to change its angle, not its light.\n\nSome meanings travel only if they are allowed to limp.",
    averageRating: 4.5,
    reviewCount: 89,
  },
  {
    _id: "book-5",
    title: "Rate Jhora Pata",
    slug: "rate-jhora-pata",
    author: getSeedAuthor("kaushik-saha"),
    genre: [{ _id: "genre-fiction", name: "Literary Fiction", slug: "literary-fiction" }],
    synopsis:
      "A layered portrait of a small-town neighborhood where aspiration, debt, and friendship collide over one monsoon season. What begins as local gossip hardens into irreversible consequence.",
    pullQuote: "Some nights do not pass. They sediment.",
    price: 360,
    publicationDate: "2022-04-20",
    pageCount: 238,
    isbn: "978-93-00000-15-5",
    language: "Bengali",
    chapterPreview:
      "The shutters had closed before rain arrived. Still, water found every crack in the lane.\n\nBy midnight, all promises sounded practical and therefore suspect.\n\nSomeone had left the tea stall light on like a confession.",
    averageRating: 4.3,
    reviewCount: 61,
  },
  {
    _id: "book-6",
    title: "Kobitar Khata",
    slug: "kobitar-khata",
    author: getSeedAuthor("nabanita-paul"),
    genre: [{ _id: "genre-poetry", name: "Poetry", slug: "poetry" }],
    synopsis:
      "A notebook-like poetry sequence on family archives, letters, and unfinished conversations. The collection is quiet, exact, and emotionally devastating without ever becoming theatrical.",
    pullQuote: "Poems are what remain after the house has gone quiet.",
    price: 280,
    publicationDate: "2024-02-14",
    pageCount: 124,
    isbn: "978-93-00000-16-2",
    language: "Bengali",
    chapterPreview:
      "On the first page, she wrote only a date.\n\nOn the second, she crossed it out and wrote a season instead.\n\nBy the third page, the notebook knew more than the house.",
    averageRating: 4.2,
    reviewCount: 48,
  },
  {
    _id: "book-7",
    title: "Nagarik Rupkatha",
    slug: "nagarik-rupkatha",
    author: getSeedAuthor("tanmoy-ghosh"),
    genre: [{ _id: "genre-fiction", name: "Literary Fiction", slug: "literary-fiction" }],
    synopsis:
      "A contemporary city fable where delivery workers, startup founders, and students cross each other in a week of civic unrest. The novel reads like a fairy tale rewritten by bureaucracy.",
    pullQuote: "Every city tells fairy tales in administrative language.",
    price: 470,
    publicationDate: "2025-02-02",
    pageCount: 302,
    isbn: "978-93-00000-17-9",
    language: "Bengali",
    chapterPreview:
      "By afternoon the flyover had become a queue of brakes and impatience.\n\nFrom the twelfth floor, all traffic looked like punctuation marks.\n\nBelow, a rider balanced six deliveries and one unpaid month of rent.",
    averageRating: 4.4,
    reviewCount: 83,
  },
  {
    _id: "book-8",
    title: "Boi o Bangla",
    slug: "boi-o-bangla",
    author: getSeedAuthor("debolina-dhar"),
    genre: [{ _id: "genre-essays", name: "Essays", slug: "essays" }],
    synopsis:
      "An essay collection on bookstores, little magazines, translation politics, and why reading communities matter. It treats reading not as consumption but as a civic habit.",
    pullQuote: "A language survives in how its readers gather.",
    price: 340,
    publicationDate: "2023-08-12",
    pageCount: 210,
    isbn: "978-93-00000-18-6",
    language: "Bengali",
    chapterPreview:
      "The first bookshop I remember had no signboard, only a blue curtain.\n\nInside, every shelf seemed organized by affection, not category.\n\nSome bookstores are cataloged by memory before inventory.",
    averageRating: 4.1,
    reviewCount: 39,
  },
  {
    _id: "book-9",
    title: "Smritir Map",
    titleEn: "Map of Memory",
    slug: "smritir-map",
    author: getSeedAuthor("arindam-sen"),
    genre: [
      { _id: "genre-fiction-2", name: "Literary Fiction", slug: "literary-fiction" },
      { _id: "genre-contemporary-2", name: "Contemporary", slug: "contemporary" },
    ],
    synopsis:
      "A son returns to catalog his late father's notebooks and finds a parallel history of a vanished neighborhood. As he traces landmarks that no longer exist, family memory starts to conflict with official records.",
    pullQuote: "Maps forget what people keep repeating at dinner tables.",
    price: 430,
    publicationDate: "2024-12-05",
    pageCount: 268,
    isbn: "978-93-00000-19-3",
    language: "Bengali",
    chapterPreview:
      "The municipal map called it Ward 17.\n\nMy father still called it by the name of a cinema that burned down before I was born.\n\nOn his last page, he drew the lane as if memory had its own scale.",
    averageRating: 4.5,
    reviewCount: 67,
    featured: true,
  },
  {
    _id: "book-10",
    title: "Chhaya Shohor",
    titleEn: "Shadow City",
    slug: "chhaya-shohor",
    author: getSeedAuthor("tanmoy-ghosh"),
    genre: [{ _id: "genre-fiction-3", name: "Literary Fiction", slug: "literary-fiction" }],
    synopsis:
      "Set over forty-eight hours during an extended blackout, this novel follows riders, nurses, and call-center workers navigating a city that suddenly has no digital memory.",
    pullQuote: "When the lights go out, every shortcut becomes a confession.",
    price: 495,
    publicationDate: "2025-09-14",
    pageCount: 318,
    isbn: "978-93-00000-20-9",
    language: "Bengali",
    chapterPreview:
      "By 7:12 PM, the signal towers had gone silent.\n\nPeople stood on balconies holding phones like lanterns, waiting for bars that did not return.\n\nIn the dark, the city began introducing itself again, one voice at a time.",
    averageRating: 4.6,
    reviewCount: 92,
    featured: true,
  },
  {
    _id: "book-11",
    title: "Bangla Boi Archive",
    titleEn: "The Bengali Book Archive",
    slug: "bangla-boi-archive",
    author: getSeedAuthor("debolina-dhar"),
    genre: [
      { _id: "genre-essays-2", name: "Essays", slug: "essays" },
      { _id: "genre-nonfiction-2", name: "Non-Fiction", slug: "non-fiction" },
    ],
    synopsis:
      "An archival narrative on little magazines, district libraries, and out-of-print catalogs that shaped twentieth-century Bengali reading communities.",
    pullQuote: "Every missing edition leaves a fingerprint on collective memory.",
    price: 560,
    publicationDate: "2025-06-21",
    pageCount: 352,
    isbn: "978-93-00000-21-6",
    language: "Bengali",
    chapterPreview:
      "In Krishnanagar, the librarian unlocked a steel trunk before opening the main register.\n\nInside lay subscription slips, folded reviews, and three books no catalog admitted having.\n\nPreservation begins where official inventory ends.",
    averageRating: 4.7,
    reviewCount: 105,
    featured: true,
  },
];

export const seedBlogPosts: BlogPost[] = [
  {
    _id: "post-1",
    title: "Why Bengali Literary Editing Still Matters",
    slug: "why-bengali-literary-editing-still-matters",
    category: "Editorial",
    excerpt:
      "A note from our desk on rhythm, syntax, and why editorial rigor protects the reader far beyond launch week.",
    publishedAt: "2026-01-12",
    featured: true,
    author: getSeedAuthor("editorial-desk"),
    body:
      "Editing is often invisible when done well, but its effect is everywhere: pacing, tone, trust, and a reader's willingness to keep surrendering attention to the page.\n\nAt Kothakhahon, editorial rigor is not cosmetic polish. It is structural work that helps a manuscript become readable across generations while preserving the texture of the writer's voice.\n\nGood editing protects both the writer and the reader.\n\nIn Bengali publishing, that discipline matters even more because syntax, register, and idiom carry history. Weak editing flattens that history. Strong editing lets it travel.",
  },
  {
    _id: "post-2",
    title: "Building A Publisher Catalog That Ages Well",
    slug: "building-a-publisher-catalog-that-ages-well",
    category: "Publishing",
    excerpt:
      "How we balance backlist strategy, debut voices, and long-term discoverability instead of chasing one-season relevance.",
    publishedAt: "2025-12-04",
    author: getSeedAuthor("ritobroto-das"),
    body:
      "A strong catalog is not a set of isolated hits. It is a coherent conversation over time, where one book changes how the next one is read.\n\nWe think in seasons, but we publish for years. That means building a list where debut fiction, criticism, poetry, and backlist all reinforce each other rather than compete for attention.",
  },
  {
    _id: "post-3",
    title: "Inside The Manuscript Review Process",
    slug: "inside-the-manuscript-review-process",
    category: "For Authors",
    excerpt:
      "A transparent walkthrough of our internal editorial review stages, timelines, and what actually moves a manuscript forward.",
    publishedAt: "2025-11-18",
    author: getSeedAuthor("editorial-desk"),
    body:
      "Our review process prioritizes clarity, voice, and editorial potential, not just immediate market fit. We read for stamina, structure, and the manuscript's ability to sustain rereading.\n\nThat means response times can be slower than quick-turn platforms, but it also means submissions are evaluated with seriousness. Writers deserve that level of care.",
  },
  {
    _id: "post-4",
    title: "Designing Covers For Serious Fiction",
    slug: "designing-covers-for-serious-fiction",
    category: "Design",
    excerpt:
      "Cover systems that support literary identity instead of over-selling a single season through loud visual shortcuts.",
    publishedAt: "2025-10-10",
    author: getSeedAuthor("anirban-choudhury"),
    body:
      "Typography, contrast, and restraint are often more durable than trend-driven visual gimmicks. The strongest literary covers usually age well because they refuse panic.\n\nWe treat each cover as part of a larger shelf system. A list should look like it belongs to itself without becoming repetitive.",
  },
];

export const seedSiteSettings: SiteSettings = {
  _id: "site-settings",
  heroTagline: "Where Serious Bengali Writing Finds Its Edition.",
  heroTaglineEn:
    "Independent Bengali publishing for fiction, essays, poetry, and enduring books shaped with editorial care.",
  missionStatement:
    "We build books for the second reading, the passed-along copy, and the shelf that still matters years later.",
  featuredBooks: seedBooks.filter((book) => book.featured).slice(0, 6),
  featuredAuthor: getSeedAuthor("arindam-sen"),
  social: {
    facebook: "https://facebook.com/kothakhahon",
    instagram: "https://instagram.com/kothakhahon",
    youtube: "https://youtube.com/@kothakhahon",
    linkedin: "https://www.linkedin.com/company/kothakhahon",
  },
  support: {
    editorialEmail: "editor@kothakhahon.com",
    submissionsEmail: "submissions@kothakhahon.com",
    rightsEmail: "rights@kothakhahon.com",
    postalAddress: "Kolkata, West Bengal, India",
  },
};

const authorInclude = {
  awards: {
    orderBy: {
      position: "asc",
    },
  },
} satisfies Prisma.AuthorInclude;

const bookInclude = {
  author: {
    include: authorInclude,
  },
  genres: {
    include: {
      genre: true,
    },
    orderBy: {
      position: "asc",
    },
  },
} satisfies Prisma.BookInclude;

const postInclude = {
  author: {
    include: authorInclude,
  },
} satisfies Prisma.BlogPostInclude;

const settingsInclude = {
  featuredAuthor: {
    include: authorInclude,
  },
} satisfies Prisma.SiteSettingsInclude;

type AuthorRecord = Prisma.AuthorGetPayload<{ include: typeof authorInclude }>;
type BookRecord = Prisma.BookGetPayload<{ include: typeof bookInclude }>;
type BlogPostRecord = Prisma.BlogPostGetPayload<{ include: typeof postInclude }>;
type SiteSettingsRecord = Prisma.SiteSettingsGetPayload<{ include: typeof settingsInclude }>;

const CONTENT_PRESENCE_TTL_MS = 30_000;

let contentPresenceCache:
  | {
      checkedAt: number;
      hasContent: boolean;
    }
  | undefined;

function sortBooksByDateDesc<T extends { publicationDate?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.publicationDate ?? "");
    const bTime = Date.parse(b.publicationDate ?? "");
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function sortPostsByDateDesc(items: BlogPost[]) {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.publishedAt ?? "");
    const bTime = Date.parse(b.publishedAt ?? "");
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function mapAuthorRecord(author: AuthorRecord): Author {
  return {
    _id: author.id,
    name: author.name,
    slug: author.slug,
    bio: author.bio ?? undefined,
    featured: author.featured,
    photoUrl: author.photoUrl ?? undefined,
    awards:
      author.awards.length > 0
        ? author.awards
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((award) => award.label)
        : undefined,
  };
}

function mapBookRecord(book: BookRecord): Book {
  const stockQuantity = book.stockQuantity;
  const lowStockThreshold = book.lowStockThreshold;

  return {
    _id: book.id,
    title: book.title,
    titleEn: book.titleEn ?? undefined,
    slug: book.slug,
    author: book.author ? mapAuthorRecord(book.author) : undefined,
    coverImageUrl: book.coverImageUrl ?? undefined,
    genre: book.genres.map((item) => ({
      _id: item.genre.id,
      name: item.genre.name,
      slug: item.genre.slug,
      description: item.genre.description ?? undefined,
    })),
    synopsis: book.synopsis ?? undefined,
    pullQuote: book.pullQuote ?? undefined,
    price: book.price ?? undefined,
    buyLink: book.buyLink ?? undefined,
    publicationDate: book.publicationDate ?? undefined,
    pageCount: book.pageCount ?? undefined,
    isbn: book.isbn ?? undefined,
    language: book.language ?? undefined,
    featured: book.featured,
    chapterPreview: book.chapterPreview ?? undefined,
    averageRating: book.averageRating ?? undefined,
    reviewCount: book.reviewCount,
    stockQuantity,
    lowStockThreshold,
    stockStatus: getDerivedStockStatus(stockQuantity, lowStockThreshold),
  };
}

function mapBlogPostRecord(post: BlogPostRecord): BlogPost {
  return {
    _id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category ?? undefined,
    coverImageUrl: post.coverImageUrl ?? undefined,
    excerpt: post.excerpt ?? undefined,
    body: post.body ?? undefined,
    author: post.author ? mapAuthorRecord(post.author) : undefined,
    publishedAt: post.publishedAt ?? undefined,
    featured: post.featured,
  };
}

function mapSettingsRecord(settings: SiteSettingsRecord, featuredBooks: Book[]): SiteSettings {
  return {
    _id: settings.id,
    heroTagline: settings.heroTagline ?? undefined,
    heroTaglineEn: settings.heroTaglineEn ?? undefined,
    missionStatement: settings.missionStatement ?? undefined,
    featuredBooks,
    featuredAuthor: settings.featuredAuthor ? mapAuthorRecord(settings.featuredAuthor) : undefined,
    social: {
      facebook: settings.facebookUrl ?? undefined,
      instagram: settings.instagramUrl ?? undefined,
      youtube: settings.youtubeUrl ?? undefined,
      linkedin: settings.linkedinUrl ?? undefined,
    },
    support: {
      editorialEmail:
        settings.editorialEmail ?? seedSiteSettings.support?.editorialEmail ?? undefined,
      submissionsEmail:
        settings.submissionsEmail ?? seedSiteSettings.support?.submissionsEmail ?? undefined,
      rightsEmail: settings.rightsEmail ?? seedSiteSettings.support?.rightsEmail ?? undefined,
      supportPhone: settings.supportPhone ?? seedSiteSettings.support?.supportPhone ?? undefined,
      whatsappPhone:
        settings.whatsappPhone ?? seedSiteSettings.support?.whatsappPhone ?? undefined,
      postalAddress:
        settings.postalAddress ?? seedSiteSettings.support?.postalAddress ?? undefined,
    },
  };
}

async function hasDatabaseContent() {
  if (
    contentPresenceCache &&
    Date.now() - contentPresenceCache.checkedAt < CONTENT_PRESENCE_TTL_MS
  ) {
    return contentPresenceCache.hasContent;
  }

  const [bookCount, authorCount, postCount] = await Promise.all([
    db.book.count(),
    db.author.count(),
    db.blogPost.count(),
  ]);

  const hasContent = bookCount + authorCount + postCount > 0;
  contentPresenceCache = {
    checkedAt: Date.now(),
    hasContent,
  };

  return hasContent;
}

export function invalidateContentPresenceCache() {
  contentPresenceCache = undefined;
}

async function getSeedSiteSettings() {
  return clone(seedSiteSettings);
}

async function getSeedFeaturedBooks() {
  return clone(seedSiteSettings.featuredBooks ?? []);
}

async function getSeedAllBooks() {
  return clone(sortBooksByDateDesc(seedBooks));
}

async function getSeedBookBySlug(slug: string) {
  return clone(seedBooks.find((book) => book.slug === slug) ?? null);
}

async function getSeedRelatedBooks(slug: string, authorId: string) {
  const related = seedBooks
    .filter((book) => book.slug !== slug)
    .sort((a, b) => {
      const aScore = a.author?._id === authorId ? 1 : 0;
      const bScore = b.author?._id === authorId ? 1 : 0;
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      const aTime = Date.parse(a.publicationDate ?? "");
      const bTime = Date.parse(b.publicationDate ?? "");
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    })
    .slice(0, 6);

  return clone(related);
}

async function getSeedAllBlogPosts() {
  return clone(sortPostsByDateDesc(seedBlogPosts));
}

async function getSeedBlogPostBySlug(slug: string) {
  return clone(seedBlogPosts.find((post) => post.slug === slug) ?? null);
}

async function getSeedLatestBlogPosts() {
  return clone(sortPostsByDateDesc(seedBlogPosts).slice(0, 3));
}

async function getSeedAllAuthors() {
  return clone([...seedAuthors].sort((a, b) => a.name.localeCompare(b.name)));
}

async function getSeedAuthorBySlug(slug: string) {
  return clone(seedAuthors.find((author) => author.slug === slug) ?? null);
}

async function getSeedBooksByAuthor(slug: string) {
  return clone(sortBooksByDateDesc(seedBooks.filter((book) => book.author?.slug === slug)));
}

export async function getSiteSettings() {
  if (!(await hasDatabaseContent())) {
    return getSeedSiteSettings();
  }

  const [settings, featuredBooks] = await Promise.all([
    db.siteSettings.findFirst({
      include: settingsInclude,
    }),
    getFeaturedBooks(),
  ]);

  if (!settings) {
    return getSeedSiteSettings();
  }

  return mapSettingsRecord(settings, featuredBooks);
}

export async function getFeaturedBooks() {
  if (!(await hasDatabaseContent())) {
    return getSeedFeaturedBooks();
  }

  const books = await db.book.findMany({
    where: {
      featured: true,
    },
    include: bookInclude,
    orderBy: [{ publicationDate: "desc" }, { updatedAt: "desc" }],
    take: 6,
  });

  return books.map(mapBookRecord);
}

export async function getAllBooks() {
  if (!(await hasDatabaseContent())) {
    return getSeedAllBooks();
  }

  const books = await db.book.findMany({
    include: bookInclude,
    orderBy: [{ publicationDate: "desc" }, { createdAt: "desc" }],
  });

  return books.map(mapBookRecord);
}

export async function getBookBySlug(slug: string) {
  if (!(await hasDatabaseContent())) {
    return getSeedBookBySlug(slug);
  }

  const book = await db.book.findUnique({
    where: {
      slug,
    },
    include: bookInclude,
  });

  return book ? mapBookRecord(book) : null;
}

export async function getRelatedBooks(slug: string, authorId: string) {
  if (!(await hasDatabaseContent())) {
    return getSeedRelatedBooks(slug, authorId);
  }

  const books = await db.book.findMany({
    where: {
      slug: {
        not: slug,
      },
    },
    include: bookInclude,
  });

  return books
    .map(mapBookRecord)
    .sort((a, b) => {
      const aScore = a.author?._id === authorId ? 1 : 0;
      const bScore = b.author?._id === authorId ? 1 : 0;
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      const aTime = Date.parse(a.publicationDate ?? "");
      const bTime = Date.parse(b.publicationDate ?? "");
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    })
    .slice(0, 6);
}

export async function getAllBlogPosts() {
  if (!(await hasDatabaseContent())) {
    return getSeedAllBlogPosts();
  }

  const posts = await db.blogPost.findMany({
    include: postInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return posts.map(mapBlogPostRecord);
}

export async function getBlogPostBySlug(slug: string) {
  if (!(await hasDatabaseContent())) {
    return getSeedBlogPostBySlug(slug);
  }

  const post = await db.blogPost.findUnique({
    where: {
      slug,
    },
    include: postInclude,
  });

  return post ? mapBlogPostRecord(post) : null;
}

export async function getLatestBlogPosts() {
  if (!(await hasDatabaseContent())) {
    return getSeedLatestBlogPosts();
  }

  const posts = await db.blogPost.findMany({
    include: postInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 3,
  });

  return posts.map(mapBlogPostRecord);
}

export async function getAllAuthors() {
  if (!(await hasDatabaseContent())) {
    return getSeedAllAuthors();
  }

  const authors = await db.author.findMany({
    include: authorInclude,
    orderBy: {
      name: "asc",
    },
  });

  return authors.map(mapAuthorRecord);
}

export async function getAuthorBySlug(slug: string) {
  if (!(await hasDatabaseContent())) {
    return getSeedAuthorBySlug(slug);
  }

  const author = await db.author.findUnique({
    where: {
      slug,
    },
    include: authorInclude,
  });

  return author ? mapAuthorRecord(author) : null;
}

export async function getBooksByAuthor(slug: string) {
  if (!(await hasDatabaseContent())) {
    return getSeedBooksByAuthor(slug);
  }

  const books = await db.book.findMany({
    where: {
      author: {
        slug,
      },
    },
    include: bookInclude,
    orderBy: [{ publicationDate: "desc" }, { createdAt: "desc" }],
  });

  return books.map(mapBookRecord);
}
