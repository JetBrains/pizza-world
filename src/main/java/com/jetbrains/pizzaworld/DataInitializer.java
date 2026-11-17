package com.jetbrains.pizzaworld;

import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PizzaRepository pizzaRepository;

    public DataInitializer(PizzaRepository pizzaRepository) {
        this.pizzaRepository = pizzaRepository;
    }

    @Override
    public void run(String... args) {
        if (pizzaRepository.count() == 0) {
            pizzaRepository.save(new Pizza("Margherita", "Classic tomato sauce, mozzarella, fresh basil", 8.99, "Medium", 5));
            pizzaRepository.save(new Pizza("Pepperoni", "Tomato sauce, mozzarella, pepperoni", 10.99, "Medium", 4));
            pizzaRepository.save(new Pizza("Hawaiian", "Tomato sauce, mozzarella, ham, pineapple", 11.49, "Medium", 3));
            pizzaRepository.save(new Pizza("Quattro Formaggi", "Mozzarella, gorgonzola, parmesan, fontina", 12.99, "Large", 5));
            pizzaRepository.save(new Pizza("Diavola", "Tomato sauce, mozzarella, spicy salami, chili flakes", 11.99, "Medium", 4));
            pizzaRepository.save(new Pizza("Veggie Supreme", "Tomato sauce, mozzarella, bell peppers, mushrooms, olives, onions", 10.49, "Large", 3));
        }
    }
}
