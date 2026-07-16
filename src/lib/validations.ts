const KB = 1024;
const MB = 1024 * KB;
const MAX_FILE_SIZE = 50 * MB;

const ALLOWED_CONTENT_TYPES: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];

export interface ValidationResult {
  success: boolean;
  error?: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateDocumentUpload(body: Record<string, unknown>): ValidationResult {
  const { fileName, contentType, fileSize } = body;

  if (!isNonEmptyString(fileName)) {
    return { success: false, error: "fileName is required and must be a non-empty string" };
  }

  if (fileName.length > 255) {
    return { success: false, error: "fileName must not exceed 255 characters" };
  }

  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return { success: false, error: "fileName contains invalid path characters" };
  }

  if (!isNonEmptyString(contentType)) {
    return { success: false, error: "contentType is required and must be a non-empty string" };
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return { success: false, error: `contentType '${contentType}' is not allowed` };
  }

  if (fileSize !== undefined && fileSize !== null) {
    const size = Number(fileSize);
    if (!Number.isFinite(size) || size < 0) {
      return { success: false, error: "fileSize must be a non-negative number" };
    }
    if (size > MAX_FILE_SIZE) {
      return { success: false, error: "fileSize exceeds maximum allowed size of 50MB" };
    }
  }

  return { success: true };
}

export function validateDocumentCreate(body: Record<string, unknown>): ValidationResult {
  const { title, category, tags, description, notes, retentionDate, expiresAt } = body;

  if (!isNonEmptyString(title)) {
    return { success: false, error: "title is required and must be a non-empty string" };
  }

  if (title.length > 500) {
    return { success: false, error: "title must not exceed 500 characters" };
  }

  if (category !== undefined && category !== null && !isNonEmptyString(category)) {
    return { success: false, error: "category must be a non-empty string if provided" };
  }

  if (tags !== undefined && tags !== null) {
    if (!Array.isArray(tags)) {
      return { success: false, error: "tags must be an array of strings" };
    }
    if (!tags.every((t): t is string => typeof t === "string")) {
      return { success: false, error: "all tags must be strings" };
    }
    if (tags.length > 20) {
      return { success: false, error: "tags must not exceed 20 entries" };
    }
    for (const tag of tags) {
      if (tag.length > 50) {
        return { success: false, error: "each tag must not exceed 50 characters" };
      }
    }
  }

  if (description !== undefined && description !== null && typeof description === "string" && description.length > 2000) {
    return { success: false, error: "description must not exceed 2000 characters" };
  }

  if (notes !== undefined && notes !== null && typeof notes === "string" && notes.length > 5000) {
    return { success: false, error: "notes must not exceed 5000 characters" };
  }

  if (retentionDate !== undefined && retentionDate !== null) {
    const d = new Date(retentionDate as string);
    if (isNaN(d.getTime())) {
      return { success: false, error: "retentionDate must be a valid date string" };
    }
  }

  if (expiresAt !== undefined && expiresAt !== null) {
    const d = new Date(expiresAt as string);
    if (isNaN(d.getTime())) {
      return { success: false, error: "expiresAt must be a valid date string" };
    }
  }

  return { success: true };
}

export function validateDocumentUpdate(body: Record<string, unknown>): ValidationResult {
  if (Object.keys(body).length === 0) {
    return { success: false, error: "at least one field must be provided for update" };
  }

  const allowedFields = ["title", "description", "category", "tags", "notes", "retentionDate", "expiresAt", "isArchived", "isOnLegalHold"];

  for (const key of Object.keys(body)) {
    if (!allowedFields.includes(key)) {
      return { success: false, error: `unknown field: ${key}` };
    }
  }

  if (body.title !== undefined && !isNonEmptyString(body.title)) {
    return { success: false, error: "title must be a non-empty string if provided" };
  }

  if (body.tags !== undefined && body.tags !== null) {
    if (!Array.isArray(body.tags)) {
      return { success: false, error: "tags must be an array of strings" };
    }
    if (!body.tags.every((t: unknown): t is string => typeof t === "string")) {
      return { success: false, error: "all tags must be strings" };
    }
  }

  if (body.isArchived !== undefined && body.isArchived !== null && typeof body.isArchived !== "boolean") {
    return { success: false, error: "isArchived must be a boolean" };
  }

  if (body.isOnLegalHold !== undefined && body.isOnLegalHold !== null && typeof body.isOnLegalHold !== "boolean") {
    return { success: false, error: "isOnLegalHold must be a boolean" };
  }

  return { success: true };
}

export function validateDocumentSearch(params: Record<string, string | string[] | undefined>): ValidationResult {
  const { q, category, page, pageSize, sortBy, sortOrder, dateFrom, dateTo } = params;

  if (q !== undefined && typeof q === "string" && q.length > 200) {
    return { success: false, error: "search query must not exceed 200 characters" };
  }

  const allowedCategories = ["clinical", "administrative", "legal", "financial", "other"];
  if (category !== undefined && typeof category === "string" && !allowedCategories.includes(category)) {
    return { success: false, error: `category must be one of: ${allowedCategories.join(", ")}` };
  }

  if (page !== undefined) {
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1) {
      return { success: false, error: "page must be a positive integer" };
    }
  }

  if (pageSize !== undefined) {
    const ps = Number(pageSize);
    if (!Number.isInteger(ps) || ps < 1 || ps > 100) {
      return { success: false, error: "pageSize must be an integer between 1 and 100" };
    }
  }

  const allowedSortBy = ["title", "createdAt", "updatedAt", "fileSize", "category"];
  if (sortBy !== undefined && typeof sortBy === "string" && !allowedSortBy.includes(sortBy)) {
    return { success: false, error: `sortBy must be one of: ${allowedSortBy.join(", ")}` };
  }

  if (sortOrder !== undefined && typeof sortOrder === "string" && !["asc", "desc"].includes(sortOrder)) {
    return { success: false, error: "sortOrder must be 'asc' or 'desc'" };
  }

  if (dateFrom !== undefined && typeof dateFrom === "string") {
    const d = new Date(dateFrom);
    if (isNaN(d.getTime())) {
      return { success: false, error: "dateFrom must be a valid date string" };
    }
  }

  if (dateTo !== undefined && typeof dateTo === "string") {
    const d = new Date(dateTo);
    if (isNaN(d.getTime())) {
      return { success: false, error: "dateTo must be a valid date string" };
    }
  }

  return { success: true };
}
