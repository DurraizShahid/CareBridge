"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { RiUploadCloud2Line, RiFileTextLine } from "@remixicon/react";
import { cn } from "@/lib/utils";
import type { DocumentCategory } from "@/types";

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "patient-records", label: "Patient Records" },
  { value: "medical-documentation", label: "Medical Documentation" },
  { value: "consent-forms", label: "Consent Forms" },
  { value: "insurance-documents", label: "Insurance Documents" },
  { value: "compliance-documents", label: "Compliance Documents" },
  { value: "policies", label: "Policies" },
  { value: "procedures", label: "Procedures" },
  { value: "audit-documents", label: "Audit Documents" },
  { value: "employee-training-records", label: "Employee Training Records" },
  { value: "business-associate-agreements", label: "Business Associate Agreements" },
  { value: "security-documentation", label: "Security Documentation" },
  { value: "privacy-documentation", label: "Privacy Documentation" },
  { value: "other", label: "Other" },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  organizationId: string;
}

interface UploadFormData {
  title: string;
  description: string;
  category: DocumentCategory;
  tags: string;
  notes: string;
  retentionDate: string;
  expirationDate: string;
}

const emptyForm: UploadFormData = {
  title: "",
  description: "",
  category: "other",
  tags: "",
  notes: "",
  retentionDate: "",
  expirationDate: "",
};

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  organizationId,
}: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"select" | "form">("select");
  const [form, setForm] = useState<UploadFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.type.startsWith("image/")) {
      return "File type not supported. Accepted: PDF, images, text, Word, Excel, PowerPoint.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return "File exceeds 50MB maximum size.";
    }
    if (f.size === 0) {
      return "File is empty.";
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (f: File) => {
      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setFile(f);
      setForm((prev) => ({
        ...prev,
        title: prev.title || f.name.replace(/\.[^/.]+$/, ""),
      }));
      setStep("form");
    },
    [validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleInputChange = (
    field: keyof UploadFormData,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const reset = useCallback(() => {
    setFile(null);
    setForm(emptyForm);
    setStep("select");
    setError(null);
    setUploading(false);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    reset();
  }, [onOpenChange, reset]);

  const handleSubmit = async () => {
    if (!file) return;
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Upload the file to the server. It is validated, malware-scanned,
      // encrypted, and stored in private S3. The response contains a one-time
      // upload token bound to this organization and the generated storage key.
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to upload file");
      }

      const upload = await uploadRes.json();
      const { uploadToken } = upload;

      // Step 2: Register document metadata. The server only accepts metadata
      // backed by a valid, unused upload token for this organization.
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          category: form.category,
          tags,
          notes: form.notes.trim() || undefined,
          retentionDate: form.retentionDate || undefined,
          expiresAt: form.expirationDate || undefined,
          uploadToken,
        }),
      });

      if (!docRes.ok) {
        const errBody = await docRes.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to create document record");
      }

      toast.success("Document uploaded successfully");
      reset();
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a HIPAA-compliant document to the vault. Accepted formats: PDF,
            images, text files, Word, Excel, PowerPoint (max 50MB).
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="-mx-4 px-4 flex-1 min-h-0 overflow-y-auto">
          {step === "select" && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
              )}
            >
              <RiUploadCloud2Line className="size-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">
                  Drop a file here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, images, Word, Excel, PowerPoint &mdash; up to 50MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </div>
          )}

          {step === "form" && file && (
            <div className="flex flex-col gap-5">
              {/* Selected file indicator */}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <RiFileTextLine className="size-6 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("select")}
                >
                  Change
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Document title"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Brief description of the document"
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value as DocumentCategory)
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={form.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    placeholder="hipaa, consent, patient"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Internal notes about this document"
                    rows={2}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="retentionDate">Retention Date</Label>
                    <Input
                      id="retentionDate"
                      type="date"
                      value={form.retentionDate}
                      onChange={(e) =>
                        handleInputChange("retentionDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expirationDate">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={form.expirationDate}
                      onChange={(e) =>
                        handleInputChange("expirationDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          {step === "form" && (
            <Button onClick={handleSubmit} disabled={uploading || !form.title.trim()}>
              {uploading && <Spinner className="mr-2" />}
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
