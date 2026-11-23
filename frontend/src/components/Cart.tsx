import { useEffect, useState, type FormEvent } from 'react';
import type { CartItem, CheckoutQuote, PromoDiscount } from '../types';
import { checkout, createOrder, formatPrice, InvalidPromoCodeError, localQuote, validatePromoCode } from '../api';

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

  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoDiscount | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const cartKey = items.map(item => `${item.pizza.id}x${item.quantity}`).join(',');
  const quoteKey = `${cartKey}|${promo?.code ?? ''}`;
  const [quote, setQuote] = useState<{ key: string; quote: CheckoutQuote } | null>(null);

  // Price the cart on the server (/api/checkout); show the local calculation until the quote arrives.
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    checkout(items, promo)
      .then(q => {
        if (!cancelled) setQuote({ key: quoteKey, quote: q });
      })
      .catch(err => {
        if (cancelled) return;
        if (err instanceof InvalidPromoCodeError) {
          setPromo(null);
          setPromoError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [items, promo, quoteKey]);

  const { subtotal, discount, total } = quote?.key === quoteKey ? quote.quote : localQuote(items, promo);

  const handleApplyPromo = async (e: FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim() || applying) return;
    setApplying(true);
    setPromoError(null);
    try {
      setPromo(await validatePromoCode(promoInput));
      setPromoInput('');
    } catch (err) {
      setPromo(null);
      setPromoError(err instanceof InvalidPromoCodeError ? err.message : 'Could not check the promo code, try again');
    } finally {
      setApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setPromo(null);
    setPromoError(null);
  };

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
    setPromo(null); // one code per order
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
                {item.quantity} &times; {formatPrice(item.pizza.price)} $
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
          <form className="promo-form" onSubmit={handleApplyPromo} noValidate>
            <div className="promo-row">
              <input
                type="text"
                placeholder="Promo code"
                aria-label="Promo code"
                aria-invalid={promoError ? true : undefined}
                aria-describedby={promoError ? 'promo-error' : undefined}
                value={promoInput}
                onChange={e => {
                  setPromoInput(e.target.value);
                  setPromoError(null);
                }}
              />
              <button type="submit" className="btn-apply" disabled={applying || !promoInput.trim()}>
                {applying ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {promoError && (
              <p id="promo-error" className="promo-error" role="alert">{promoError}</p>
            )}
          </form>

          <div className="cart-summary">
            {promo && (
              <>
                <div className="cart-line">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)} $</span>
                </div>
                <div className="cart-line cart-discount">
                  <span>
                    Discount {promo.code} (&minus;{promo.discountPercent}%)
                    <button type="button" className="btn-promo-remove" onClick={handleRemovePromo} aria-label="Remove promo code">
                      &times;
                    </button>
                  </span>
                  <span>&minus;{formatPrice(discount)} $</span>
                </div>
              </>
            )}
            <div className="cart-total">
              <span>Total</span>
              <span>{formatPrice(total)} $</span>
            </div>
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
