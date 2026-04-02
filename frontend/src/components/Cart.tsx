import { useState } from 'react';
import type { CartItem } from '../types';
import { createOrder } from '../api';

interface Props {
  items: CartItem[];
  onRemove: (pizzaId: number) => void;
  onOrderPlaced: () => void;
  open: boolean;
  onClose: () => void;
}

export function Cart({ items, onRemove, onOrderPlaced, open, onClose }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = items.reduce((sum, item) => sum + item.pizza.price * item.quantity, 0);

  const handleOrder = async () => {
    if (!customerName.trim() || items.length === 0) return;
    setSubmitting(true);
    const pizzaIds = items.flatMap(item =>
      Array.from({ length: item.quantity }, () => item.pizza.id)
    );
    await createOrder(customerName.trim(), pizzaIds);
    setSubmitting(false);
    setSuccess(true);
    setCustomerName('');
    onOrderPlaced();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className={`cart-panel ${open ? 'open' : ''}`}>
      <div className="cart-header">
        <h2 className="cart-title">Cart</h2>
        <button className="cart-close" onClick={onClose}>&times;</button>
      </div>

      <div className="cart-body">
        {items.length === 0 && !success && (
          <p className="cart-empty">Your cart is empty</p>
        )}

        {items.map(item => (
          <div key={item.pizza.id} className="cart-item">
            <div className="cart-item-info">
              <span className="cart-item-name">{item.pizza.name}</span>
              <span className="cart-item-qty">
                {item.quantity} &times; {item.pizza.price} $
              </span>
            </div>
            <button className="btn-remove" onClick={() => onRemove(item.pizza.id)}>&times;</button>
          </div>
        ))}

        {success && (
          <div className="order-success">Order placed successfully</div>
        )}
      </div>

      {items.length > 0 && (
        <div className="cart-footer">
          <div className="cart-total">
            <span>Total</span>
            <span>{total} $</span>
          </div>
          <div className="cart-form">
            <input
              type="text"
              placeholder="Your name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            <button
              className="btn-order"
              onClick={handleOrder}
              disabled={submitting || !customerName.trim()}
            >
              {submitting ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
