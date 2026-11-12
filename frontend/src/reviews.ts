import type { NewReview, Review } from './types';

export const MIN_RATING = 1;
export const MAX_RATING = 5;
/** Same limit as Review.MAX_TEXT_LENGTH on the backend. */
export const MAX_REVIEW_LENGTH = 1000;

/** Mirrors the backend rules (POST /api/reviews answers 400 otherwise); returns an error message or null. */
export function validateReview(review: NewReview): string | null {
  if (!Number.isInteger(review.rating) || review.rating < MIN_RATING || review.rating > MAX_RATING) {
    return `Choose a rating from ${MIN_RATING} to ${MAX_RATING}`;
  }
  const text = review.text.trim();
  if (!text) return 'Write a few words about your pizza';
  if (text.length > MAX_REVIEW_LENGTH) return `Keep it under ${MAX_REVIEW_LENGTH} characters`;
  if (review.orderId !== null && (!Number.isInteger(review.orderId) || review.orderId < 1)) {
    return 'Order number must be a positive whole number';
  }
  return null;
}

/** Parses the optional order number field: empty means no order, anything else must be a whole number. */
export function parseOrderId(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
}

export function sortNewestFirst(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id);
}

let nextLocalId = -1;

/** A review kept only in the browser, used when the backend is unavailable (e.g. on Vercel). */
export function buildLocalReview(review: NewReview, now: Date = new Date()): Review {
  return {
    id: nextLocalId--,
    orderId: review.orderId,
    text: review.text.trim(),
    rating: review.rating,
    createdAt: now.toISOString(),
  };
}
