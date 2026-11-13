package com.jetbrains.pizzaworld.dto;

import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.model.PizzaOrder;

import java.time.LocalDateTime;

/**
 * Estimated ready time of an order. Pizzas are assumed to be prepared one after another,
 * so the total prep time is the sum of the ordered pizzas' prep times, counted from the order's creation.
 */
public record OrderEta(Long orderId, int prepTimeMinutes, LocalDateTime estimatedReadyAt) {

    public static OrderEta of(PizzaOrder order) {
        int totalMinutes = order.getPizzas().stream()
                .mapToInt(Pizza::getPrepTimeMinutes)
                .sum();
        return new OrderEta(order.getId(), totalMinutes, order.getCreatedAt().plusMinutes(totalMinutes));
    }
}
