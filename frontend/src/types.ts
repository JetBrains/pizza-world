export interface Pizza {
  id: number;
  name: string;
  description: string;
  price: number;
  size: string;
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

export interface Review {
  id: number;
  orderId: number | null;
  text: string;
  rating: number;
  createdAt: string;
}

export interface NewReview {
  orderId: number | null;
  text: string;
  rating: number;
}
