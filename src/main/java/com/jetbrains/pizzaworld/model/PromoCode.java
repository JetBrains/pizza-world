package com.jetbrains.pizzaworld.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class PromoCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stored upper-case; lookups normalise the input the same way (see {@link #normalize(String)}). */
    @Column(nullable = false, unique = true)
    private String code;

    private int discountPercent;
    private boolean active;

    public PromoCode() {
    }

    public PromoCode(String code, int discountPercent, boolean active) {
        this.code = normalize(code);
        this.discountPercent = discountPercent;
        this.active = active;
    }

    /** Promo codes are trimmed and case-insensitive. */
    public static String normalize(String code) {
        return code == null ? "" : code.trim().toUpperCase(java.util.Locale.ROOT);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = normalize(code);
    }

    public int getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(int discountPercent) {
        this.discountPercent = discountPercent;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
