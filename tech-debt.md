# Tech Debt & Feature Tasks

## 1. Pizza Ratings
Add a `rating` field (1–5) to the `Pizza` entity. Create a database migration, expose `GET /api/pizzas/top` endpoint returning pizzas sorted by rating. On the frontend, display star ratings next to each pizza in the gallery.

**Backend:** entity field, repository query, controller endpoint  
**Frontend:** star component in gallery items, mock rating data fallback

## 2. Menu Categories
Add a `Category` entity (`id`, `name`) with a `ManyToOne` relationship from `Pizza` to `Category`. Expose `GET /api/categories` endpoint. On the frontend, render filter tabs above the gallery (e.g. Classic / Spicy / Signature) that filter the pizza list by category.

**Backend:** new entity, relationship, repository, controller  
**Frontend:** tab filter UI, category-based filtering with mock fallback

## 3. Promo Codes
Add a `PromoCode` entity (`code`, `discountPercent`, `active`). Expose `POST /api/promo/validate` that accepts a code and returns the discount. On the frontend, add a promo code input in the cart that recalculates the total with the applied discount.

**Backend:** entity, validation endpoint, error handling  
**Frontend:** promo input in cart, discount display, total recalculation

## 4. Preparation Time
Add a `prepTimeMinutes` field to the `Pizza` entity. Display estimated preparation time (e.g. "~12 min") next to the price in each gallery item. Expose `GET /api/orders/{id}/eta` endpoint that calculates the ETA based on ordered pizzas.

**Backend:** entity field, ETA calculation endpoint  
**Frontend:** prep time badge in gallery, mock data fallback

## 5. Customer Reviews
Add a `Review` entity (`id`, `orderId`, `text`, `rating`, `createdAt`). Expose CRUD endpoints under `/api/reviews`. On the frontend, add a reviews section below the gallery showing recent reviews and a form to submit a new one.

**Backend:** entity, repository, controller (create, list, delete)  
**Frontend:** reviews list section, submit review form, mock data fallback
