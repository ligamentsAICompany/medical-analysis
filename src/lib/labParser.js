// Extracts structured lab values from blood report text
// Returns array of { test, value, unit, refRange, flag }

const LAB_PATTERNS = [
  // "Test Name    18.4    g/dL    13.5 – 17.5    HIGH"
  /^(.+?)\s{2,}([\d.]+)\s+([\w/^³⁶μ%°]+)\s+([\d.]+ [–-] [\d.]+)\s+(HIGH|LOW)?/,
  // "Test Name: value unit (Normal: low - high)"
  /^(.+?)[:]\s*([\d.]+)\s*([\w/^³μ%°]*)\s*(?:\(Normal[:\s]+([\d.]+ ?[–-] ?[\d.]+)\))?/i,
  // "Test Name    value    unit    low – high"  (no flag column)
  /^(.+?)\s{2,}([\d.]+)\s+([\w/^³μ%°]+)\s+([\d.]+ ?[–-] ?[\d.]+)/,
];

function parseFlag(value, refRange) {
  if (!refRange) return '';
  const numVal = parseFloat(value);
  if (isNaN(numVal)) return '';
  const match = refRange.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  if (!match) {
    // Handle "< X" or "> X"
    const lt = refRange.match(/< ?([\d.]+)/);
    const gt = refRange.match(/> ?([\d.]+)/);
    if (lt && numVal > parseFloat(lt[1])) return 'HIGH';
    if (gt && numVal < parseFloat(gt[1])) return 'LOW';
    return '';
  }
  const low = parseFloat(match[1]);
  const high = parseFloat(match[2]);
  if (numVal < low) return 'LOW';
  if (numVal > high) return 'HIGH';
  return 'NORMAL';
}

export function parseLabValues(text) {
  const results = [];
  const seen = new Set();

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Skip header / section lines
    if (/^(TEST|RESULT|UNIT|REFERENCE|FLAG|SECTION|PANEL|PROFILE|COUNT|STUDY)/i.test(line)) continue;
    if (line.length < 5) continue;

    for (const pattern of LAB_PATTERNS) {
      const m = line.match(pattern);
      if (!m) continue;

      const test = m[1].trim().replace(/\s+/g, ' ');
      const value = m[2];
      const unit = m[3] || '';
      const refRange = m[4] || '';
      const flagRaw = m[5] || '';

      if (test.length < 2 || test.length > 80) continue;
      if (!value || isNaN(parseFloat(value))) continue;

      const key = test.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const flag = flagRaw || parseFlag(value, refRange);

      results.push({ test, value, unit, refRange, flag });
      break;
    }
  }

  return results;
}

export function getAbnormalValues(labValues) {
  return labValues.filter(v => v.flag === 'HIGH' || v.flag === 'LOW');
}
