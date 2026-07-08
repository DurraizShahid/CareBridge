"use client";

import { useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PatientDocument } from "@/types";

interface Props {
  patientId: string;
  initialDocuments?: PatientDocument[];
}

export function PatientDocumentUpload({ patientId, initialDocuments }: Props) {
  const [docs, setDocs] = useState<PatientDocument[]>(initialDocuments ?? []);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const res = await fetch(
        `/api/patients/${patientId}/documents/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to get upload URL");

      const { url, fields, key } = await res.json();

      const form = new FormData();
      Object.entries(fields).forEach(([k, v]) => form.append(k, v as string));
      form.append("Content-Type", file.type);
      form.append("file", file);

      const uploadRes = await fetch(url, { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const docUrl = `${url.split("?")[0]}/${encodeURIComponent(key.split("/").pop()!)}`;

      const createRes = await fetch(`/api/patients/${patientId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          key,
          url: docUrl,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to save document record");

      const newDoc = await createRes.json();
      setDocs((prev) => [newDoc, ...prev]);
    } catch {
      // swallow
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    const res = await fetch(`/api/patients/${patientId}/documents/${docId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    }
  }

  function formatSize(bytes?: number): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          Documents ({docs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleUpload(file);
          }}
        >
          <input
            type="file"
            className="absolute inset-0 cursor-pointer opacity-0"
            accept=".pdf,.doc,.docx,.txt,.csv,image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {uploading ? "Uploading..." : "Drop a document here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground/60">
            PDF, DOC, DOCX, TXT, CSV, images (max 50 MB)
          </p>
        </div>

        {docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.mimeType && (
                      <Badge variant="outline" className="mr-1.5 text-[10px]">
                        {doc.mimeType}
                      </Badge>
                    )}
                    {formatSize(doc.fileSize)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
