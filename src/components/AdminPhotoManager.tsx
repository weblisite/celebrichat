import React from 'react';

export type AdminPhoto = {
  id: string;
  eventId: string;
  url: string;
  caption?: string | null;
  isPublic?: boolean;
  createdAt?: string | Date;
  blurDataUrl?: string | null;
};

export type AdminPhotoManagerProps = {
  photos: AdminPhoto[];
  onTogglePublic?: (id: string, next: boolean) => void;
};

export function AdminPhotoManager({ photos, onTogglePublic }: AdminPhotoManagerProps) {
  if (!photos?.length) return <div>No photos uploaded</div>;
  return (
    <div className="space-y-2">
      {photos.map((p) => (
        <div key={p.id} className="flex items-center gap-3">
          <img src={p.url} alt={p.caption || 'Photo'} className="w-20 h-20 object-cover rounded" loading="lazy" />
          <div className="flex-1">
            <div className="text-sm truncate">{p.caption || p.url}</div>
            <div className="text-xs text-gray-500">{p.isPublic ? 'Public' : 'Private'}</div>
          </div>
          <button
            className="px-2 py-1 rounded border text-sm"
            onClick={() => onTogglePublic?.(p.id, !p.isPublic)}
            aria-label="Toggle public"
          >
            {p.isPublic ? 'Make Private' : 'Make Public'}
          </button>
        </div>
      ))}
    </div>
  );
}
