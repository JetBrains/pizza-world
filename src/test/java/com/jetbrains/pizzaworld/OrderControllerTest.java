package com.jetbrains.pizzaworld;

import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.repository.OrderRepository;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

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
}
