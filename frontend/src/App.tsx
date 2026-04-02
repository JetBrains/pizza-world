import { useState, useMemo, useCallback } from 'react';
import { PizzaMenu } from './components/PizzaMenu';
import { Cart } from './components/Cart';
import { Orders } from './components/Orders';
import type { CartItem } from './types';
import './App.css';

type Tab = 'menu' | 'orders';

const heroImages = [
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1920&q=80',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=80',
  'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=1920&q=80',
  'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=1920&q=80',
];

function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tab, setTab] = useState<Tab>('menu');
  const [cartOpen, setCartOpen] = useState(false);

  const heroSrc = useMemo(
    () => heroImages[Math.floor(Math.random() * heroImages.length)],
    []
  );

  const addToCart = useCallback((pizza: CartItem['pizza']) => {
    setCart(prev => {
      const existing = prev.find(item => item.pizza.id === pizza.id);
      if (existing) {
        return prev.map(item =>
          item.pizza.id === pizza.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { pizza, quantity: 1 }];
    });
  }, []);

  const removeFromCart = (pizzaId: number) => {
    setCart(prev => prev.filter(item => item.pizza.id !== pizzaId));
  };

  const clearCart = () => {
    setCart([]);
    setCartOpen(false);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <span className="nav-logo" onClick={() => setTab('menu')}>
            Pizza World
          </span>
          <div className="nav-links">
            <button
              className={`nav-link ${tab === 'menu' ? 'active' : ''}`}
              onClick={() => setTab('menu')}
            >
              menu
            </button>
            <button
              className={`nav-link ${tab === 'orders' ? 'active' : ''}`}
              onClick={() => setTab('orders')}
            >
              orders
            </button>
            <button className="nav-link" onClick={() => setCartOpen(true)}>
              cart{totalItems > 0 && <span className="badge">{totalItems}</span>}
            </button>
          </div>
        </div>
      </nav>

      <div className="page-wrap">
        {tab === 'menu' ? (
          <>
            <section className="hero">
              <img src={heroSrc} alt="Neapolitan pizza" />
            </section>

            <section className="intro">
              <p>
                We craft <em>authentic Neapolitan pizza</em> using traditional
                recipes, San Marzano tomatoes, and fresh mozzarella — baked in a
                wood-fired oven at 485°C for exactly 90 seconds.
              </p>
            </section>

            <section className="gallery">
              <PizzaMenu onAddToCart={addToCart} />
            </section>
          </>
        ) : (
          <Orders />
        )}

        <footer className="footer">
          <div className="footer-col">
            <span className="footer-logo">Pizza World</span>
          </div>
          <div className="footer-col">
            <span className="footer-label">Contact</span>
            <span className="footer-text">hello@pizzaworld.com</span>
          </div>
          <div className="footer-col">
            <span className="footer-label">Location</span>
            <span className="footer-text">Naples, Italy</span>
          </div>
        </footer>
      </div>

      <div
        className={`cart-overlay ${cartOpen ? 'open' : ''}`}
        onClick={() => setCartOpen(false)}
      />
      <Cart
        items={cart}
        onRemove={removeFromCart}
        onOrderPlaced={clearCart}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}

export default App;
