"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ImageIcon, Video, Box, Upload, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FacilityMedia, MediaType } from "@/types";

interface Props {
  facilityId: string;
  initialMedia?: FacilityMedia[];
}

const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  image: "Image",
  gaussian_splat: "3D Tour",
  video: "Video",
};

const ACCEPTED_MIME: Record<MediaType, string> = {
  image: "image/jpeg,image/png,image/webp,image/avif",
  gaussian_splat: "application/octet-stream,model/ply",
  video: "video/mp4,video/webm,video/quicktime",
};

type UploadState = "idle" | "uploading" | "done" | "error";

interface UploadingFile {
  name: string;
  type: MediaType;
  state: UploadState;
  progress: number;
  error?: string;
}

export function FacilityMediaUpload({ facilityId, initialMedia }: Props) {
  const [media, setMedia] = useState<FacilityMedia[]>(initialMedia ?? []);
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [mediaType, setMediaType] = useState<MediaType>("image");

  const handleFile = useCallback(
    async (file: File) => {
      const fileName = file.name;
      const contentType = file.type || "application/octet-stream";

      setUploads((prev) => [
        ...prev,
        { name: fileName, type: mediaType, state: "uploading", progress: 0 },
      ]);

      try {
        const res = await fetch(`/api/facilities/${facilityId}/media/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName, contentType, mediaType }),
        });

        if (!res.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { url, fields, key } = await res.json();

        const form = new FormData();
        Object.entries(fields).forEach(([k, v]) => form.append(k, v as string));
        form.append("Content-Type", contentType);
        form.append("file", file);

        const uploadRes = await fetch(url, { method: "POST", body: form });

        if (!uploadRes.ok) {
          throw new Error("Upload failed");
        }

        const mediaUrl = `${url.split("?")[0]}/${encodeURIComponent(key.split("/").pop()!)}`;

        const createRes = await fetch(`/api/facilities/${facilityId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: mediaType,
            key,
            url: mediaUrl,
            mimeType: contentType,
            fileSize: file.size,
            displayOrder: media.length,
          }),
        });

        if (!createRes.ok) {
          throw new Error("Failed to save media record");
        }

        const newMedia = await createRes.json();
        setMedia((prev) => [...prev, newMedia]);
        setUploads((prev) =>
          prev.map((u) =>
            u.name === fileName ? { ...u, state: "done" as const } : u,
          ),
        );
      } catch (err: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.name === fileName
              ? { ...u, state: "error" as const, error: err.message }
              : u,
          ),
        );
      }
    },
    [facilityId, media.length, mediaType],
  );

  async function handleDelete(item: FacilityMedia) {
    const res = await fetch(
      `/api/facilities/${facilityId}/media/${item.id}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          Photos & Media
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(Object.entries(MEDIA_TYPE_LABELS) as [MediaType, string][]).map(
            ([type, label]) => (
              <Button
                key={type}
                type="button"
                variant={mediaType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setMediaType(type)}
              >
                {type === "image" && <ImageIcon className="mr-1.5 h-4 w-4" />}
                {type === "gaussian_splat" && <Box className="mr-1.5 h-4 w-4" />}
                {type === "video" && <Video className="mr-1.5 h-4 w-4" />}
                {label}
              </Button>
            ),
          )}
        </div>

        <div
          className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <input
            type="file"
            className="absolute inset-0 cursor-pointer opacity-0"
            accept={ACCEPTED_MIME[mediaType]}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop a file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground/60">
            {mediaType === "image" && "JPEG, PNG, WebP, AVIF (max 10 MB)"}
            {mediaType === "gaussian_splat" && "PLY or binary (max 500 MB)"}
            {mediaType === "video" && "MP4, WebM, MOV (max 500 MB)"}
          </p>
        </div>

        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((u) => (
              <div
                key={u.name}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm"
              >
                {u.state === "uploading" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : u.state === "error" ? (
                  <X className="h-4 w-4 text-destructive" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                )}
                <span className="flex-1 truncate">{u.name}</span>
                <span className="text-xs text-muted-foreground">
                  {u.state === "uploading" && "Uploading..."}
                  {u.state === "done" && "Done"}
                  {u.state === "error" && (u.error ?? "Failed")}
                </span>
              </div>
            ))}
          </div>
        )}

        {media.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                {item.type === "image" && (
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                )}
                {item.type === "gaussian_splat" && (
                  <div className="flex h-full items-center justify-center">
                    <Box className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {item.type === "video" && (
                  <div className="flex h-full items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-start justify-end gap-1 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Badge className="bg-black/60 text-white hover:bg-black/60">
                    {MEDIA_TYPE_LABELS[item.type]}
                  </Badge>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex justify-center p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
