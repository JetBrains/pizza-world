import { useEffect, useState } from 'react';
import type { Pizza } from '../types';
import { fetchPizzas } from '../api';

interface Props {
  onAddToCart: (pizza: Pizza) => void;
}

const pizzaImages: Record<string, string> = {
  'Margherita': 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=80',
  'Pepperoni': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
  'Quattro Formaggi': 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=800&q=80',
  'Diavola': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  'Prosciutto': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
};

const defaultImage = 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=800&q=80';

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
    <div className="pizza-grid">
      {pizzas.map(pizza => (
        <div key={pizza.id} className="pizza-card" onClick={() => onAddToCart(pizza)}>
          <img
            src={getImageForPizza(pizza.name)}
            alt={pizza.name}
            className="pizza-card-image"
            loading="lazy"
          />
          <div className="pizza-card-overlay" />
          <div className="pizza-card-content">
            <h3 className="pizza-card-name">{pizza.name}</h3>
            <p className="pizza-card-desc">{pizza.description}</p>
            <div className="pizza-card-meta">
              <span className="pizza-card-price">{pizza.price} &#8381;</span>
              <span className="pizza-card-size">{pizza.size}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
