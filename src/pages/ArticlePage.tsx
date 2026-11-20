import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Copy, Share2 } from 'lucide-react';
import { useBlog } from '../context/BlogContext';
import { useSEO } from '../hooks/useSEO';
import { AdPlacement } from '../components/AdPlacement';
import { ArticleCard } from '../components/ArticleCard';
import { EditorialImage } from '../components/EditorialImage';
import { extractHeadings, MarkdownRenderer } from '../components/MarkdownRenderer';
import { NewsletterSection } from '../components/NewsletterSection';
import { formatDisplayDate } from '../types/blog';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { articles, publishedArticles, isAdmin, settings } = useBlog();
  const [readProgress, setReadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // Authorized admins can preview drafts; public visitors only see published articles
  const pool = isAdmin ? articles : publishedArticles;
  const article = useMemo(
    () => pool.find((a) => a.slug === slug || a.id === slug),
    [pool, slug]
  );

  const headings = useMemo(
    () => (article ? extractHeadings(article.content) : []),
    [article]
  );

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    const sameCategory = publishedArticles.filter(
      (a) => a.slug !== article.slug && a.categorySlug === article.categorySlug
    );
    const sharedTag = publishedArticles.filter(
      (a) =>
        a.slug !== article.slug &&
        a.categorySlug !== article.categorySlug &&
        a.tags.some((t) => article.tags.includes(t))
    );
    const others = publishedArticles.filter(
      (a) =>
        a.slug !== article.slug &&
        !sameCategory.includes(a) &&
        !sharedTag.includes(a)
    );
    return [...sameCategory, ...sharedTag, ...others].slice(0, 3);
  }, [article, publishedArticles]);

  const structuredData = useMemo(() => {
    if (!article) return undefined;
    const origin = window.location.origin;
    const url = `${origin}/article/${article.slug}`;
    const imageUrl = article.featuredImage.startsWith('http')
      ? article.featuredImage
      : `${origin}${article.featuredImage}`;

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.metaDescription || article.subtitle,
        image: [imageUrl],
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        author: {
          '@type': 'Person',
          name: article.authorName,
          jobTitle: article.authorRole,
        },
        publisher: {
          '@type': 'Organization',
          name: settings.siteName,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
        articleSection: article.categoryName,
        keywords: article.tags.join(', '),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
          {
            '@type': 'ListItem',
            position: 2,
            name: article.categoryName,
            item: `${origin}/category/${article.categorySlug}`,
          },
          { '@type': 'ListItem', position: 3, name: article.title, item: url },
        ],
      },
    ];
  }, [article, settings.siteName]);

  useSEO({
    title: article
      ? article.seoTitle || `${article.title} | ${settings.siteName}`
      : `Article Not Found | ${settings.siteName}`,
    description: article
      ? article.metaDescription || article.subtitle
      : settings.defaultMetaDescription,
    canonicalPath: article ? `/article/${article.slug}` : window.location.pathname,
    ogType: article ? 'article' : 'website',
    ogImage: article?.featuredImage,
    jsonLd: structuredData,
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setReadProgress(0);
        return;
      }
      setReadProgress(Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!article) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-xs font-semibold text-emerald-700 mb-3">404 · Editorial Archive</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0B1B34] mb-4">
          This article could not be found
        </h1>
        <p className="text-slate-600 mb-8">
          It may have been moved, unpublished, or the URL slug may have changed.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to EarnSmart Daily</span>
        </Link>
      </main>
    );
  }

  const shareUrl = `${window.location.origin}/article/${article.slug}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(article.title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="bg-white">
      {/* Thin Top Reading Progress Bar */}
      <div
        className="fixed top-16 left-0 right-0 h-[2px] bg-slate-100 z-30"
        aria-hidden="true"
      >
        <div
          className="h-full bg-emerald-600 transition-transform duration-75 origin-left"
          style={{ transform: `scaleX(${readProgress / 100})` }}
        />
      </div>

      {/* Editorial Article Header */}
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        {/* Breadcrumb Trail */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-7"
        >
          <Link to="/" className="hover:text-[#0B1B34]">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            to={`/category/${article.categorySlug}`}
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {article.categoryName}
          </Link>
          {article.status === 'draft' && (
            <>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-amber-700">Draft Preview (Admin Only)</span>
            </>
          )}
        </nav>

        {/* Headline Block */}
        <header className="max-w-4xl mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.85rem] font-semibold text-[#0B1B34] leading-[1.12] tracking-tight mb-5">
            {article.title}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-7">
            {article.subtitle}
          </p>

          {/* Clean Unboxed Byline + Social Share Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-200">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600">
              <span className="font-semibold text-[#0B1B34]">{article.authorName}</span>
              <span className="text-slate-400" aria-hidden="true">
                ·
              </span>
              <span>{article.authorRole}</span>
              <span className="text-slate-400" aria-hidden="true">
                ·
              </span>
              <span>{formatDisplayDate(article.publishedAt)}</span>
              <span className="text-slate-400" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                {article.readingTime} min read
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 inline-flex items-center gap-1 mr-1">
                <Share2 className="w-3.5 h-3.5" />
                Share:
              </span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:border-[#0B1B34] hover:text-[#0B1B34] transition-colors font-medium"
              >
                X
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:border-[#0B1B34] hover:text-[#0B1B34] transition-colors font-medium"
              >
                LinkedIn
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:border-[#0B1B34] hover:text-[#0B1B34] transition-colors font-medium"
              >
                Facebook
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:border-[#0B1B34] hover:text-[#0B1B34] transition-colors font-medium"
              >
                WhatsApp
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:border-emerald-700 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-12">
          <EditorialImage
            src={article.featuredImage}
            alt={article.title}
            caption={article.imageCaption}
            aspectClass="aspect-[16/9] max-h-[540px]"
            priority
          />
        </div>

        {/* Asymmetric 70/30 Editorial Reading Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Prose Column (Optimal 65-75ch Measure) */}
          <div className="lg:col-span-8">
            <div className="max-w-[68ch]">
              <MarkdownRenderer content={article.content} dropCap />

              {/* Tags Row (Clean unboxed typography links) */}
              {article.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">
                    Topics:
                  </span>
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="font-medium text-[#0B1B34] hover:text-emerald-700 underline underline-offset-4 decoration-slate-300 hover:decoration-emerald-700"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Author Card */}
              <section
                aria-label="About the author"
                className="mt-10 p-6 bg-slate-50 border border-slate-200"
              >
                <p className="text-xs font-semibold text-emerald-700 mb-1">About the Author</p>
                <h2 className="font-serif text-xl font-semibold text-[#0B1B34]">
                  {article.authorName}
                </h2>
                <p className="text-xs text-slate-500 mb-3">{article.authorRole}</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {article.authorBio ||
                    `${article.authorName} contributes researched online income and remote strategy reporting to ${settings.siteName}.`}
                </p>
              </section>

              {/* Article Bottom Ad Placement */}
              <div className="mt-10">
                <AdPlacement slot="article-footer" variant="horizontal" />
              </div>
            </div>
          </div>

          {/* Sticky Right Editorial Rail */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-8">
            {/* Auto-Extracted Table of Contents */}
            {headings.length > 0 && (
              <div className="border border-slate-200 p-5 bg-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 mb-3 border-b border-slate-200">
                  In This Guide
                </p>
                <nav aria-label="Table of contents">
                  <ul className="space-y-2.5 text-sm">
                    {headings.map((h, idx) => (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          className="flex items-baseline gap-2.5 text-slate-700 hover:text-emerald-700 transition-colors leading-snug"
                        >
                          <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0">
                            0{idx + 1}
                          </span>
                          <span>{h.text}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            )}

            {/* Sidebar Advertisement Placement */}
            <AdPlacement slot="article-sidebar" variant="sidebar" />

            {/* Compact Newsletter Box */}
            <NewsletterSection source={`article:${article.slug}`} compact />
          </aside>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1">Continue Reading</p>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B1B34]">
                  Related Articles
                </h2>
              </div>
              <Link
                to={`/category/${article.categorySlug}`}
                className="text-sm font-medium text-slate-600 hover:text-emerald-700"
              >
                More in {article.categoryName}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {relatedArticles.map((rel) => (
                <ArticleCard key={rel.slug} article={rel} variant="standard" />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
