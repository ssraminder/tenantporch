"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type PhotoUploadProps = {
  requestId: string;
  onUpload?: () => void;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoUpload({ requestId, onUpload }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      Array.from(newFiles).forEach((file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`${file.name} is not a supported image format`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds the 5MB size limit`);
          return;
        }
        // Avoid duplicates
        if (files.some((f) => f.name === file.name && f.size === file.size)) {
          return;
        }
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      });

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        setPreviews((prev) => [...prev, ...newPreviews]);
      }
    },
    [files]
  );

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      // Reset so the same file can be selected again
      e.target.value = "";
    }
  }

  async function handleUpload() {
    if (files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    let successCount = 0;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be signed in to upload photos");
        setUploading(false);
        return;
      }

      // Get the rp_user id
      const { data: rpUser } = await supabase
        .from("rp_users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!rpUser) {
        toast.error("User profile not found");
        setUploading(false);
        return;
      }

      for (const file of files) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${requestId}/${timestamp}_${safeName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("maintenance-photos")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("maintenance-photos")
          .getPublicUrl(storagePath);

        // Insert row into rp_maintenance_photos
        const { error: insertError } = await supabase
          .from("rp_maintenance_photos")
          .insert({
            request_id: requestId,
            photo_url: publicUrl,
            caption: null,
            uploaded_by: rpUser.id,
          });

        if (insertError) {
          toast.error(`Failed to save photo record for ${file.name}`);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} photo${successCount > 1 ? "s" : ""} uploaded successfully`
        );
        // Clean up previews
        previews.forEach((url) => URL.revokeObjectURL(url));
        setFiles([]);
        setPreviews([]);
        onUpload?.();
      }
    } catch {
      toast.error("An unexpected error occurred during upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-headline font-bold text-primary flex items-center gap-2">
        <span className="material-symbols-outlined">add_a_photo</span>
        Upload Photos
      </h3>

      {/* Drag & drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-primary bg-primary-fixed/10"
            : "border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp"
          multiple
        />
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant">
            cloud_upload
          </span>
          <p className="text-sm font-semibold text-on-surface">
            Drag & drop photos here
          </p>
          <p className="text-xs text-on-surface-variant">
            or click to browse &middot; JPG, PNG, GIF, WebP up to 5 MB
          </p>
        </div>
      </div>

      {/* Preview thumbnails */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative group aspect-square rounded-xl overflow-hidden bg-surface-container-high"
              >
                <img
                  src={previews[index]}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  title="Remove"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <p className="text-[9px] text-white truncate">{file.name}</p>
                  <p className="text-[9px] text-white/70">{formatFileSize(file.size)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              {files.length} photo{files.length > 1 ? "s" : ""} selected
            </p>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-ambient-sm hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">
                {uploading ? "hourglass_empty" : "upload"}
              </span>
              {uploading ? "Uploading..." : "Upload Photos"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
