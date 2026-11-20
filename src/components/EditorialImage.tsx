import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface EditorialImageProps {
  src: string;
  alt: string;
  caption?: string;
  aspectClass?: string;
  className?: string;
  priority?: boolean;
}

export function EditorialImage({
  src,
  alt,
  caption,
  aspectClass = 'aspect-[4/3]',
  className = '',
  priority = false,
}: EditorialImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className={`w-full ${className}`}>
      <div
        className={`relative overflow-hidden bg-slate-100 border border-slate-200/80 ${aspectClass}`}
      >
        {!failed && src ? (
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/60 text-center">
            <BookOpen className="w-7 h-7 text-[#0B1B34]/40 mb-2" strokeWidth={1.5} />
            <span className="font-serif text-sm text-[#0B1B34]/75 line-clamp-2 max-w-xs">
              {alt}
            </span>
          </div>
        )}
      </div>
      {caption ? (
        <figcaption className="mt-2.5 text-xs font-serif italic text-slate-500 leading-relaxed">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
