'use client';

import { useCallback, useState, useEffect } from 'react';
import { extractTextFromPdf } from '../lib/pdfExtract';
import { analyzeDocument } from '../lib/heuristics';
import { parseLabValues } from '../lib/labParser';
import {
  effectiveVisionMimeType,
  isGeminiVisionUpload,
  partitionClinicalBundle,
} from '../lib/medicalFileTypes';
import { analyzeWithBackend } from '../lib/analyzeClient';

const MAX_ANALYZE_TEXT_CHARS = 120_000;

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

function mergedLabValues (analysisResult, text) {
  if (analysisResult?.labValues?.length > 0) return analysisResult.labValues;
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

  const runStructuredTextAnalysis = useCallback(
    async (id, text, fileName) => {
      setAiLoadingId(id);
      setAiLoadProgress({ file: 'Analyze', total: 1, loaded: 0 });
      try {
        const { analysis: nextAnalysis } = await analyzeWithBackend({
          mode: 'text',
          text,
          filename: fileName || '',
        });
        const labValues = mergedLabValues(nextAnalysis, text);
        updateDocument(id, (doc) => ({
          analysis: {
            ...nextAnalysis,
            labValues,
          },
        }));
      } catch (err) {
        console.error('Analyze API failed', err);
        addToast(err?.message || 'Analysis failed', 'error');
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
      setAiLoadProgress({ file: 'Analyze', total: 1, loaded: 0 })
      try {
        const images = await Promise.all(
          visionFiles.map(async (file) => ({
            mimeType: effectiveVisionMimeType(file),
            imageBase64: await fileToBase64(file),
            filename: file.name,
          }))
        )
        const { analysis: nextAnalysis } = await analyzeWithBackend({
          mode: 'multiImage',
          images,
        })
        const ocrHint = visionFiles.map((f) => f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')).join(' · ')
        updateDocument(id, {
          status: 'ready',
          textContent: ocrHint,
          analysis: {
            ...nextAnalysis,
            labValues: nextAnalysis.labValues?.length ? nextAnalysis.labValues : [],
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
      setAiLoadProgress({ file: 'Analyze', total: 1, loaded: 0 })
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
        if (combinedText.length > MAX_ANALYZE_TEXT_CHARS) {
          combinedText = combinedText.slice(0, MAX_ANALYZE_TEXT_CHARS)
        }
        const images = await Promise.all(
          visionFiles.map(async (file) => ({
            mimeType: effectiveVisionMimeType(file),
            imageBase64: await fileToBase64(file),
            filename: file.name,
          }))
        )
        const textFilename = textFiles.map((f) => f.name).join('; ')
        const { analysis: nextAnalysis } = await analyzeWithBackend({
          mode: 'docAndImages',
          text: combinedText,
          textFilename,
          images,
        })
        updateDocument(id, {
          status: 'ready',
          textContent: combinedText,
          analysis: {
            ...nextAnalysis,
            labValues: nextAnalysis.labValues?.length ? nextAnalysis.labValues : [],
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
        setAiLoadProgress({ file: 'Analyze', total: 1, loaded: 0 });
        try {
          const imageBase64 = await fileToBase64(file);
          const { analysis: nextAnalysis } = await analyzeWithBackend({
            mode: 'image',
            mimeType: effectiveVisionMimeType(file),
            imageBase64,
            filename: file.name,
          });
          console.log('[analyze image] useAnalysis after upload', nextAnalysis)
          const ocrHint = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
          updateDocument(id, {
            status: 'ready',
            textContent: ocrHint,
            analysis: {
              ...nextAnalysis,
              labValues: nextAnalysis.labValues?.length ? nextAnalysis.labValues : [],
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
        setAiLoadProgress({ file: 'Analyze', total: 1, loaded: 0 });
        const { analysis: nextAnalysis } = await analyzeWithBackend({
          mode: 'text',
          text,
          filename: file.name,
        });
        const labValues = mergedLabValues(nextAnalysis, text);
        updateDocument(id, {
          status: 'ready',
          textContent: text,
          analysis: {
            ...nextAnalysis,
            labValues,
          },
        });
      } catch (err) {
        console.error('Document analysis failed', err);
        const fallback = analyzeDocument(text || file.name);
        updateDocument(id, {
          status: 'ready',
          textContent: text || null,
          analysis: {
            ...fallback,
            summary: `${fallback.summary}\n\n(Analysis API unavailable: ${err?.message || 'unknown error'})`,
          },
        });
        addToast(err?.message || 'Used offline heuristics — check NEXT_PUBLIC_ANALYZE_API_BASE_URL', 'warning');
      } finally {
        setAiLoadProgress(null);
      }
    },
    [updateDocument, addToast]
  );

  const enhanceWithAI = useCallback(
    async (id, text, fileName = '') => {
      try {
        await runStructuredTextAnalysis(id, text, fileName);
        addToast('AI analysis complete', 'success');
      } catch {
        /* error toast from runStructuredTextAnalysis */
      }
    },
    [runStructuredTextAnalysis, addToast]
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
