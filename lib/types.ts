export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface SanityImageAsset {
  _ref?: string;
  _type?: "reference";
  url?: string;
}

export interface SanityImage {
  _type?: "image";
  asset?: SanityImageAsset;
  alt?: string;
}

export interface Author {
  _id: string;
  name: string;
  slug: string;
  photo?: SanityImage;
  photoUrl?: string;
  bio?: string;
  featured?: boolean;
  awards?: string[];
}

export interface Genre {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Book {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  author?: Author;
  coverImage?: SanityImage;
  coverImageUrl?: string;
  genre?: Genre[];
  synopsis?: string;
  pullQuote?: string;
  price?: number;
  buyLink?: string;
  publicationDate?: string;
  pageCount?: number;
  isbn?: string;
  language?: string;
  featured?: boolean;
  chapterPreview?: string;
  averageRating?: number;
  reviewCount?: number;
}

export interface CatalogBook {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  genreNames: string[];
  price?: number;
  publicationDate?: string;
  coverImageUrl?: string;
}

export interface RelatedBook {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  price?: number;
  coverImageUrl?: string;
}

export interface BookReviewView {
  id: string;
  reviewerName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface BookDetailView {
  id: string;
  slug: string;
  title: string;
  titleEn?: string;
  coverImageUrl?: string;
  authorName: string;
  authorSlug?: string;
  authorBio?: string;
  genres: string[];
  synopsis: string;
  pullQuote: string;
  chapterPreview: string;
  price?: number;
  buyLink?: string;
  publicationDate?: string;
  pageCount?: number;
  isbn?: string;
  language?: string;
  averageRating: number;
  reviewCount: number;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  coverImage?: SanityImage;
  coverImageUrl?: string;
  excerpt?: string;
  body?: string;
  author?: Author;
  publishedAt?: string;
  featured?: boolean;
}

export interface BlogPostCardView {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  coverImageUrl?: string;
  authorName: string;
  authorSlug?: string;
  publishedAt?: string;
  featured: boolean;
}

export interface BlogPostDetailView {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  coverImageUrl?: string;
  authorName: string;
  authorSlug?: string;
  authorBio?: string;
  publishedAt?: string;
  body: string;
}

export interface SiteSettings {
  _id: string;
  heroTagline?: string;
  heroTaglineEn?: string;
  missionStatement?: string;
  featuredBooks?: Book[];
  featuredAuthor?: Author;
  social?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  support?: {
    editorialEmail?: string;
    submissionsEmail?: string;
    rightsEmail?: string;
    supportPhone?: string;
    whatsappPhone?: string;
    postalAddress?: string;
  };
}

export interface SqlUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  shipping_address?: Json;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  book_id: string;
  book_title: string;
  book_cover_url?: string;
  quantity: number;
  price: number;
}

export interface CartItem {
  id: string;
  user_id: string;
  book_id: string;
  book_title: string;
  book_cover_url?: string;
  price: number;
  quantity: number;
  added_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  book_id: string;
  book_title: string;
  book_cover_url?: string;
  added_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
