import { useEffect, useState, type FormEvent } from 'react';
import type { Review } from '../types';
import { createReview, fetchReviews, HttpError } from '../api';
import { MAX_RATING, MAX_REVIEW_LENGTH, parseOrderId, sortNewestFirst, validateReview } from '../reviews';

const ratings = Array.from({ length: MAX_RATING }, (_, i) => i + 1);

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of ${MAX_RATING}`}>
      {'★'.repeat(rating)}
      <span className="review-stars-empty">{'★'.repeat(MAX_RATING - rating)}</span>
    </span>
  );
}

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews().then(data => {
      setReviews(sortNewestFirst(data));
      setLoading(false);
    });
  }, []);

  const draft = { rating, text, orderId: parseOrderId(orderId) };
  const canSubmit = !submitting && validateReview(draft) === null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = validateReview(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const saved = await createReview(draft);
      setReviews(prev => [saved, ...prev]);
      setRating(0);
      setText('');
      setOrderId('');
    } catch (err) {
      setError(err instanceof HttpError && err.status === 400
        ? 'We could not save this review. Check the order number and try again.'
        : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews">
      <h2 className="reviews-title">Reviews</h2>

      <form className="review-form" onSubmit={handleSubmit}>
        <div className="review-rating" role="radiogroup" aria-label="Rating">
          {ratings.map(value => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} out of ${MAX_RATING}`}
              className={`review-rating-star ${value <= rating ? 'active' : ''}`}
              onClick={() => setRating(value)}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          placeholder="Tell us about your pizza"
          value={text}
          maxLength={MAX_REVIEW_LENGTH}
          rows={3}
          onChange={e => setText(e.target.value)}
        />
        <div className="review-form-row">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Order number (optional)"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
          />
          <button type="submit" className="btn-order" disabled={!canSubmit}>
            {submitting ? 'Sending...' : 'Leave a review'}
          </button>
        </div>
        {error && <p className="review-error">{error}</p>}
      </form>

      {loading ? (
        <div className="loading">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <p className="reviews-empty">No reviews yet. Be the first.</p>
      ) : (
        <ul className="reviews-list">
          {reviews.map(review => (
            <li key={review.id} className="review-item">
              <div className="review-meta">
                <Stars rating={review.rating} />
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <p className="review-text">{review.text}</p>
              {review.orderId !== null && <span className="review-order">Order #{review.orderId}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
