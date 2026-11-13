export interface Pizza {
  id: number;
  name: string;
  description: string;
  price: number;
  size: string;
  prepTimeMinutes: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface PizzaOrder {
  id: number;
  customerName: string;
  pizzas: Pizza[];
  status: OrderStatus;
  createdAt: string;
}

export interface CartItem {
  pizza: Pizza;
  quantity: number;
}

export interface CheckoutQuote {
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  currency: 'USD';
}
