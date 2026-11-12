package com.jetbrains.pizzaworld.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Review {

    public static final int MAX_TEXT_LENGTH = 1000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    @Column(nullable = false, length = MAX_TEXT_LENGTH)
    private String text;

    private int rating;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Review() {
    }

    public Review(Long orderId, String text, int rating) {
        this.orderId = orderId;
        this.text = text;
        this.rating = rating;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
