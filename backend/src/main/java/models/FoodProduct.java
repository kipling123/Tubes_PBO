package models;

public class FoodProduct extends Product {
    public FoodProduct(String id, String name, String category, int price, int stock, String details) {
        super(id, name, category, price, stock, details);
    }

    @Override
    public String getFormattedDetails() {
        if (details == null || details.isEmpty()) {
            return "-";
        }
        return details;
    }
}
