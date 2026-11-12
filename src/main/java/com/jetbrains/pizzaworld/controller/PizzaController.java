package com.jetbrains.pizzaworld.controller;

import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pizzas")
public class PizzaController {

    private final PizzaRepository pizzaRepository;

    public PizzaController(PizzaRepository pizzaRepository) {
        this.pizzaRepository = pizzaRepository;
    }

    @GetMapping
    public List<Pizza> getAllPizzas() {
        return pizzaRepository.findAll();
    }

    @GetMapping("/top")
    public List<Pizza> getTopPizzas() {
        return pizzaRepository.findAllOrderByRatingDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pizza> getPizzaById(@PathVariable Long id) {
        return pizzaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Pizza> createPizza(@RequestBody Pizza pizza) {
        Integer rating = pizza.getRating();
        if (rating != null && (rating < 1 || rating > 5)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(pizzaRepository.save(pizza));
    }
}
