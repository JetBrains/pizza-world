package com.jetbrains.pizzaworld.repository;

import com.jetbrains.pizzaworld.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
