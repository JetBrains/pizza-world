package com.jetbrains.pizzaworld.controller;

import com.jetbrains.pizzaworld.dto.ErrorResponse;
import com.jetbrains.pizzaworld.dto.PromoCodeRequest;
import com.jetbrains.pizzaworld.dto.PromoCodeResponse;
import com.jetbrains.pizzaworld.model.PromoCode;
import com.jetbrains.pizzaworld.repository.PromoCodeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/promo")
public class PromoCodeController {

    private final PromoCodeRepository promoCodeRepository;

    public PromoCodeController(PromoCodeRepository promoCodeRepository) {
        this.promoCodeRepository = promoCodeRepository;
    }

    /** Returns the discount of an active code; unknown, inactive and blank codes get 400. */
    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestBody PromoCodeRequest request) {
        String code = PromoCode.normalize(request.code());
        if (code.isEmpty()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Enter a promo code"));
        }
        return promoCodeRepository.findByCode(code)
                .filter(PromoCode::isActive)
                .<ResponseEntity<?>>map(promo -> ResponseEntity.ok(new PromoCodeResponse(promo.getCode(), promo.getDiscountPercent())))
                .orElseGet(() -> ResponseEntity.badRequest().body(new ErrorResponse("Invalid promo code: " + code)));
    }
}
