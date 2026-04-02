package com.jetbrains.pizzaworld;

import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PizzaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PizzaRepository pizzaRepository;

    @Test
    void shouldReturnAllPizzas() throws Exception {
        mockMvc.perform(get("/api/pizzas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(pizzaRepository.count()));
    }

    @Test
    void shouldReturnPizzaById() throws Exception {
        Pizza pizza = pizzaRepository.findAll().getFirst();
        mockMvc.perform(get("/api/pizzas/" + pizza.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(pizza.getName()));
    }

    @Test
    void shouldReturn404ForUnknownPizza() throws Exception {
        mockMvc.perform(get("/api/pizzas/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldCreatePizza() throws Exception {
        mockMvc.perform(post("/api/pizzas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test Pizza\",\"description\":\"Test\",\"price\":9.99,\"size\":\"Small\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Pizza"));
    }
}
