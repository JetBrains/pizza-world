export const MAX_RATING = 5;

/** One entry per star: true when filled. Values are clamped to 0–5 and rounded. */
export function starStates(rating: number): boolean[] {
  const filled = Math.min(MAX_RATING, Math.max(0, Math.round(rating)));
  return Array.from({ length: MAX_RATING }, (_, i) => i < filled);
}
