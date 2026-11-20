import React, { useMemo, useState } from 'react';
import { ArrowLeft, Eye, Image as ImageIcon, Save, Send, Upload } from 'lucide-react';
import { useBlog } from '../../context/BlogContext';
import { EDITORIAL_GALLERY } from '../../data/seedData';
import {
  estimateReadingTime,
  SCHEMA_LIMITS,
  slugify,
  type Article,
  type ArticleStatus,
} from '../../types/blog';
import { EditorialImage } from '../EditorialImage';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface ArticleEditorProps {
  initialArticle?: Article | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function ArticleEditor({ initialArticle, onClose, onSaved }: ArticleEditorProps) {
  const { categories, user, saveArticle, uploadFeaturedImage, settings } = useBlog();
  const isExisting = Boolean(initialArticle);

  const defaultCat = categories[0] ?? { slug: 'make-money-online', name: 'Make Money Online' };

  const [title, setTitle] = useState(initialArticle?.title ?? '');
  const [slug, setSlug] = useState(initialArticle?.slug ?? '');
  const [slugLocked, setSlugLocked] = useState(Boolean(initialArticle));
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle ?? '');
  const [content, setContent] = useState(initialArticle?.content ?? '');
  const [featuredImage, setFeaturedImage] = useState(
    initialArticle?.featuredImage ?? ''
  );
  const [imageCaption, setImageCaption] = useState(initialArticle?.imageCaption ?? '');
  const [categorySlug, setCategorySlug] = useState(
    initialArticle?.categorySlug ?? defaultCat.slug
  );
  const [tagsText, setTagsText] = useState(initialArticle?.tags?.join(', ') ?? '');
  const [authorName, setAuthorName] = useState(
    initialArticle?.authorName ?? user?.displayName ?? 'Editorial Desk'
  );
  const [authorRole, setAuthorRole] = useState(
    initialArticle?.authorRole ?? 'Senior Editorial Strategist'
  );
  const [authorBio, setAuthorBio] = useState(initialArticle?.authorBio ?? '');
  const [publishedAt, setPublishedAt] = useState(
    initialArticle?.publishedAt ?? new Date().toISOString().slice(0, 10)
  );
  const [isTrending, setIsTrending] = useState(initialArticle?.isTrending ?? false);
  const [isFeatured, setIsFeatured] = useState(initialArticle?.isFeatured ?? false);
  const [seoTitle, setSeoTitle] = useState(initialArticle?.seoTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(
    initialArticle?.metaDescription ?? ''
  );

  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [showGallery, setShowGallery] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const computedReadingTime = useMemo(() => estimateReadingTime(content), [content]);
  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug) ?? defaultCat,
    [categories, categorySlug, defaultCat]
  );

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugLocked) {
      setSlug(slugify(val));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const downloadUrl = await uploadFeaturedImage(file);
      setFeaturedImage(downloadUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Firebase Storage upload failed (${err.message}). You can paste an image URL or pick from the editorial gallery below.`
          : 'Image upload failed. You can choose from the editorial gallery or paste an image URL.'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (targetStatus: ArticleStatus) => {
    setError('');
    const finalSlug = slugify(slug || title);

    if (title.trim().length < SCHEMA_LIMITS.ARTICLE.titleMin) {
      setError('Headline must be at least 5 characters long.');
      return;
    }
    if (finalSlug.length < 2) {
      setError('Please enter a valid URL slug (at least 2 alphanumeric characters).');
      return;
    }
    if (subtitle.trim().length < SCHEMA_LIMITS.ARTICLE.subtitleMin) {
      setError('Editorial summary / subtitle must be at least 10 characters long.');
      return;
    }
    if (content.trim().length < SCHEMA_LIMITS.ARTICLE.contentMin) {
      setError('Article body must be at least 20 characters long.');
      return;
    }

    setSaving(true);
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, SCHEMA_LIMITS.ARTICLE.maxTags);

      await saveArticle(
        {
          id: initialArticle?.id,
          slug: finalSlug,
          title: title.trim(),
          subtitle: subtitle.trim(),
          content: content.trim(),
          featuredImage: featuredImage.trim(),
          imageCaption: imageCaption.trim(),
          categorySlug: selectedCategory.slug,
          categoryName: selectedCategory.name,
          tags,
          authorName: authorName.trim() || 'Editorial Desk',
          authorRole: authorRole.trim() || 'Editor',
          authorBio: authorBio.trim(),
          readingTime: computedReadingTime,
          status: targetStatus,
          isTrending,
          isFeatured,
          seoTitle: seoTitle.trim() || `${title.trim()} | ${settings.siteName}`,
          metaDescription: metaDescription.trim() || subtitle.trim(),
          publishedAt,
          views: initialArticle?.views ?? 0,
        },
        isExisting
      );

      onSaved(
        targetStatus === 'published'
          ? `Published “${title.trim()}” to live site.`
          : `Saved draft “${title.trim()}”.`
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save article.');
    } finally {
      setSaving(false);
    }
  };

  const effectiveSeoTitle = seoTitle.trim() || `${title.trim() || 'Your Headline'} | ${settings.siteName}`;
  const effectiveMetaDesc = metaDescription.trim() || subtitle.trim() || 'Meta description preview appears here...';

  return (
    <div className="space-y-6">
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Articles</span>
          </button>
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#0B1B34]">
              {isExisting ? 'Edit Article' : 'Compose New Article'}
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              Estimated reading time: {computedReadingTime} min · URL: /article/{slugify(slug || title) || 'your-slug'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('draft')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-slate-300 bg-white text-[#0B1B34] hover:bg-slate-50 disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {saving ? 'Publishing...' : isExisting ? 'Update & Publish' : 'Publish Post'}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-rose-200 bg-rose-50 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Editorial Body Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Article Headline *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                maxLength={SCHEMA_LIMITS.ARTICLE.titleMax}
                placeholder="e.g. How to Build a $5,000/Month Freelance AI Consulting Practice"
                className="w-full px-3.5 py-2.5 border border-slate-300 text-base font-serif text-[#0B1B34] focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  SEO URL Slug *
                </label>
                <div className="flex items-center border border-slate-300 focus-within:border-emerald-700">
                  <span className="px-3 py-2 text-xs font-mono text-slate-500 bg-slate-50 border-r border-slate-200">
                    /article/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugLocked(true);
                      setSlug(slugify(e.target.value));
                    }}
                    maxLength={SCHEMA_LIMITS.ARTICLE.slugMax}
                    placeholder="freelance-ai-consulting-playbook"
                    className="flex-1 px-3 py-2 text-xs font-mono text-[#0B1B34] focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Publish Date
                </label>
                <input
                  type="date"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34] focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Editorial Deck / Subtitle *
              </label>
              <textarea
                rows={2}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                maxLength={SCHEMA_LIMITS.ARTICLE.subtitleMax}
                placeholder="A crisp 1-2 sentence summary shown on article cards and below the headline."
                className="w-full px-3.5 py-2.5 border border-slate-300 text-sm text-[#0B1B34] focus:outline-none focus:border-emerald-700"
              />
            </div>

            {/* Markdown Body Write / Preview Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Article Content (Markdown supported: ## Headings, &gt; Pull Quotes, - Bullets, **Bold**) *
                </label>
                <div className="inline-flex border border-slate-200 bg-slate-50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('write')}
                    className={`px-3 py-1 font-medium cursor-pointer ${
                      mode === 'write' ? 'bg-white text-[#0B1B34] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('preview')}
                    className={`inline-flex items-center gap-1 px-3 py-1 font-medium cursor-pointer ${
                      mode === 'preview' ? 'bg-white text-[#0B1B34] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                </div>
              </div>

              {mode === 'write' ? (
                <textarea
                  rows={18}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={SCHEMA_LIMITS.ARTICLE.contentMax}
                  placeholder="Write your full article here using Markdown headings (## Section Heading), bullet lists, and > pull quotes..."
                  className="w-full px-4 py-3 border border-slate-300 font-mono text-xs leading-relaxed text-[#0B1B34] focus:outline-none focus:border-emerald-700"
                />
              ) : (
                <div className="min-h-[380px] p-6 border border-slate-200 bg-slate-50/40">
                  {content.trim() ? (
                    <MarkdownRenderer content={content} dropCap />
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      Nothing written yet. Switch back to Write mode to compose your article.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SEO & Live SERP Preview */}
          <div className="bg-white border border-slate-200 p-6 space-y-5">
            <div className="pb-3 border-b border-slate-200">
              <h3 className="font-serif text-lg font-semibold text-[#0B1B34]">
                SEO Metadata & Search Snippet Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Controls Google search snippets, Open Graph social cards, and Schema.org Article data.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-semibold text-slate-700">SEO Meta Title</label>
                <span
                  className={`font-mono tabular-nums ${
                    effectiveSeoTitle.length > 65 ? 'text-amber-600' : 'text-emerald-700'
                  }`}
                >
                  {effectiveSeoTitle.length} / 60 recommended
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={SCHEMA_LIMITS.ARTICLE.seoTitleMax}
                placeholder="Defaults to Headline | EarnSmart Daily"
                className="w-full px-3.5 py-2 border border-slate-300 text-sm text-[#0B1B34] focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-semibold text-slate-700">Meta Description</label>
                <span
                  className={`font-mono tabular-nums ${
                    effectiveMetaDesc.length > 165 ? 'text-amber-600' : 'text-emerald-700'
                  }`}
                >
                  {effectiveMetaDesc.length} / 160 recommended
                </span>
              </div>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={SCHEMA_LIMITS.ARTICLE.metaDescriptionMax}
                placeholder="Compelling 120-160 character summary for search engines."
                className="w-full px-3.5 py-2 border border-slate-300 text-sm text-[#0B1B34] focus:outline-none focus:border-emerald-700"
              />
            </div>

            {/* Simulated Search Result Preview */}
            <div className="p-4 bg-slate-50 border border-slate-200 space-y-1">
              <p className="text-[11px] font-medium text-slate-500">
                {window.location.origin}/article/{slugify(slug || title) || 'your-article-slug'}
              </p>
              <p className="text-base font-medium text-[#1a0dab] leading-snug line-clamp-1">
                {effectiveSeoTitle}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {effectiveMetaDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Taxonomy, Featured Image, Author */}
        <div className="lg:col-span-4 space-y-6">
          {/* Category, Tags & Placement */}
          <div className="bg-white border border-slate-200 p-5 space-y-4">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2.5 border-b border-slate-200">
              Taxonomy & Placement
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 text-[#0B1B34] bg-white focus:outline-none focus:border-emerald-700"
              >
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tags (comma-separated, up to 10)
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="AI Tools, Freelancing, Remote Work"
                className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34] focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="accent-emerald-700 w-4 h-4"
                />
                <span>Highlight as Homepage Lead Feature</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="accent-emerald-700 w-4 h-4"
                />
                <span>Include in Trending Articles Ledger</span>
              </label>
            </div>
          </div>

          {/* Featured Image & Firebase Storage Upload */}
          <div className="bg-white border border-slate-200 p-5 space-y-4">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2.5 border-b border-slate-200">
              Featured Image
            </h3>

            <EditorialImage
              src={featuredImage}
              alt={title || 'Featured image preview'}
              aspectClass="aspect-[16/10]"
            />

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading...' : 'Upload to Storage'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowGallery((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{showGallery ? 'Hide Library' : 'Editorial Library'}</span>
              </button>
            </div>

            {showGallery && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {EDITORIAL_GALLERY.map((item) => (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => {
                      setFeaturedImage(item.url);
                      setShowGallery(false);
                    }}
                    title={item.label}
                    className={`overflow-hidden border-2 cursor-pointer ${
                      featuredImage === item.url ? 'border-emerald-700' : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-14 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                maxLength={SCHEMA_LIMITS.ARTICLE.featuredImageMax}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 text-[#0B1B34] focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Figure Caption
              </label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                maxLength={SCHEMA_LIMITS.ARTICLE.imageCaptionMax}
                placeholder="Fig. 1 — Editorial caption..."
                className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34] focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          {/* Author Attribution */}
          <div className="bg-white border border-slate-200 p-5 space-y-3.5">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2.5 border-b border-slate-200">
              Author Attribution
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={SCHEMA_LIMITS.ARTICLE.authorNameMax}
                className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Editorial Role
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                maxLength={SCHEMA_LIMITS.ARTICLE.authorRoleMax}
                className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Author Bio
              </label>
              <textarea
                rows={2}
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                maxLength={SCHEMA_LIMITS.ARTICLE.authorBioMax}
                placeholder="Short editorial bio shown below the article."
                className="w-full px-3 py-2 text-xs border border-slate-300 text-[#0B1B34]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
