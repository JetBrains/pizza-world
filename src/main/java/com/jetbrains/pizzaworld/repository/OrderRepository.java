package com.jetbrains.pizzaworld.repository;

import com.jetbrains.pizzaworld.model.PizzaOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<PizzaOrder, Long> {
}
