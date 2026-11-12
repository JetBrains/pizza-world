package com.jetbrains.pizzaworld.repository;

import com.jetbrains.pizzaworld.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findAllByOrderByCreatedAtDescIdDesc();
}
