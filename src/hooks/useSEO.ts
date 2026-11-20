import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSEO({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage,
  jsonLd,
}: SEOOptions) {
  useEffect(() => {
    const origin = window.location.origin;
    const path = canonicalPath ?? window.location.pathname;
    const canonicalUrl = `${origin}${path.startsWith('/') ? path : `/${path}`}`;
    const resolvedImage = ogImage
      ? ogImage.startsWith('http')
        ? ogImage
        : `${origin}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`
      : undefined;

    document.title = title;

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:site_name', 'EarnSmart Daily');

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    if (resolvedImage) {
      setMetaTag('property', 'og:image', resolvedImage);
      setMetaTag('name', 'twitter:image', resolvedImage);
    }

    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    const existingScript = document.getElementById('earnsmart-dynamic-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'earnsmart-dynamic-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const dynamicScript = document.getElementById('earnsmart-dynamic-jsonld');
      if (dynamicScript) {
        dynamicScript.remove();
      }
    };
  }, [title, description, canonicalPath, ogType, ogImage, jsonLd]);
}
