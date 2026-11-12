package com.jetbrains.pizzaworld.controller;

import com.jetbrains.pizzaworld.dto.ReviewRequest;
import com.jetbrains.pizzaworld.model.Review;
import com.jetbrains.pizzaworld.repository.OrderRepository;
import com.jetbrains.pizzaworld.repository.ReviewRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    public ReviewController(ReviewRepository reviewRepository, OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<Review> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDescIdDesc();
    }

    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody ReviewRequest request) {
        if (!isValid(request)) {
            return ResponseEntity.badRequest().build();
        }
        Review review = new Review(request.orderId(), request.text().trim(), request.rating());
        return ResponseEntity.ok(reviewRepository.save(review));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        if (!reviewRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reviewRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isValid(ReviewRequest request) {
        if (request == null || request.rating() == null || request.rating() < 1 || request.rating() > 5) {
            return false;
        }
        if (request.text() == null || request.text().isBlank() || request.text().trim().length() > Review.MAX_TEXT_LENGTH) {
            return false;
        }
        return request.orderId() == null || orderRepository.existsById(request.orderId());
    }
}
