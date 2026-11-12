package com.jetbrains.pizzaworld;

import com.jetbrains.pizzaworld.model.Pizza;
import com.jetbrains.pizzaworld.model.PizzaOrder;
import com.jetbrains.pizzaworld.model.Review;
import com.jetbrains.pizzaworld.repository.OrderRepository;
import com.jetbrains.pizzaworld.repository.PizzaRepository;
import com.jetbrains.pizzaworld.repository.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PizzaRepository pizzaRepository;

    @Test
    void shouldReturnReviewsNewestFirst() throws Exception {
        Review older = new Review(null, "Older review", 3);
        older.setCreatedAt(LocalDateTime.now().plusYears(1));
        Review newer = new Review(null, "Newer review", 4);
        newer.setCreatedAt(LocalDateTime.now().plusYears(2));
        // Save the newer one first so the order cannot come from insertion order.
        newer = reviewRepository.save(newer);
        older = reviewRepository.save(older);
        try {
            mockMvc.perform(get("/api/reviews"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(newer.getId()))
                    .andExpect(jsonPath("$[0].text").value("Newer review"))
                    .andExpect(jsonPath("$[1].id").value(older.getId()))
                    .andExpect(jsonPath("$[1].rating").value(3));
        } finally {
            reviewRepository.deleteAllById(List.of(newer.getId(), older.getId()));
        }
    }

    @Test
    void shouldCreateReview() throws Exception {
        mockMvc.perform(post("/api/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"  Great crust!  \",\"rating\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.text").value("Great crust!"))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.orderId").doesNotExist())
                .andExpect(jsonPath("$.createdAt").value(notNullValue()));
    }

    @Test
    void shouldCreateReviewForExistingOrder() throws Exception {
        Pizza pizza = pizzaRepository.findAll().getFirst();
        PizzaOrder order = orderRepository.save(new PizzaOrder("Reviewer", List.of(pizza)));
        mockMvc.perform(post("/api/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":" + order.getId() + ",\"text\":\"Arrived hot\",\"rating\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(order.getId()));
    }

    @Test
    void shouldIgnoreClientCreatedAt() throws Exception {
        mockMvc.perform(post("/api/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Time traveller\",\"rating\":2,\"createdAt\":\"1999-01-01T00:00:00\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.createdAt").value(not(startsWith("1999"))));
    }

    @Test
    void shouldRejectRatingBelowOne() throws Exception {
        assertRejected("{\"text\":\"Nice\",\"rating\":0}");
    }

    @Test
    void shouldRejectRatingAboveFive() throws Exception {
        assertRejected("{\"text\":\"Nice\",\"rating\":6}");
    }

    @Test
    void shouldRejectFractionalRating() throws Exception {
        assertRejected("{\"text\":\"Nice\",\"rating\":4.5}");
    }

    @Test
    void shouldRejectMissingRating() throws Exception {
        assertRejected("{\"text\":\"Nice\"}");
    }

    @Test
    void shouldRejectBlankText() throws Exception {
        assertRejected("{\"text\":\"   \",\"rating\":4}");
        assertRejected("{\"text\":\"\",\"rating\":4}");
        assertRejected("{\"rating\":4}");
    }

    @Test
    void shouldRejectTooLongText() throws Exception {
        assertRejected("{\"text\":\"" + "a".repeat(Review.MAX_TEXT_LENGTH + 1) + "\",\"rating\":4}");
    }

    @Test
    void shouldRejectUnknownOrder() throws Exception {
        assertRejected("{\"orderId\":999999,\"text\":\"Nice\",\"rating\":4}");
    }

    @Test
    void shouldDeleteExistingReview() throws Exception {
        Review review = reviewRepository.save(new Review(null, "To be deleted", 1));
        mockMvc.perform(delete("/api/reviews/" + review.getId()))
                .andExpect(status().isNoContent());
        assertFalse(reviewRepository.existsById(review.getId()));
    }

    @Test
    void shouldReturnNotFoundWhenDeletingMissingReview() throws Exception {
        mockMvc.perform(delete("/api/reviews/999999"))
                .andExpect(status().isNotFound());
    }

    private void assertRejected(String body) throws Exception {
        long before = reviewRepository.count();
        mockMvc.perform(post("/api/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
        assertEquals(before, reviewRepository.count());
    }
}
