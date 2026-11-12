package com.jetbrains.pizzaworld;

import com.jayway.jsonpath.JsonPath;
import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
    void shouldExposePrepTimeForEverySeededPizza() throws Exception {
        String json = mockMvc.perform(get("/api/pizzas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].prepTimeMinutes", hasSize((int) pizzaRepository.count())))
                .andReturn().getResponse().getContentAsString();

        List<String> seeded = List.of("Margherita", "Pepperoni", "Hawaiian", "Quattro Formaggi", "Diavola", "Veggie Supreme");
        for (String name : seeded) {
            List<Integer> prepTimes = JsonPath.read(json, "$[?(@.name == '" + name + "')].prepTimeMinutes");
            assertEquals(1, prepTimes.size(), name);
            assertTrue(prepTimes.getFirst() >= 10 && prepTimes.getFirst() <= 18, name + ": " + prepTimes.getFirst());
        }
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
                .andExpect(jsonPath("$.name").value("Test Pizza"))
                .andExpect(jsonPath("$.prepTimeMinutes").value(0));
    }

    @Test
    void shouldCreatePizzaWithPrepTime() throws Exception {
        mockMvc.perform(post("/api/pizzas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Calzone\",\"description\":\"Folded\",\"price\":11.5,\"size\":\"Medium\",\"prepTimeMinutes\":16}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prepTimeMinutes").value(16));
    }
}
