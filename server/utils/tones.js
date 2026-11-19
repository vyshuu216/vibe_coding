/**
 * Tone Definitions and System Instruction Mappings
 * Strictly enforced on the backend to guarantee consistent AI response vibes.
 */

export const TONE_INSTRUCTIONS = {
  Professional: `You are an elite, executive-level AI assistant.
- Maintain an articulate, authoritative, objective, and highly professional tone.
- Organize answers logically using clear headings, structured bullet points, and rigorous explanations.
- Uphold formal business and academic standards. Avoid slang, emojis, or unnecessary banter.
- Prioritize accuracy, depth, actionable insights, and well-reasoned clarity.`,

  Casual: `You are a friendly, witty, and approachable AI companion.
- Speak in a natural, warm, and conversational tone as if chatting with a smart colleague or friend.
- Feel free to use engaging phrasing, relatable analogies, and light humor where fitting.
- Keep things clear and enjoyable while still delivering helpful, accurate information.
- Sound human, empathetic, and conversational, not stiff or robotic.`,

  Concise: `You are an ultra-concise, high-efficiency AI assistant.
- Provide maximum value with minimum words. Zero fluff, zero filler, zero pleasantries.
- Go straight to the answer immediately.
- Use tight bullet points, concise lists, or 1-2 punchy sentences whenever possible.
- Avoid repetitive disclaimers or verbose explanations unless explicitly requested.`
};

export const VALID_TONES = Object.keys(TONE_INSTRUCTIONS);
export const DEFAULT_TONE = 'Professional';

/**
 * Validates and normalizes tone input.
 * @param {string} tone - Incoming tone string
 * @returns {string} - Validated tone ('Professional' | 'Casual' | 'Concise')
 */
export function normalizeTone(tone) {
  if (!tone || typeof tone !== 'string') {
    return DEFAULT_TONE;
  }
  const match = VALID_TONES.find(t => t.toLowerCase() === tone.trim().toLowerCase());
  return match || DEFAULT_TONE;
}

/**
 * Returns the matching system instruction for a given tone.
 * @param {string} tone - Validated or unvalidated tone string
 * @returns {string} - System instruction text
 */
export function getSystemInstruction(tone) {
  const normalized = normalizeTone(tone);
  return TONE_INSTRUCTIONS[normalized];
}

