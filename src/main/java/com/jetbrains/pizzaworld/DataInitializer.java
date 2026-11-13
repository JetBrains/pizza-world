package com.jetbrains.pizzaworld;

import com.jetbrains.pizzaworld.model.Category;
import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.repository.CategoryRepository;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PizzaRepository pizzaRepository;
    private final CategoryRepository categoryRepository;

    public DataInitializer(PizzaRepository pizzaRepository, CategoryRepository categoryRepository) {
        this.pizzaRepository = pizzaRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        if (pizzaRepository.count() == 0) {
            Category classic = categoryRepository.save(new Category("Classic"));
            Category spicy = categoryRepository.save(new Category("Spicy"));
            Category signature = categoryRepository.save(new Category("Signature"));

            pizzaRepository.save(withCategory(new Pizza("Margherita", "Classic tomato sauce, mozzarella, fresh basil", 8.99, "Medium"), classic));
            pizzaRepository.save(withCategory(new Pizza("Pepperoni", "Tomato sauce, mozzarella, pepperoni", 10.99, "Medium"), spicy));
            pizzaRepository.save(withCategory(new Pizza("Hawaiian", "Tomato sauce, mozzarella, ham, pineapple", 11.49, "Medium"), classic));
            pizzaRepository.save(withCategory(new Pizza("Quattro Formaggi", "Mozzarella, gorgonzola, parmesan, fontina", 12.99, "Large"), signature));
            pizzaRepository.save(withCategory(new Pizza("Diavola", "Tomato sauce, mozzarella, spicy salami, chili flakes", 11.99, "Medium"), spicy));
            pizzaRepository.save(withCategory(new Pizza("Veggie Supreme", "Tomato sauce, mozzarella, bell peppers, mushrooms, olives, onions", 10.49, "Large"), signature));
        }
    }

    private static Pizza withCategory(Pizza pizza, Category category) {
        pizza.setCategory(category);
        return pizza;
    }
}
