import React from 'react';
import { slugify } from '../types/blog';

export interface TocHeading {
  id: string;
  text: string;
}

export function extractHeadings(markdown: string): TocHeading[] {
  return markdown
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => {
      const text = line.replace(/^##\s+/, '').trim();
      return { id: slugify(text) || 'section', text };
    });
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-[#0B1B34]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const href = linkMatch[2];
      const safeHref =
        href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/')
          ? href
          : '#';
      return (
        <a
          key={idx}
          href={safeHref}
          target={safeHref.startsWith('http') ? '_blank' : undefined}
          rel={safeHref.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

interface MarkdownRendererProps {
  content: string;
  dropCap?: boolean;
}

export function MarkdownRenderer({ content, dropCap = true }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let firstParagraphRendered = false;
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i].trim();
    if (!raw) {
      i++;
      continue;
    }

    // H2 Heading
    if (raw.startsWith('## ')) {
      const text = raw.replace(/^##\s+/, '').trim();
      const id = slugify(text) || `section-${i}`;
      blocks.push(
        <h2
          key={`h2-${i}`}
          id={id}
          className="font-serif text-2xl sm:text-[1.75rem] font-semibold text-[#0B1B34] mt-10 mb-4 pt-2 scroll-mt-24 leading-snug"
        >
          {text}
        </h2>
      );
      i++;
      continue;
    }

    // H3 Heading
    if (raw.startsWith('### ')) {
      const text = raw.replace(/^###\s+/, '').trim();
      blocks.push(
        <h3
          key={`h3-${i}`}
          className="font-serif text-xl font-semibold text-[#0B1B34] mt-8 mb-3 leading-snug"
        >
          {text}
        </h3>
      );
      i++;
      continue;
    }

    // Pull Quote (hairline top & bottom dividers — no thick left accent border)
    if (raw.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().replace(/^>\s+/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={`bq-${i}`}
          className="my-9 py-6 border-y border-slate-200 text-center px-4 sm:px-8"
        >
          <p className="font-serif italic text-xl sm:text-2xl text-[#0B1B34] leading-relaxed">
            “{renderInline(quoteLines.join(' '))}”
          </p>
        </blockquote>
      );
      continue;
    }

    // Unordered List
    if (raw.startsWith('- ') || raw.startsWith('* ')) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="my-5 space-y-3 pl-5 list-disc marker:text-emerald-700">
          {items.map((item, idx) => (
            <li key={idx} className="text-[16px] text-slate-700 leading-[1.75] pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(raw)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol
          key={`ol-${i}`}
          className="my-5 space-y-3 pl-5 list-decimal marker:text-[#0B1B34] marker:font-semibold"
        >
          {items.map((item, idx) => (
            <li key={idx} className="text-[16px] text-slate-700 leading-[1.75] pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph
    const paraLines: string[] = [raw];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('* ') &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    const applyDropCap = dropCap && !firstParagraphRendered;
    firstParagraphRendered = true;

    blocks.push(
      <p
        key={`p-${i}`}
        className={`text-[16px] sm:text-[17px] text-slate-700 leading-[1.8] mb-5 ${
          applyDropCap
            ? 'first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:text-[#0B1B34] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none'
            : ''
        }`}
      >
        {renderInline(paraLines.join(' '))}
      </p>
    );
  }

  return <div className="max-w-none">{blocks}</div>;
}
