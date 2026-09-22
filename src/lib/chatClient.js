import {
  getChatMessagesGcsApiUrl,
  getChatFeedbackApiUrl,
  getChatMessagesApiUrl,
  getFreshApiAuthToken,
} from '../config/analyzeApi'
import { LARGE_FILE_THRESHOLD_BYTES } from '../config/uploadLimits'
import { getSignedUploadUrl, uploadToGCS } from './analyzeClient'
import { isZipFile } from './medicalFileTypes'

/**
 * @param {Response} res
 * @param {string} rawText
 */
async function parseChatResponse (res, rawText) {
  let raw
  try {
    raw = rawText ? JSON.parse(rawText) : {}
  } catch {
    throw new Error('Chat API returned non-JSON')
  }

  if (!res.ok) {
    const detail = raw?.detail ?? raw?.message ?? raw?.error
    const msg =
      typeof detail === 'string'
        ? detail
        : detail != null && typeof detail === 'object' && detail.error
          ? detail.error
          : detail != null && typeof detail === 'object'
            ? JSON.stringify(detail)
            : `Chat API error (${res.status})`
    throw new Error(msg)
  }

  return raw
}

async function authHeaders () {
  const token = await getFreshApiAuthToken()
  if (!token) {
    throw new Error('Sign in required — no Firebase auth token available')
  }
  return {
    accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

/**
 * Uploads a DICOM ZIP to the chatbot and returns the resulting chat message
 * (including the structured analysis response), running the same DICOM
 * pipeline as the main analyze flow.
 * @param {File} file
 * @param {string} [model] - selectable chat model, e.g. "medgemma-dicom-v1"
 * @param {string} [presentComplaint]
 * @returns {Promise<object>} ChatMessageResponse
 */
export async function uploadChatFile (file, model = 'medgemma-dicom-v1', presentComplaint) {
  if (isZipFile(file) && file.size >= LARGE_FILE_THRESHOLD_BYTES) {
    const { upload_url: uploadUrl, gcs_path: gcsPath } = await getSignedUploadUrl()
    await uploadToGCS(file, uploadUrl)
    let res
    try {
      const headers = {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      }
      res = await fetch(getChatMessagesGcsApiUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          gcs_path: gcsPath,
          model,
          ...(presentComplaint ? { present_complaint: presentComplaint } : {}),
        }),
      })
    } catch (err) {
      console.error('uploadChatFile GCS analysis failed', err)
      throw new Error('Could not reach chat analysis API')
    }
    return parseChatResponse(res, await res.text())
  }

  const form = new FormData()
  form.append('file', file)
  form.append('model', model)
  if (presentComplaint) form.append('present_complaint', presentComplaint)

  let res
  try {
    res = await fetch(getChatMessagesApiUrl(), {
      method: 'POST',
      headers: await authHeaders(),
      body: form,
    })
  } catch (err) {
    console.error('uploadChatFile failed', err)
    throw new Error('Could not reach chat API')
  }

  const rawText = await res.text()
  return parseChatResponse(res, rawText)
}

/**
 * @param {string} messageId
 * @param {{ rating: 'up'|'down', comment?: string, correctedReport?: string }} payload
 * @returns {Promise<object>} ChatFeedbackResponse
 */
export async function submitChatFeedback (messageId, payload) {
  let res
  try {
    res = await fetch(getChatFeedbackApiUrl(messageId), {
      method: 'POST',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('submitChatFeedback failed', err)
    throw new Error('Could not reach chat API')
  }

  const rawText = await res.text()
  return parseChatResponse(res, rawText)
}

/**
 * @returns {Promise<object[]>} the current user's chat messages (or all, for admins)
 */
export async function listChatMessages () {
  let res
  try {
    res = await fetch(getChatMessagesApiUrl(), {
      method: 'GET',
      headers: await authHeaders(),
      cache: 'no-store',
    })
  } catch (err) {
    console.error('listChatMessages failed', err)
    throw new Error('Could not reach chat API')
  }

  const rawText = await res.text()
  const raw = await parseChatResponse(res, rawText)
  return Array.isArray(raw) ? raw : []
}
