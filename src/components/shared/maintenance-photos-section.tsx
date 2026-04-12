"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUpload } from "./photo-upload";
import { PhotoGallery } from "./photo-gallery";

type Photo = {
  id: string;
  photo_url: string;
  caption?: string | null;
  created_at: string;
};

type MaintenancePhotosSectionProps = {
  requestId: string;
  initialPhotos: Photo[];
};

export function MaintenancePhotosSection({
  requestId,
  initialPhotos,
}: MaintenancePhotosSectionProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

  const refreshPhotos = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("rp_maintenance_photos")
      .select("id, photo_url, caption, created_at")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (data) {
      setPhotos(data);
    }
  }, [requestId]);

  return (
    <div className="bg-surface-container-lowest rounded-3xl shadow-ambient-sm overflow-hidden">
      <div className="p-6 md:p-8 space-y-6">
        {/* Gallery */}
        <div>
          <h2 className="text-lg font-headline font-bold text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">photo_library</span>
            Photos
          </h2>
          <PhotoGallery photos={photos} />
        </div>

        {/* Divider */}
        <div className="border-t border-outline-variant/10" />

        {/* Upload */}
        <PhotoUpload requestId={requestId} onUpload={refreshPhotos} />
      </div>
    </div>
  );
}
