package models;

import java.util.LinkedHashMap;
import java.util.Map;

public class Product {
    private final String id;
    private final String name;
    private final String category;
    private final int price;
    private final int stock;
    private final String details;

    public Product(String id, String name, String category, int price, int stock, String details) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.details = details;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public int getPrice() {
        return price;
    }

    public int getStock() {
        return stock;
    }

    public String getDetails() {
        return details;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> data = new LinkedHashMap<String, Object>();
        data.put("id", id);
        data.put("name", name);
        data.put("category", category);
        data.put("price", price);
        data.put("stock", stock);
        data.put("details", details);
        return data;
    }
}
