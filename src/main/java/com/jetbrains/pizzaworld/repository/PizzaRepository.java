package com.jetbrains.pizzaworld.repository;

import com.jetbrains.pizzaworld.model.Pizza;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PizzaRepository extends JpaRepository<Pizza, Long> {
}
