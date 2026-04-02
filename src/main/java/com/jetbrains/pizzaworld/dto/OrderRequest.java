package com.jetbrains.pizzaworld.dto;

import java.util.List;

public record OrderRequest(String customerName, List<Long> pizzaIds) {
}
