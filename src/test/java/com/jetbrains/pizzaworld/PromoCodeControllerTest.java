package com.jetbrains.pizzaworld;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PromoCodeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ResultActions validate(String body) throws Exception {
        return mockMvc.perform(post("/api/promo/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    @Test
    void shouldReturnDiscountForActiveCode() throws Exception {
        validate("{\"code\":\"PIZZA10\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("PIZZA10"))
                .andExpect(jsonPath("$.discountPercent").value(10));
    }

    @Test
    void shouldTrimAndIgnoreCase() throws Exception {
        validate("{\"code\":\"  pizza10 \"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("PIZZA10"))
                .andExpect(jsonPath("$.discountPercent").value(10));
    }

    @Test
    void shouldRejectUnknownCode() throws Exception {
        validate("{\"code\":\"NOPE\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid promo code: NOPE"));
    }

    @Test
    void shouldRejectInactiveCode() throws Exception {
        validate("{\"code\":\"EXPIRED20\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid promo code: EXPIRED20"));
    }

    @Test
    void shouldRejectBlankOrMissingCode() throws Exception {
        validate("{\"code\":\"   \"}").andExpect(status().isBadRequest());
        validate("{}").andExpect(status().isBadRequest());
    }
}
