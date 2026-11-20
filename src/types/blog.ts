export type ArticleStatus = 'draft' | 'published';

export type AdSlot =
  | 'header-leaderboard'
  | 'homepage-mid'
  | 'article-sidebar'
  | 'article-footer';

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  featuredImage: string;
  imageCaption: string;
  categorySlug: string;
  categoryName: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  authorBio: string;
  authorUid: string;
  readingTime: number;
  status: ArticleStatus;
  isTrending: boolean;
  isFeatured: boolean;
  seoTitle: string;
  metaDescription: string;
  views: number;
  publishedAt: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Advertisement {
  id: string;
  slot: AdSlot;
  label: string;
  headline: string;
  description: string;
  ctaText: string;
  targetUrl: string;
  sponsorName: string;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  defaultSeoTitle: string;
  defaultMetaDescription: string;
  contactEmail: string;
  newsletterTitle: string;
  newsletterDescription: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  updatedAt?: unknown;
}

export interface Subscriber {
  id: string;
  email: string;
  region: string;
  source: string;
  createdAt?: unknown;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  addedBy: string;
  createdAt?: unknown;
}

/**
 * Synchronized with firebase-blueprint.json and firestore.rules
 */
export const SCHEMA_LIMITS = {
  SLUG_PATTERN: /^[a-z0-9-]+$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  ARTICLE: {
    slugMax: 140,
    titleMin: 5,
    titleMax: 180,
    subtitleMin: 10,
    subtitleMax: 320,
    contentMin: 20,
    contentMax: 60000,
    featuredImageMax: 1000,
    imageCaptionMax: 240,
    categorySlugMax: 80,
    categoryNameMax: 80,
    maxTags: 10,
    tagMaxLen: 40,
    authorNameMax: 100,
    authorRoleMax: 120,
    authorBioMax: 400,
    seoTitleMax: 120,
    metaDescriptionMax: 260,
  },
  CATEGORY: {
    slugMax: 80,
    nameMax: 80,
    descriptionMax: 300,
  },
  AD: {
    labelMax: 60,
    headlineMax: 140,
    descriptionMax: 260,
    ctaTextMax: 40,
    targetUrlMax: 500,
    sponsorNameMax: 100,
  },
} as const;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, SCHEMA_LIMITS.ARTICLE.slugMax);
}

export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.min(60, Math.ceil(words / 220)));
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parsed = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map((t) => t.trim().slice(0, SCHEMA_LIMITS.ARTICLE.tagMaxLen))
    .filter((t) => t.length > 0)
    .slice(0, SCHEMA_LIMITS.ARTICLE.maxTags);
}
