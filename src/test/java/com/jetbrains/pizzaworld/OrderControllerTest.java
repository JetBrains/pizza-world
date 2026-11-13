package com.jetbrains.pizzaworld;

import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.model.PizzaOrder;
import com.jetbrains.pizzaworld.repository.OrderRepository;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PizzaRepository pizzaRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void shouldCreateOrder() throws Exception {
        Pizza pizza = pizzaRepository.findAll().getFirst();
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerName\":\"John\",\"pizzaIds\":[" + pizza.getId() + "]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerName").value("John"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void shouldRejectOrderWithNoPizzas() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerName\":\"John\",\"pizzaIds\":[999]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldUpdateOrderStatus() throws Exception {
        Pizza pizza = pizzaRepository.findAll().getFirst();
        String response = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerName\":\"Jane\",\"pizzaIds\":[" + pizza.getId() + "]}"))
                .andReturn().getResponse().getContentAsString();

        String orderId = response.replaceAll(".*\"id\":(\\d+).*", "$1");

        mockMvc.perform(patch("/api/orders/" + orderId + "/status?status=CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void shouldReturnAllOrders() throws Exception {
        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnEtaForOrderWithSeveralPizzas() throws Exception {
        List<Pizza> pizzas = pizzaRepository.findAll().subList(0, 3);
        PizzaOrder order = orderRepository.save(new PizzaOrder("Eve", pizzas));
        int expectedMinutes = pizzas.stream().mapToInt(Pizza::getPrepTimeMinutes).sum();
        // Reload, as the database stores createdAt with less precision than LocalDateTime.now()
        LocalDateTime createdAt = orderRepository.findById(order.getId()).orElseThrow().getCreatedAt();

        String response = mockMvc.perform(get("/api/orders/" + order.getId() + "/eta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(order.getId()))
                .andExpect(jsonPath("$.prepTimeMinutes").value(expectedMinutes))
                .andReturn().getResponse().getContentAsString();

        // Compare as LocalDateTime: JSON drops trailing zeros of the fraction (.937610 -> .93761)
        LocalDateTime estimatedReadyAt = LocalDateTime.parse(JsonPath.read(response, "$.estimatedReadyAt"));
        assertEquals(createdAt.plusMinutes(expectedMinutes), estimatedReadyAt);
    }

    @Test
    void shouldReturn404ForEtaOfUnknownOrder() throws Exception {
        mockMvc.perform(get("/api/orders/999999/eta"))
                .andExpect(status().isNotFound());
    }
}
