import React, { useState } from 'react';
import { Check, Mail } from 'lucide-react';
import { useBlog } from '../context/BlogContext';

interface NewsletterSectionProps {
  source?: string;
  compact?: boolean;
}

const REGIONS = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'India',
  'Europe & Worldwide',
];

export function NewsletterSection({
  source = 'homepage',
  compact = false,
}: NewsletterSectionProps) {
  const { settings, subscribeNewsletter } = useBlog();
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('United States');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      setStatus('error');
      return;
    }

    setSubmitting(true);
    try {
      await subscribeNewsletter(email, region, source);
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Subscription could not be completed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div className="border border-slate-200 bg-[#0B1B34] text-white p-6">
        <p className="text-xs font-medium text-emerald-400 mb-2">Weekly Briefing</p>
        <h3 className="font-serif text-xl font-semibold leading-snug mb-2">
          {settings.newsletterTitle}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Actionable online income guides and AI playbooks delivered every Sunday. Free forever.
        </p>

        {status === 'success' ? (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-900/50 border border-emerald-700/60 text-xs text-emerald-100">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>You are subscribed. Watch your inbox this Sunday morning.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              aria-label="Email address"
              className="w-full px-3.5 py-2.5 text-sm bg-white text-[#0B1B34] placeholder:text-slate-400 focus:outline-2 focus:outline-emerald-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Subscribing...' : 'Join Free Dispatch'}
            </button>
            {status === 'error' && errorMsg && (
              <p className="text-xs text-rose-300">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    );
  }

  return (
    <section
      id="newsletter"
      className="bg-[#0B1B34] text-white border-y border-slate-800 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <Mail className="w-4 h-4" />
              <span>EarnSmart Daily Newsletter · Every Sunday</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              {settings.newsletterTitle}
            </h2>
            <p className="text-slate-300 text-base leading-relaxed max-w-xl">
              {settings.newsletterDescription}
            </p>
          </div>

          <div className="lg:col-span-6">
            {status === 'success' ? (
              <div className="border border-emerald-700/70 bg-emerald-950/60 p-6 flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-serif text-lg font-medium text-white">
                    Welcome to {settings.siteName}
                  </p>
                  <p className="text-sm text-emerald-100/90 mt-1">
                    Your subscription is confirmed. You will receive our next global earning
                    dispatch this Sunday.
                  </p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-[#112442] border border-slate-700/80 p-6 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7">
                    <label htmlFor="newsletter-email" className="block text-xs text-slate-300 mb-1.5">
                      Work or personal email
                    </label>
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-white text-[#0B1B34] placeholder:text-slate-400 focus:outline-2 focus:outline-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label htmlFor="newsletter-region" className="block text-xs text-slate-300 mb-1.5">
                      Your region
                    </label>
                    <select
                      id="newsletter-region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-white text-[#0B1B34] focus:outline-2 focus:outline-emerald-500"
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-slate-400">
                    Zero spam. Unsubscribe in one click. Global editions in English.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {submitting ? 'Joining...' : 'Subscribe Free'}
                  </button>
                </div>

                {status === 'error' && errorMsg && (
                  <p className="text-xs text-rose-300 pt-1">{errorMsg}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
