import React from 'react';

export type Photo = {
  id: string;
  eventId: string;
  url: string;
  caption?: string | null;
  createdAt?: string | Date;
  blurDataUrl?: string | null;
};

export function Gallery({ photos }: { photos: Photo[] }) {
  if (!photos?.length) return <div>No photos yet</div>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {photos.map((p) => (
        <figure key={p.id} className="relative">
          <img
            src={p.url}
            alt={p.caption || 'Event photo'}
            loading="lazy"
            className="w-full h-auto object-cover rounded"
            style={p.blurDataUrl ? { backgroundImage: `url(${p.blurDataUrl})`, backgroundSize: 'cover' } : undefined}
          />
          {p.caption ? <figcaption className="text-xs text-gray-500 mt-1">{p.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
