package com.jetbrains.pizzaworld.repository;

import com.jetbrains.pizzaworld.model.Pizza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PizzaRepository extends JpaRepository<Pizza, Long> {

    /** Highest rated first; unrated pizzas last, ties broken by name. */
    @Query("SELECT p FROM Pizza p ORDER BY p.rating DESC NULLS LAST, p.name ASC")
    List<Pizza> findAllOrderByRatingDesc();
}
