/** Per-file size cap for workspace upload + analyze API (matches backend / Gemini inline budget). */
export const MAX_ANALYZE_FILE_MB = 100

export const MAX_ANALYZE_FILE_BYTES = MAX_ANALYZE_FILE_MB * 1024 * 1024

/** ZIP-only uploads — backend unpacks archives up to this size. */
export const MAX_ZIP_FILE_MB = 500

export const MAX_ZIP_FILE_BYTES = MAX_ZIP_FILE_MB * 1024 * 1024

/**
 * Cloud Run's HTTP body limit is ~32 MB.
 * Files at or above this threshold must go through the GCS signed-URL flow
 * (POST /api/v1/upload-url → PUT GCS → POST /api/v1/analyze-gcs)
 * instead of the direct POST /api/v1/analyze path.
 */
export const LARGE_FILE_THRESHOLD_MB = 30

export const LARGE_FILE_THRESHOLD_BYTES = LARGE_FILE_THRESHOLD_MB * 1024 * 1024

/** Max imaging files (images + DICOM) in one combined analyze request. */
export const MAX_VISION_FILES_PER_REQUEST = 8

/** Max document files (PDF, TXT, ZIP) in one combined analyze request. */
export const MAX_DOCUMENT_FILES_PER_REQUEST = 6

/** Text-only re-analysis (enhance) — character cap for extracted body. */
export const MAX_ANALYZE_TEXT_CHARS = 120_000

export const maxAnalyzeFileLabel = `${MAX_ANALYZE_FILE_MB} MB`

export const maxZipFileLabel = `${MAX_ZIP_FILE_MB} MB`
