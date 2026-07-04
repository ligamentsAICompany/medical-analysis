// Optional Transformers.js enhancement — loaded on demand
// Models are cached in the browser after the first download

let pipelines = {};
let loadError = null;
let loadingPromise = null; // singleton to prevent concurrent loads

function onProgress(data, onProgressCb) {
  if (data.status === 'progress' && onProgressCb) {
    onProgressCb(data);
  }
}

export async function loadModels(onProgressCb) {
  if (loadError) throw loadError;
  if (
    pipelines.ner &&
    pipelines.classifier &&
    pipelines.summarizer &&
    Object.prototype.hasOwnProperty.call(pipelines, 'imageToText')
  ) {
    return true;
  }

  // Reuse in-flight promise so concurrent callers share one download
  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        const { pipeline, env } = await import('@xenova/transformers');
        // Skip /models/... on the app origin (avoids 404 noise); all weights load from Hugging Face Hub
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        env.useBrowserCache = true;

        const progressCallback = (data) => onProgress(data, onProgressCb);

        if (!pipelines.ner) {
          pipelines.ner = await pipeline(
            'token-classification',
            'Xenova/bert-base-NER',
            { aggregation_strategy: 'simple', progress_callback: progressCallback }
          );
        }
        if (!pipelines.classifier) {
          pipelines.classifier = await pipeline(
            'zero-shot-classification',
            'Xenova/nli-deberta-v3-small',
            { progress_callback: progressCallback }
          );
        }
        if (!pipelines.summarizer) {
          pipelines.summarizer = await pipeline(
            'summarization',
            'Xenova/distilbart-cnn-6-6',
            { progress_callback: progressCallback }
          );
        }
        if (!Object.prototype.hasOwnProperty.call(pipelines, 'imageToText')) {
          try {
            pipelines.imageToText = await pipeline(
              'image-to-text',
              'Xenova/trocr-small-printed',
              { progress_callback: progressCallback }
            );
          } catch (ocrErr) {
            console.warn('TrOCR model failed to load (image OCR disabled)', ocrErr);
            pipelines.imageToText = null;
          }
        }
        return true;
      } catch (err) {
        loadError = err;
        loadingPromise = null;
        throw err;
      }
    })();
  } else {
    // Re-attach progress callback to already-running load isn't possible,
    // but we can await the existing promise
    await loadingPromise;
  }

  return loadingPromise;
}

const DOC_LABELS = ['Lab Report', 'Prescription', 'Discharge Summary', 'Imaging Report', 'Referral Letter', 'Consent Form', 'Other'];

const INTENT_HYPOTHESES = [
  { label: 'navigate to a page or section in the app', intent: 'navigate' },
  { label: 'search find filter or list medical reports', intent: 'search' },
  { label: 'count how many reports or documents exist', intent: 'count' },
  { label: 'open or view a specific report or latest report', intent: 'open' },
  { label: 'delete or remove a report or user', intent: 'delete' },
  { label: 'create add upload or attach a new document', intent: 'create' },
  { label: 'help or show available commands', intent: 'help' },
];

const MODULE_HYPOTHESES = [
  { label: 'dashboard overview and statistics', module: 'dashboard' },
  { label: 'analysis workspace and file upload', module: 'analysis' },
  { label: 'medical reports documents and studies', module: 'reports' },
  { label: 'user accounts and admin members', module: 'users' },
];

export async function classifyAssistantCommand (text) {
  await loadModels();
  if (!pipelines.classifier) return null;

  const snippet = (text || '').slice(0, 256);
  const intentLabels = INTENT_HYPOTHESES.map((h) => h.label);
  const moduleLabels = MODULE_HYPOTHESES.map((h) => h.label);

  const [intentResult, moduleResult] = await Promise.all([
    pipelines.classifier(snippet, intentLabels),
    pipelines.classifier(snippet, moduleLabels),
  ]);

  const intentIdx = intentResult.labels.indexOf(intentResult.labels[0]);
  const moduleIdx = moduleResult.labels.indexOf(moduleResult.labels[0]);
  const intent = INTENT_HYPOTHESES[intentIdx]?.intent || 'unknown';
  const module = MODULE_HYPOTHESES[moduleIdx]?.module || null;
  const confidence = Math.min(intentResult.scores[0] || 0, moduleResult.scores[0] || 0);

  return { intent, module, confidence };
}

export async function classifyDocumentType (text) {
  await loadModels();
  if (!pipelines.classifier) return null;

  const snippet = (text || '').slice(0, 512);
  const result = await pipelines.classifier(snippet, DOC_LABELS);
  return {
    type: result.labels[0] || 'Other',
    confidence: result.scores[0] || 0,
  };
}

export async function enhanceAnalysis(text) {
  if (!pipelines.ner || !pipelines.classifier) return null;

  const truncated = text.slice(0, 512);
  const [nerResult, classResult] = await Promise.all([
    pipelines.ner(truncated),
    pipelines.classifier(truncated, DOC_LABELS),
  ]);

  let summaryText = null;
  if (pipelines.summarizer && text.length > 200) {
    try {
      const result = await pipelines.summarizer(text.slice(0, 1024), {
        max_length: 120, min_length: 30, do_sample: false,
      });
      summaryText = result[0]?.summary_text || null;
    } catch { /* summarizer optional */ }
  }

  const topClass = classResult.labels[0];
  const topScore = classResult.scores[0];

  const persons = nerResult.filter(e => e.entity_group === 'PER').map(e => e.word);
  const orgs = nerResult.filter(e => e.entity_group === 'ORG').map(e => e.word);
  const locs = nerResult.filter(e => e.entity_group === 'LOC').map(e => e.word);

  return {
    classification: { type: topClass, confidence: Math.round(topScore * 100) / 100 },
    entities: { persons: [...new Set(persons)], organizations: [...new Set(orgs)], locations: [...new Set(locs)] },
    ...(summaryText ? { summary: summaryText } : {}),
    aiEnhanced: true,
  };
}

export function isLoaded() {
  return !!pipelines.ner && !!pipelines.classifier;
}

export function isLoading() {
  return !!loadingPromise && !isLoaded();
}

/** OCR text for image uploads; uses TrOCR when loaded, else filename heuristic */
export async function extractTextFromImage(file) {
  const fallback = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  if (!pipelines.imageToText) {
    return fallback;
  }
  const url = URL.createObjectURL(file);
  try {
    const { RawImage } = await import('@xenova/transformers');
    const image = await RawImage.read(url);
    const out = await pipelines.imageToText(image);
    URL.revokeObjectURL(url);
    const row = Array.isArray(out) ? out[0] : out;
    const text = (row?.generated_text || '').trim();
    return text || fallback;
  } catch (e) {
    URL.revokeObjectURL(url);
    console.warn('extractTextFromImage failed', e);
    return fallback;
  }
}
