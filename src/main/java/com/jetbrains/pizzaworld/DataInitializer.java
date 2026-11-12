package com.jetbrains.pizzaworld;

import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.model.Review;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import com.jetbrains.pizzaworld.repository.ReviewRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PizzaRepository pizzaRepository;
    private final ReviewRepository reviewRepository;

    public DataInitializer(PizzaRepository pizzaRepository, ReviewRepository reviewRepository) {
        this.pizzaRepository = pizzaRepository;
        this.reviewRepository = reviewRepository;
    }

    @Override
    public void run(String... args) {
        if (pizzaRepository.count() == 0) {
            pizzaRepository.save(new Pizza("Margherita", "Classic tomato sauce, mozzarella, fresh basil", 8.99, "Medium"));
            pizzaRepository.save(new Pizza("Pepperoni", "Tomato sauce, mozzarella, pepperoni", 10.99, "Medium"));
            pizzaRepository.save(new Pizza("Hawaiian", "Tomato sauce, mozzarella, ham, pineapple", 11.49, "Medium"));
            pizzaRepository.save(new Pizza("Quattro Formaggi", "Mozzarella, gorgonzola, parmesan, fontina", 12.99, "Large"));
            pizzaRepository.save(new Pizza("Diavola", "Tomato sauce, mozzarella, spicy salami, chili flakes", 11.99, "Medium"));
            pizzaRepository.save(new Pizza("Veggie Supreme", "Tomato sauce, mozzarella, bell peppers, mushrooms, olives, onions", 10.49, "Large"));
        }
        if (reviewRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();
            reviewRepository.save(seedReview("Thin, airy crust and the basil tastes like summer. Best Margherita in town.", 5, now.minusDays(1)));
            reviewRepository.save(seedReview("Diavola had a proper kick. Delivery took a little longer than promised.", 4, now.minusDays(3)));
            reviewRepository.save(seedReview("Quattro Formaggi was rich and creamy, will order again.", 5, now.minusDays(6)));
        }
    }

    private static Review seedReview(String text, int rating, LocalDateTime createdAt) {
        Review review = new Review(null, text, rating);
        review.setCreatedAt(createdAt);
        return review;
    }
}
