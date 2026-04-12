"use client";

import { useState } from "react";

type Photo = {
  id: string;
  photo_url: string;
  caption?: string | null;
  created_at: string;
};

type PhotoGalleryProps = {
  photos: Photo[];
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="material-symbols-outlined text-3xl text-outline-variant mb-2 block">
          photo_library
        </span>
        <p className="text-sm text-on-surface-variant">No photos uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="relative aspect-square bg-surface-container-high rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <img
              src={photo.photo_url}
              alt={photo.caption ?? "Maintenance photo"}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">
                zoom_in
              </span>
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
              {photo.caption && (
                <p className="text-[10px] text-white font-medium truncate">
                  {photo.caption}
                </p>
              )}
              <p className="text-[9px] text-white/70">
                {formatDate(photo.created_at)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>

          {/* Previous button */}
          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            >
              <span className="material-symbols-outlined text-white">
                chevron_left
              </span>
            </button>
          )}

          {/* Next button */}
          {lightboxIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            >
              <span className="material-symbols-outlined text-white">
                chevron_right
              </span>
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].photo_url}
              alt={photos[lightboxIndex].caption ?? "Maintenance photo"}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-3 text-center">
              {photos[lightboxIndex].caption && (
                <p className="text-sm text-white font-medium">
                  {photos[lightboxIndex].caption}
                </p>
              )}
              <p className="text-xs text-white/60 mt-1">
                {formatDate(photos[lightboxIndex].created_at)} &middot;{" "}
                {lightboxIndex + 1} of {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
