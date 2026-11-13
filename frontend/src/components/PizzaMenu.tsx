import { useEffect, useState } from 'react';
import type { Category, Pizza } from '../types';
import { fetchCategories, fetchPizzas } from '../api';
import { filterPizzasByCategory, type CategoryFilter } from '../menuFilter';

interface Props {
  onAddToCart: (pizza: Pizza) => void;
}

const pizzaImages: Record<string, string> = {
  'Margherita': 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=80',
  'Pepperoni': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
  'Quattro Formaggi': 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=800&q=80',
  'Diavola': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  'Prosciutto': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
  'Napoletana': 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=800&q=80',
};

const defaultImage = 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&q=80';

function getImageForPizza(name: string): string {
  for (const [key, url] of Object.entries(pizzaImages)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return url;
  }
  return defaultImage;
}

export function PizzaMenu({ onAddToCart }: Props) {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPizzas(), fetchCategories()]).then(([pizzaData, categoryData]) => {
      setPizzas(pizzaData);
      setCategories(categoryData);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  const tabs: { id: CategoryFilter; name: string }[] = [{ id: null, name: 'All' }, ...categories];
  const visiblePizzas = filterPizzasByCategory(pizzas, selectedCategory);

  return (
    <>
      <div className="menu-filters" role="tablist" aria-label="Filter menu by category">
        {tabs.map(tab => (
          <button
            key={tab.id ?? 'all'}
            role="tab"
            aria-selected={selectedCategory === tab.id}
            className={`menu-filter ${selectedCategory === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>
      {visiblePizzas.length === 0 && (
        <p className="menu-empty">No pizzas in this category yet.</p>
      )}
      {visiblePizzas.map((pizza, i) => (
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
