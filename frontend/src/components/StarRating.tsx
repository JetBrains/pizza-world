import { MAX_RATING, starStates } from '../rating';

interface Props {
  rating: number | null;
}

export function StarRating({ rating }: Props) {
  if (rating == null) return null;

  return (
    <span className="star-rating" role="img" aria-label={`Rated ${rating} out of ${MAX_RATING}`}>
      {starStates(rating).map((filled, i) => (
        <span key={i} className={filled ? 'star filled' : 'star'} aria-hidden="true">★</span>
      ))}
    </span>
  );
}
