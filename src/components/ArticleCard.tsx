import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { EditorialImage } from './EditorialImage';
import { formatDisplayDate, type Article } from '../types/blog';

interface ArticleCardProps {
  article: Article;
  variant?: 'standard' | 'compact' | 'horizontal';
  showExcerpt?: boolean;
}

export function ArticleCard({
  article,
  variant = 'standard',
  showExcerpt = true,
}: ArticleCardProps) {
  if (variant === 'compact') {
    return (
      <article className="group py-5 border-b border-slate-200 last:border-b-0">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link
            to={`/category/${article.categorySlug}`}
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {article.categoryName}
          </Link>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{article.readingTime} min read</span>
          <span aria-hidden="true">·</span>
          <span>{formatDisplayDate(article.publishedAt)}</span>
        </div>
        <Link to={`/article/${article.slug}`} className="block">
          <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#0B1B34] leading-snug group-hover:text-emerald-700 transition-colors mb-1.5">
            {article.title}
          </h3>
          {showExcerpt && (
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
              {article.subtitle}
            </p>
          )}
        </Link>
        <p className="text-xs text-slate-500 mt-2.5">By {article.authorName}</p>
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article className="group grid grid-cols-1 md:grid-cols-12 gap-6 py-6 border-b border-slate-200 last:border-b-0 items-stretch">
        <Link
          to={`/article/${article.slug}`}
          className="md:col-span-5 block overflow-hidden"
        >
          <EditorialImage
            src={article.featuredImage}
            alt={article.title}
            aspectClass="aspect-[4/3] md:h-full"
          />
        </Link>
        <div className="md:col-span-7 flex flex-col justify-between py-1">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2.5">
              <Link
                to={`/category/${article.categorySlug}`}
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {article.categoryName}
              </Link>
              <span aria-hidden="true">·</span>
              <span>{formatDisplayDate(article.publishedAt)}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{article.readingTime} min read</span>
            </div>
            <Link to={`/article/${article.slug}`} className="block">
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0B1B34] leading-snug group-hover:text-emerald-700 transition-colors mb-2.5">
                {article.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                {article.subtitle}
              </p>
            </Link>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-600 font-medium">By {article.authorName}</span>
            <Link
              to={`/article/${article.slug}`}
              className="inline-flex items-center gap-1 font-semibold text-[#0B1B34] group-hover:text-emerald-700 transition-colors"
            >
              <span>Read guide</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col h-full bg-white border border-slate-200 hover:border-slate-300 transition-colors">
      <Link to={`/article/${article.slug}`} className="block overflow-hidden">
        <EditorialImage
          src={article.featuredImage}
          alt={article.title}
          aspectClass="aspect-[4/3]"
        />
      </Link>
      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2.5">
            <Link
              to={`/category/${article.categorySlug}`}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {article.categoryName}
            </Link>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{article.readingTime} min read</span>
          </div>
          <Link to={`/article/${article.slug}`} className="block">
            <h3 className="font-serif text-xl font-semibold text-[#0B1B34] leading-snug group-hover:text-emerald-700 transition-colors mb-2.5">
              {article.title}
            </h3>
            {showExcerpt && (
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                {article.subtitle}
              </p>
            )}
          </Link>
        </div>

        <div className="flex items-center justify-between pt-4 mt-5 border-t border-slate-100 text-xs text-slate-500">
          <span className="truncate pr-2">By {article.authorName}</span>
          <span className="whitespace-nowrap shrink-0">
            {formatDisplayDate(article.publishedAt)}
          </span>
        </div>
      </div>
    </article>
  );
}
