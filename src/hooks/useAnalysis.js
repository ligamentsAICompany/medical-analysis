'use client';

import { useCallback, useState, useEffect } from 'react';
import { extractTextFromPdf } from '../lib/pdfExtract';
import { analyzeDocument } from '../lib/heuristics';
import { parseLabValues } from '../lib/labParser';
import {
  isAnalyzeUploadFile,
  isDocxFile,
  isGeminiVisionUpload,
  isTextBundleFile,
  isZipFile,
  validateAnalyzeFileSelection,
} from '../lib/medicalFileTypes';
import { analyzeFilesWithBackend, analyzeTextWithBackend } from '../lib/analyzeClient';

function mergedLabValues (analysisResult, text) {
  if (analysisResult?.labValues?.length > 0) return analysisResult.labValues;
  return parseLabValues(text || '');
}

async function optionalExtractedText (file) {
  if (file.type === 'application/pdf') {
    try {
      return await extractTextFromPdf(file);
    } catch {
      return '';
    }
  }
  if (file.type.startsWith('text/')) {
    try {
      return await file.text();
    } catch {
      return '';
    }
  }
  if (isDocxFile(file)) {
    return `[DOCX document: ${file.name}]`;
  }
  if (isZipFile(file)) {
    return `[ZIP archive: ${file.name}]`;
  }
  if (isGeminiVisionUpload(file)) {
    return file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  }
  return file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

export function useAnalysis ({ updateDocument, addToast, persistReport }) {
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
        const { analysis: nextAnalysis } = await analyzeTextWithBackend({
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
    [updateDocument, addToast, persistReport]
  );

  const analyzeFileBundle = useCallback(
    async (id, files) => {
      if (!files?.length || files.length < 2) return;
      const selection = validateAnalyzeFileSelection(files);
      if (!selection.ok) {
        updateDocument(id, { status: 'error' });
        addToast(selection.error, 'error');
        return;
      }
      if (!files.every((f) => isAnalyzeUploadFile(f))) {
        updateDocument(id, { status: 'error' });
        addToast('Combined upload contains unsupported file types', 'error');
        return;
      }
      updateDocument(id, { status: 'analysing' });
      setAiLoadProgress({ file: 'Analyze', total: 1, loaded: 0 });
      try {
        const textBlocks = await Promise.all(files.map((f) => optionalExtractedText(f)));
        const textContent = textBlocks.filter(Boolean).join(' · ');
        const { analysis: nextAnalysis, gcsPath } = await analyzeFilesWithBackend(
          files,
          (phase, pct) => {
            if (phase === 'uploading') {
              setAiLoadProgress({
                file: files[0]?.name || 'archive',
                total: 100,
                loaded: pct,
                phase: 'uploading',
              });
            } else {
              setAiLoadProgress({ file: 'Analyze', total: 1, loaded: 0, phase: 'analyzing' });
            }
          }
        );
        const visionCount = files.filter((f) => isGeminiVisionUpload(f)).length;
        updateDocument(id, {
          status: 'ready',
          textContent: textContent || null,
          sourceGcsPath: gcsPath || null,
          analysis: {
            ...nextAnalysis,
            labValues: nextAnalysis.labValues?.length ? nextAnalysis.labValues : [],
            ...(visionCount > 1 ? { multiImageCount: visionCount } : {}),
          },
        });
        if (persistReport) {
          persistReport(id).then((reportId) => {
            if (reportId) addToast('Report saved', 'success', 3000);
          });
        }
      } catch (err) {
        console.error('Combined file analysis failed', err);
        updateDocument(id, { status: 'error' });
        addToast(err?.message || 'Combined analysis failed', 'error');
      } finally {
        setAiLoadProgress(null);
      }
    },
    [updateDocument, addToast, persistReport]
  );

  /** @deprecated Use analyzeFileBundle */
  const analyzeImageBundle = analyzeFileBundle;

  /** @deprecated Use analyzeFileBundle */
  const analyzeMixedMediaBundle = analyzeFileBundle;

  const analyzeFile = useCallback(
    async (id, file) => {
      updateDocument(id, { status: 'analysing' });

      if (!isAnalyzeUploadFile(file)) {
        updateDocument(id, { status: 'error' });
        addToast(`${file.name}: unsupported file type`, 'error');
        return;
      }

      let text = '';
      try {
        text = await optionalExtractedText(file);
      } catch (err) {
        console.error('Text extraction failed', err);
        updateDocument(id, { status: 'error' });
        addToast(`Could not read ${file.name}`, 'error');
        return;
      }

      setAiLoadProgress({ file: 'Analyze', total: 1, loaded: 0 });
      try {
        const { analysis: nextAnalysis, gcsPath } = await analyzeFilesWithBackend(
          [file],
          (phase, pct) => {
            if (phase === 'uploading') {
              setAiLoadProgress({
                file: file.name,
                total: 100,
                loaded: pct,
                phase: 'uploading',
              });
            } else {
              setAiLoadProgress({ file: 'Analyze', total: 1, loaded: 0, phase: 'analyzing' });
            }
          }
        );
        const labValues = mergedLabValues(nextAnalysis, text);
        updateDocument(id, {
          status: 'ready',
          textContent: text || null,
          sourceGcsPath: gcsPath || null,
          analysis: {
            ...nextAnalysis,
            labValues,
          },
        });
        if (persistReport) {
          persistReport(id).then((reportId) => {
            if (reportId) addToast('Report saved', 'success', 3000);
          });
        }
      } catch (err) {
        console.error('Document analysis failed', err);
        if (isTextBundleFile(file) && text) {
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
        } else {
          updateDocument(id, { status: 'error' });
          addToast(err?.message || 'Analysis failed', 'error');
        }
      } finally {
        setAiLoadProgress(null);
      }
    },
    [updateDocument, addToast, persistReport]
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
    analyzeFileBundle,
    analyzeImageBundle,
    analyzeMixedMediaBundle,
    enhanceWithAI,
    aiLoading,
    aiLoadingId,
    aiLoadProgress,
    modelsReady,
    modelsPreloading,
  };
}
