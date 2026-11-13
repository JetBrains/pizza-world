package com.jetbrains.pizzaworld.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Pizza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private double price;
    private String size;
    private int prepTimeMinutes;

    // Bind JSON through setters, so a request body without prepTimeMinutes still creates a pizza
    @JsonCreator
    public Pizza() {
    }

    public Pizza(String name, String description, double price, String size, int prepTimeMinutes) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.size = size;
        this.prepTimeMinutes = prepTimeMinutes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public int getPrepTimeMinutes() {
        return prepTimeMinutes;
    }

    public void setPrepTimeMinutes(int prepTimeMinutes) {
        this.prepTimeMinutes = prepTimeMinutes;
    }
}
