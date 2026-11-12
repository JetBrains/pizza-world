package com.jetbrains.pizzaworld.dto;

public record ReviewRequest(Long orderId, String text, Integer rating) {
}
