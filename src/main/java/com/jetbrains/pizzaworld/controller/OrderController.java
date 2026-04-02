package com.jetbrains.pizzaworld.controller;

import com.jetbrains.pizzaworld.dto.OrderRequest;
import com.jetbrains.pizzaworld.model.OrderStatus;
import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.model.PizzaOrder;
import com.jetbrains.pizzaworld.repository.OrderRepository;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final PizzaRepository pizzaRepository;

    public OrderController(OrderRepository orderRepository, PizzaRepository pizzaRepository) {
        this.orderRepository = orderRepository;
        this.pizzaRepository = pizzaRepository;
    }

    @GetMapping
    public List<PizzaOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PizzaOrder> getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PizzaOrder> createOrder(@RequestBody OrderRequest request) {
        List<Pizza> pizzas = pizzaRepository.findAllById(request.pizzaIds());
        if (pizzas.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        PizzaOrder order = new PizzaOrder(request.customerName(), pizzas);
        return ResponseEntity.ok(orderRepository.save(order));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PizzaOrder> updateOrderStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        return orderRepository.findById(id)
                .map(order -> {
                    order.setStatus(status);
                    return ResponseEntity.ok(orderRepository.save(order));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
