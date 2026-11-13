package com.jetbrains.pizzaworld.dto;

import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.model.PizzaOrder;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OrderEtaTest {

    @Test
    void shouldSumPrepTimesAndAddThemToCreatedAt() {
        PizzaOrder order = new PizzaOrder("Ann", List.of(
                new Pizza("Margherita", "", 8.99, "Medium", 10),
                new Pizza("Diavola", "", 11.99, "Medium", 12),
                new Pizza("Veggie Supreme", "", 10.49, "Large", 5)));
        order.setId(1L);
        order.setCreatedAt(LocalDateTime.of(2026, 11, 12, 18, 3));

        OrderEta eta = OrderEta.of(order);

        assertEquals(new OrderEta(1L, 27, LocalDateTime.of(2026, 11, 12, 18, 30)), eta);
    }
}
