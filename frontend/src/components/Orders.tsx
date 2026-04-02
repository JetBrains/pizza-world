import { useEffect, useState } from 'react';
import type { PizzaOrder } from '../types';
import { fetchOrders } from '../api';

export function Orders() {
  const [orders, setOrders] = useState<PizzaOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetchOrders().then(data => {
      setOrders(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading orders...</div>;

  if (orders.length === 0) {
    return <div className="orders-empty">No orders yet</div>;
  }

  return (
    <section className="orders-section">
      <p className="section-label">History</p>
      <h2 className="orders-title">Your Orders</h2>
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <span className="order-id">#{order.id}</span>
            <div className="order-info">
              <h3>{order.customerName}</h3>
              <p className="order-pizzas">
                {order.pizzas.map(p => p.name).join(', ')}
              </p>
            </div>
            <p className="order-meta">
              {new Date(order.createdAt).toLocaleString('ru-RU')}
            </p>
            <span className={`status-badge status-${order.status}`}>
              {order.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
