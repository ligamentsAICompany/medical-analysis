'use client';

import { useCallback, useState, useEffect } from 'react';
import { extractTextFromPdf } from '../lib/pdfExtract';
import { analyzeDocument } from '../lib/heuristics';
import { parseLabValues } from '../lib/labParser';
import { analyzeWithGemini } from '../lib/geminiClient';

const MAX_GEMINI_TEXT_CHARS = 120_000;
import {
  effectiveVisionMimeType,
  isGeminiVisionUpload,
  partitionClinicalBundle,
} from '../lib/medicalFileTypes';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result;
      if (typeof s !== 'string') {
        reject(new Error('Could not read file'));
        return;
      }
      const i = s.indexOf(',');
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    reader.onerror = () => reject(reader.error || new Error('Read failed'));
    reader.readAsDataURL(file);
  });
}

function mergedLabValues(geminiAnalysis, text) {
  if (geminiAnalysis.labValues?.length > 0) return geminiAnalysis.labValues;
  return parseLabValues(text || '');
}

export function useAnalysis({ updateDocument, addToast }) {
  const [aiLoadingId, setAiLoadingId] = useState(null);
  const [aiLoadProgress, setAiLoadProgress] = useState(null);
  const [modelsReady, setModelsReady] = useState(true);
  const [modelsPreloading, setModelsPreloading] = useState(false);

  useEffect(() => {
    setModelsPreloading(false);
    setModelsReady(true);
  }, []);

  const runGeminiAnalysis = useCallback(
    async (id, text, fileName) => {
      setAiLoadingId(id);
      setAiLoadProgress({ file: 'Gemini', total: 1, loaded: 0 });
      try {
        const { analysis: geminiAnalysis } = await analyzeWithGemini({
          mode: 'text',
          text,
          filename: fileName || '',
        });
        const labValues = mergedLabValues(geminiAnalysis, text);
        updateDocument(id, (doc) => ({
          analysis: {
            ...geminiAnalysis,
            labValues,
          },
        }));
      } catch (err) {
        console.error('Gemini analysis failed', err);
        addToast(err?.message || 'Gemini analysis failed', 'error');
        throw err;
      } finally {
        setAiLoadingId(null);
        setAiLoadProgress(null);
      }
    },
    [updateDocument, addToast]
  );

  const analyzeImageBundle = useCallback(
    async (id, files) => {
      if (!files?.length || files.length < 2) return
      const visionFiles = files.filter((f) => isGeminiVisionUpload(f))
      if (visionFiles.length < 2) {
        updateDocument(id, { status: 'error' })
        addToast('Combined imaging bundle needs at least two image or DICOM files', 'error')
        return
      }
      updateDocument(id, { status: 'analysing' })
      setAiLoadProgress({ file: 'Gemini', total: 1, loaded: 0 })
      try {
        const images = await Promise.all(
          visionFiles.map(async (file) => ({
            mimeType: effectiveVisionMimeType(file),
            imageBase64: await fileToBase64(file),
            filename: file.name,
          }))
        )
        const { analysis: geminiAnalysis } = await analyzeWithGemini({
          mode: 'multiImage',
          images,
        })
        const ocrHint = visionFiles.map((f) => f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')).join(' · ')
        updateDocument(id, {
          status: 'ready',
          textContent: ocrHint,
          analysis: {
            ...geminiAnalysis,
            labValues: geminiAnalysis.labValues?.length ? geminiAnalysis.labValues : [],
            multiImageCount: visionFiles.length,
          },
        })
      } catch (err) {
        console.error('Multi-image analysis failed', err)
        updateDocument(id, { status: 'error' })
        addToast(err?.message || 'Multi-image analysis failed', 'error')
      } finally {
        setAiLoadProgress(null)
      }
    },
    [updateDocument, addToast]
  )

  const analyzeMixedMediaBundle = useCallback(
    async (id, files) => {
      if (!files?.length || files.length < 2) return
      const { textFiles, visionFiles, isFullPartition } = partitionClinicalBundle(files)
      if (!isFullPartition || textFiles.length < 1 || visionFiles.length < 1) {
        updateDocument(id, { status: 'error' })
        addToast('Combined upload must be only PDF/TXT plus imaging files', 'error')
        return
      }
      updateDocument(id, { status: 'analysing' })
      setAiLoadProgress({ file: 'Gemini', total: 1, loaded: 0 })
      try {
        const textBlocks = await Promise.all(
          textFiles.map(async (tf) => {
            let body = ''
            if (tf.type === 'application/pdf') {
              body = await extractTextFromPdf(tf)
            } else if (tf.type === 'text/plain') {
              body = await tf.text()
            }
            return `\n\n--- ${tf.name} ---\n\n${body}`
          })
        )
        let combinedText = textBlocks.join('')
        if (!combinedText.trim()) {
          combinedText =
            `[No extractable text from: ${textFiles.map((f) => f.name).join(', ')}. ` +
            'Use the attached imaging only; note missing clinical document context in limitations.]'
        }
        if (combinedText.length > MAX_GEMINI_TEXT_CHARS) {
          combinedText = combinedText.slice(0, MAX_GEMINI_TEXT_CHARS)
        }
        const images = await Promise.all(
          visionFiles.map(async (file) => ({
            mimeType: effectiveVisionMimeType(file),
            imageBase64: await fileToBase64(file),
            filename: file.name,
          }))
        )
        const textFilename = textFiles.map((f) => f.name).join('; ')
        const { analysis: geminiAnalysis } = await analyzeWithGemini({
          mode: 'docAndImages',
          text: combinedText,
          textFilename,
          images,
        })
        updateDocument(id, {
          status: 'ready',
          textContent: combinedText,
          analysis: {
            ...geminiAnalysis,
            labValues: geminiAnalysis.labValues?.length ? geminiAnalysis.labValues : [],
            multiImageCount: visionFiles.length,
          },
        })
      } catch (err) {
        console.error('Mixed document + imaging analysis failed', err)
        updateDocument(id, { status: 'error' })
        addToast(err?.message || 'Combined document and imaging analysis failed', 'error')
      } finally {
        setAiLoadProgress(null)
      }
    },
    [updateDocument, addToast]
  )

  const analyzeFile = useCallback(
    async (id, file) => {
      updateDocument(id, { status: 'analysing' });

      let text = '';
      try {
        if (file.type === 'application/pdf') {
          text = await extractTextFromPdf(file);
        } else if (file.type.startsWith('text/')) {
          text = await file.text();
        } else if (!isGeminiVisionUpload(file)) {
          text = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        }
      } catch (err) {
        console.error('Text extraction failed', err);
        updateDocument(id, { status: 'error' });
        addToast(`Could not read ${file.name}`, 'error');
        return;
      }

      if (isGeminiVisionUpload(file)) {
        setAiLoadProgress({ file: 'Gemini', total: 1, loaded: 0 });
        try {
          const imageBase64 = await fileToBase64(file);
          const { analysis: geminiAnalysis } = await analyzeWithGemini({
            mode: 'image',
            mimeType: effectiveVisionMimeType(file),
            imageBase64,
            filename: file.name,
          });
          console.log('[Gemini image] useAnalysis after upload — full analysis object', geminiAnalysis)
          const ocrHint = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
          updateDocument(id, {
            status: 'ready',
            textContent: ocrHint,
            analysis: {
              ...geminiAnalysis,
              labValues: geminiAnalysis.labValues?.length ? geminiAnalysis.labValues : [],
            },
          });
        } catch (err) {
          console.error('Image analysis failed', err);
          updateDocument(id, { status: 'error' });
          addToast(err?.message || 'Image analysis failed', 'error');
        } finally {
          setAiLoadProgress(null);
        }
        return;
      }

      try {
        setAiLoadProgress({ file: 'Gemini', total: 1, loaded: 0 });
        const { analysis: geminiAnalysis } = await analyzeWithGemini({
          mode: 'text',
          text,
          filename: file.name,
        });
        const labValues = mergedLabValues(geminiAnalysis, text);
        updateDocument(id, {
          status: 'ready',
          textContent: text,
          analysis: {
            ...geminiAnalysis,
            labValues,
          },
        });
      } catch (err) {
        console.error('Gemini document analysis failed', err);
        const fallback = analyzeDocument(text || file.name);
        updateDocument(id, {
          status: 'ready',
          textContent: text || null,
          analysis: {
            ...fallback,
            summary: `${fallback.summary}\n\n(Gemini unavailable: ${err?.message || 'unknown error'})`,
          },
        });
        addToast(err?.message || 'Used offline heuristics — check Gemini API key', 'warning');
      } finally {
        setAiLoadProgress(null);
      }
    },
    [updateDocument, addToast]
  );

  const enhanceWithAI = useCallback(
    async (id, text, fileName = '') => {
      try {
        await runGeminiAnalysis(id, text, fileName);
        addToast('AI analysis complete', 'success');
      } catch {
        /* error toast from runGeminiAnalysis */
      }
    },
    [runGeminiAnalysis, addToast]
  );

  const aiLoading = aiLoadingId !== null;

  return {
    analyzeFile,
    analyzeImageBundle,
    analyzeMixedMediaBundle,
    enhanceWithAI,
    aiLoading,
    aiLoadingId,
    aiLoadProgress,
    modelsReady,
    modelsPreloading,
  }
}
