import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import type { AdSlot } from '../types/blog';

interface AdPlacementProps {
  slot: AdSlot;
  variant?: 'horizontal' | 'sidebar';
  className?: string;
}

export function AdPlacement({
  slot,
  variant = 'horizontal',
  className = '',
}: AdPlacementProps) {
  const { getAdBySlot } = useBlog();
  const ad = getAdBySlot(slot);

  if (!ad) return null;

  const isInternal = ad.targetUrl.startsWith('/');

  const actionButton = isInternal ? (
    <Link
      to={ad.targetUrl}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
    >
      <span>{ad.ctaText}</span>
      <ArrowUpRight className="w-3.5 h-3.5" />
    </Link>
  ) : (
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1B34] hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
    >
      <span>{ad.ctaText}</span>
      <ArrowUpRight className="w-3.5 h-3.5" />
    </a>
  );

  if (variant === 'sidebar') {
    return (
      <aside
        aria-label={ad.label}
        className={`border border-slate-200 bg-slate-50/80 p-5 ${className}`}
      >
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500 pb-3 mb-3 border-b border-slate-200">
          <span>{ad.label}</span>
          <span>{ad.sponsorName}</span>
        </div>
        <h3 className="font-serif text-lg font-semibold text-[#0B1B34] leading-snug mb-2">
          {ad.headline}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">{ad.description}</p>
        {actionButton}
      </aside>
    );
  }

  return (
    <aside
      aria-label={ad.label}
      className={`border border-slate-200 bg-slate-50/70 px-6 py-5 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-emerald-700">{ad.label}</span>
            <span aria-hidden="true">·</span>
            <span>Presented by {ad.sponsorName}</span>
          </div>
          <p className="font-serif text-lg font-semibold text-[#0B1B34] leading-snug">
            {ad.headline}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">{ad.description}</p>
        </div>
        <div className="shrink-0">{actionButton}</div>
      </div>
    </aside>
  );
}
