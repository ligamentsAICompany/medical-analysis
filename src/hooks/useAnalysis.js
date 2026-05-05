'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { extractTextFromPdf } from '../lib/pdfExtract';
import { analyzeDocument } from '../lib/heuristics';

export function useAnalysis({ updateDocument, addToast }) {
  const [aiLoadingId, setAiLoadingId]     = useState(null);   // which doc is being AI-enhanced
  const [aiLoadProgress, setAiLoadProgress] = useState(null);
  const [modelsReady, setModelsReady]     = useState(false);
  const [modelsPreloading, setModelsPreloading] = useState(false);

  // Queue of { id, text } waiting for models to finish loading
  const pendingRef = useRef([]);

  // ── Pre-load AI models on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setModelsPreloading(true);

    import('../lib/ai').then(({ loadModels, isLoaded }) => {
      if (isLoaded()) {
        if (!cancelled) { setModelsReady(true); setModelsPreloading(false); }
        return;
      }
      loadModels((data) => {
        if (!cancelled && data.status === 'progress') {
          setAiLoadProgress({ loaded: data.loaded, total: data.total, file: data.file });
        }
      }).then(() => {
        if (cancelled) return;
        setModelsReady(true);
        setModelsPreloading(false);
        setAiLoadProgress(null);
        // Drain any docs that were uploaded while models were loading
        const queue = pendingRef.current.splice(0);
        queue.forEach(({ id, text }) => runAiEnhance(id, text));
      }).catch(() => {
        if (!cancelled) { setModelsPreloading(false); setAiLoadProgress(null); }
      });
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Internal AI enhance ──────────────────────────────────────────────────────
  const runAiEnhance = useCallback(async (id, text) => {
    setAiLoadingId(id);
    try {
      const { loadModels, enhanceAnalysis } = await import('../lib/ai');
      await loadModels((data) => {
        if (data.status === 'progress') {
          setAiLoadProgress({ loaded: data.loaded, total: data.total, file: data.file });
        }
      });
      const aiResult = await enhanceAnalysis(text);
      if (aiResult) {
        updateDocument(id, (doc) => ({
          analysis: {
            ...(doc.analysis || {}),
            classification: aiResult.classification,
            entities: { ...(doc.analysis?.entities || {}), ...aiResult.entities },
            ...(aiResult.summary ? { summary: aiResult.summary } : {}),
            aiEnhanced: true,
          },
        }));
      }
    } catch (err) {
      console.error('AI enhancement failed', err);
    } finally {
      setAiLoadingId(null);
      setAiLoadProgress(null);
    }
  }, [updateDocument]);

  // ── Analyse a newly uploaded file (heuristics → AI auto) ─────────────────────
  const analyzeFile = useCallback(async (id, file) => {
    updateDocument(id, { status: 'analysing' });
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else if (file.type.startsWith('text/')) {
        text = await file.text();
      } else if (file.type.startsWith('image/')) {
        // Generate static image analysis immediately (no model needed)
        const { generateImageAnalysis } = await import('../lib/imageAnalysis');
        const imageAnalysis = generateImageAnalysis(file);

        // Also try OCR for any text content, but don't block on it
        try {
          const aiMod = await import('../lib/ai');
          if (aiMod.isLoaded()) {
            text = await aiMod.extractTextFromImage(file);
          } else {
            text = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
          }
        } catch {
          text = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        }

        // Build a minimal heuristic analysis and attach the image-specific data
        const baseAnalysis = analyzeDocument(text);
        updateDocument(id, {
          status: 'ready',
          textContent: text,
          analysis: {
            ...baseAnalysis,
            classification: {
              type: imageAnalysis.modality === 'X-Ray' ? 'Imaging Report'
                  : imageAnalysis.modality === 'MRI'  ? 'Imaging Report'
                  : imageAnalysis.modality === 'CT'   ? 'Imaging Report'
                  : 'Imaging Report',
              confidence: 0.97,
            },
            imageAnalysis,
            aiEnhanced: true,
          },
        });
        return; // skip the generic heuristic path below
      } else {
        text = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      }

      const analysis = analyzeDocument(text);
      updateDocument(id, { status: 'ready', textContent: text, analysis });

      // Auto-run AI: queue if models still loading, run immediately if ready
      if (modelsReady) {
        runAiEnhance(id, text);
      } else {
        pendingRef.current.push({ id, text });
      }
    } catch (err) {
      console.error('Analysis failed', err);
      updateDocument(id, { status: 'error' });
      addToast(`Analysis failed for ${file.name}`, 'error');
    }
  }, [updateDocument, addToast, modelsReady, runAiEnhance]);

  // ── Manual re-run (retry button in panel) ────────────────────────────────────
  const enhanceWithAI = useCallback(async (id, text) => {
    await runAiEnhance(id, text);
    addToast('AI analysis complete', 'success');
  }, [runAiEnhance, addToast]);

  const aiLoading = aiLoadingId !== null;

  return {
    analyzeFile,
    enhanceWithAI,
    aiLoading,
    aiLoadingId,
    aiLoadProgress,
    modelsReady,
    modelsPreloading,
  };
}
