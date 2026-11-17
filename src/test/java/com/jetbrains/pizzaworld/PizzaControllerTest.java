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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
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

    @Test
    void seededPizzasHaveRatingsBetweenOneAndFive() {
        List<String> seeded = List.of("Margherita", "Pepperoni", "Hawaiian", "Quattro Formaggi", "Diavola", "Veggie Supreme");
        List<Pizza> pizzas = pizzaRepository.findAll().stream()
                .filter(p -> seeded.contains(p.getName()))
                .toList();
        assertThat(pizzas).hasSize(seeded.size());
        assertThat(pizzas).allSatisfy(p -> assertThat(p.getRating()).isBetween(1, 5));
    }

    @Test
    void shouldReturnTopPizzasSortedByRatingDescending() throws Exception {
        String body = mockMvc.perform(get("/api/pizzas/top"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(pizzaRepository.count()))
                .andExpect(jsonPath("$[0].rating").value(5))
                .andReturn().getResponse().getContentAsString();

        List<Integer> ratings = JsonPath.read(body, "$[*].rating");
        List<Integer> rated = ratings.stream().filter(r -> r != null).toList();
        assertThat(rated).isSortedAccordingTo((a, b) -> Integer.compare(b, a));
        assertThat(ratings.subList(0, rated.size())).doesNotContainNull();
    }

    @Test
    @Transactional
    void shouldListUnratedPizzasLastInTopPizzas() throws Exception {
        pizzaRepository.save(new Pizza("Unrated Pizza", "Not rated yet", 9.99, "Small"));
        long count = pizzaRepository.count();

        mockMvc.perform(get("/api/pizzas/top"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(count))
                .andExpect(jsonPath("$[" + (count - 1) + "].rating").doesNotExist());
    }

    @Test
    void shouldCreatePizzaWithRating() throws Exception {
        mockMvc.perform(post("/api/pizzas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Rated Pizza\",\"description\":\"Test\",\"price\":9.99,\"size\":\"Small\",\"rating\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(4));
    }

    @Test
    void shouldRejectRatingOutsideOneToFive() throws Exception {
        for (int rating : new int[]{0, 6}) {
            mockMvc.perform(post("/api/pizzas")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Bad Pizza\",\"description\":\"Test\",\"price\":9.99,\"size\":\"Small\",\"rating\":" + rating + "}"))
                    .andExpect(status().isBadRequest());
        }
    }
}
