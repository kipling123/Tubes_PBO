package models;

import java.util.LinkedHashMap;
import java.util.Map;

public abstract class Product {
    protected final String id;
    protected final String name;
    protected final String category;
    protected final int price;
    protected final int stock;
    protected final String details;

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

    public abstract String getFormattedDetails();

    public Map<String, Object> toMap() {
        Map<String, Object> data = new LinkedHashMap<String, Object>();
        data.put("id", id);
        data.put("name", name);
        data.put("category", category);
        data.put("price", price);
        data.put("stock", stock);
        data.put("details", getFormattedDetails());
        return data;
    }
}
