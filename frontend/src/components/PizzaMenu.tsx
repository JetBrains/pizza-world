import { useEffect, useState } from 'react';
import type { Pizza } from '../types';
import { fetchPizzas } from '../api';

interface Props {
  onAddToCart: (pizza: Pizza) => void;
}

const pizzaImages: Record<string, string> = {
  'Margherita': '/images/pizzas/margherita.svg',
  'Pepperoni': '/images/pizzas/pepperoni.svg',
  'Quattro Formaggi': '/images/pizzas/quattro-formaggi.svg',
  'Diavola': '/images/pizzas/diavola.svg',
  'Prosciutto': '/images/pizzas/prosciutto.svg',
  'Napoletana': '/images/pizzas/napoletana.svg',
};

const defaultImage = '/images/pizzas/classic.svg';

function getImageForPizza(name: string): string {
  for (const [key, url] of Object.entries(pizzaImages)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return url;
  }
  return defaultImage;
}

export function PizzaMenu({ onAddToCart }: Props) {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPizzas().then(data => {
      setPizzas(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <>
      {pizzas.map((pizza, i) => (
        <div
          key={pizza.id}
          className={`gallery-item ${i % 2 === 1 ? 'reverse' : ''}`}
          onClick={() => onAddToCart(pizza)}
        >
          <div className="gallery-img">
            <img
              src={getImageForPizza(pizza.name)}
              alt={pizza.name}
              loading="lazy"
            />
          </div>
          <div className="gallery-info">
            <h3 className="gallery-name">{pizza.name}</h3>
            <p className="gallery-desc">{pizza.description}</p>
            <div className="gallery-meta">
              <span className="gallery-price">${pizza.price}</span>
              <span className="gallery-size">{pizza.size}</span>
            </div>
            <button
              className="gallery-add"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(pizza);
              }}
            >
              Add to cart
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
