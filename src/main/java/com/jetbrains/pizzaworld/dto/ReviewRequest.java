package com.jetbrains.pizzaworld.dto;

/**
 * {@code rating} is a Double so that fractional values such as 4.5 can be rejected;
 * an Integer would silently truncate them.
 */
public record ReviewRequest(Long orderId, String text, Double rating) {
}
