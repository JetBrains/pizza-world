import { useState, useEffect, useCallback } from 'react';
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
];

function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tab, setTab] = useState<Tab>('menu');
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroIndex, setHeroIndex] = useState(Math.floor(Math.random() * heroImages.length));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

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
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="logo">
          Pizza <span>World</span>
        </div>
        <nav className="nav">
          <button
            className={`nav-btn ${tab === 'menu' ? 'active' : ''}`}
            onClick={() => setTab('menu')}
          >
            Menu
          </button>
          <button
            className={`nav-btn ${tab === 'orders' ? 'active' : ''}`}
            onClick={() => setTab('orders')}
          >
            Orders
          </button>
          <button className="cart-toggle" onClick={() => setCartOpen(true)}>
            Cart
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        </nav>
      </header>

      <main className="main">
        {tab === 'menu' ? (
          <>
            <section className="hero">
              <div className="hero-image-container">
                {heroImages.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt="Neapolitan pizza"
                    className={`hero-image ${i === heroIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
              <div className="hero-overlay" />
              <div className="hero-content">
                <p className="hero-subtitle">Authentic Neapolitan</p>
                <h1 className="hero-title">
                  The Art of<br /><em>Pizza</em>
                </h1>
              </div>
              <span className="hero-scroll">scroll</span>
            </section>

            <section className="menu-section">
              <div className="menu-header">
                <div>
                  <p className="section-label">Our Selection</p>
                  <h2 className="menu-title">La Carta</h2>
                </div>
              </div>
              <PizzaMenu onAddToCart={addToCart} />
            </section>
          </>
        ) : (
          <Orders />
        )}
      </main>

      <footer className="footer">
        <span className="footer-text">Pizza World</span>
        <span className="footer-text">Napoli Tradition</span>
      </footer>

      {/* Cart slide-out panel */}
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
