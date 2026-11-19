/**
 * Telemetry Utilities
 * Computes word counts, token approximations, and latency calculations.
 */

/**
 * Accurately calculates word count from a text string.
 * Filters out empty spaces, punctuation-only tokens, etc.
 * @param {string} text
 * @returns {number}
 */
export function calculateWordCount(text) {
  if (!text || typeof text !== 'string') return 0;
  // Match contiguous non-whitespace sequences
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

/**
 * Calculates latency in milliseconds from a starting timestamp.
 * @param {number} startTime - performance.now() or Date.now()
 * @returns {number}
 */
export function calculateLatencyMs(startTime) {
  return Math.max(0, Math.round(Date.now() - startTime));
}

