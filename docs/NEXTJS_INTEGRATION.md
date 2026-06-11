# Next.js Integration Guide — Medical Analysis API

## Base URL

```
Production: https://medical-analysis-backend-2p3fwh332a-uc.a.run.app
Local:      http://127.0.0.1:8000
```

---

## File Upload Flow

The flow depends on the file size:

```
file.size < 30 MB  →  POST /api/v1/analyze        (1 step)
file.size > 30 MB  →  POST /api/v1/upload-url      (step 1)
                       PUT  <signed_url>            (step 2 — direct to GCS)
                       POST /api/v1/analyze-gcs     (step 3)
```

---

## Implementation

### 1. API utility — `lib/analyzeZip.ts`

```ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://medical-analysis-backend-2p3fwh332a-uc.a.run.app'

export async function analyzeMRI(file: File) {
  if (file.size < 30 * 1024 * 1024) {
    return analyzeSmall(file)
  } else {
    return analyzeLarge(file)
  }
}

// Small file (< 30 MB) — direct upload
async function analyzeSmall(file: File) {
  const formData = new FormData()
  formData.append('files', file)

  const res = await fetch(`${BASE_URL}/api/v1/analyze`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail?.error || 'Analysis failed')
  }

  return res.json()
}

// Large file (> 30 MB) — GCS flow
async function analyzeLarge(file: File, onProgress?: (percent: number) => void) {
  // Step 1: Get signed URL
  const urlRes = await fetch(`${BASE_URL}/api/v1/upload-url`, {
    method: 'POST',
  })
  if (!urlRes.ok) throw new Error('Failed to get upload URL')
  const { upload_url, gcs_path } = await urlRes.json()

  // Step 2: Upload ZIP directly to GCS
  await uploadToGCS(file, upload_url, onProgress)

  // Step 3: Trigger analysis
  const res = await fetch(`${BASE_URL}/api/v1/analyze-gcs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gcs_path }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail?.error || 'Analysis failed')
  }

  return res.json()
}

// Upload with progress tracking
function uploadToGCS(file: File, uploadUrl: string, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`GCS upload failed: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('GCS upload network error'))

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', 'application/zip')
    xhr.send(file)
  })
}
```

---

### 2. Upload Component — `components/MRIUpload.tsx`

```tsx
'use client'

import { useState } from 'react'
import { analyzeMRI } from '@/lib/analyzeZip'

export default function MRIUpload() {
  const [status, setStatus] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setResult(null)
    setProgress(0)

    const isLarge = file.size >= 30 * 1024 * 1024
    setStatus(isLarge ? 'Uploading to GCS...' : 'Uploading...')

    try {
      const data = await analyzeMRI(file, (percent) => {
        setProgress(percent)
        if (percent === 100) setStatus('Analyzing with AI...')
      })
      setStatus('Done')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
      setStatus('')
    }
  }

  return (
    <div>
      <input
        type="file"
        accept=".zip,application/zip"
        onChange={handleFileChange}
      />

      {status && <p>{status}</p>}

      {progress > 0 && progress < 100 && (
        <progress value={progress} max={100} />
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  )
}
```

---

### 3. Environment Variable — `.env.local`

```
NEXT_PUBLIC_API_URL=https://medical-analysis-backend-2p3fwh332a-uc.a.run.app
```

---

## API Reference

### `POST /api/v1/analyze`
Upload small files (< 30 MB).

- **Content-Type:** `multipart/form-data`
- **Body:** `files` — one ZIP file or up to 8 imaging/document files
- **Response:** `AnalysisResponse`

---

### `POST /api/v1/upload-url`
Get a signed GCS URL for large ZIP uploads.

- **Body:** none
- **Response:**
```json
{
  "upload_url": "https://storage.googleapis.com/...",
  "gcs_path": "gs://nandico_dcm/mri-uploads/<uuid>.zip"
}
```
- **Note:** Signed URL expires in **1 hour**

---

### `PUT <upload_url>`
Upload ZIP directly to GCS. This goes to Google Cloud Storage, not your API.

- **Content-Type:** `application/zip`
- **Body:** raw ZIP file bytes
- **Response:** `200 OK` (empty body)

---

### `POST /api/v1/analyze-gcs`
Trigger analysis after GCS upload.

- **Body:**
```json
{
  "gcs_path": "gs://nandico_dcm/mri-uploads/<uuid>.zip"
}
```
- **Response:** `AnalysisResponse`

---

## AnalysisResponse Shape

```ts
interface AnalysisResponse {
  // Refer to backend models.py for full shape
  // Contains structured radiology report from Gemini AI
}
```

---

## Notes

- The signed URL from `/api/v1/upload-url` expires in **1 hour** — complete the upload and analysis within that time
- For the GCS PUT step, **do not send Authorization headers** — the signed URL is self-authenticating
- Both flows return the same `AnalysisResponse` format
- File size check threshold is `30 MB` (safe margin under Cloud Run's 32 MB limit)
