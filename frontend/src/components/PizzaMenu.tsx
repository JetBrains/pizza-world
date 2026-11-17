import { useEffect, useState } from 'react';
import type { Pizza } from '../types';
import { fetchPizzas } from '../api';

interface Props {
  onAddToCart: (pizza: Pizza) => void;
}

const pizzaImages: Record<string, string> = {
  'Margherita': '/images/pizzas/margherita.jpg',
  'Pepperoni': '/images/pizzas/pepperoni.jpg',
  'Quattro Formaggi': '/images/pizzas/quattro-formaggi.jpg',
  'Diavola': '/images/pizzas/diavola.jpg',
  'Prosciutto': '/images/pizzas/prosciutto.jpg',
  'Napoletana': '/images/pizzas/napoletana.jpg',
};

const defaultImage = '/images/pizzas/default.jpg';

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
