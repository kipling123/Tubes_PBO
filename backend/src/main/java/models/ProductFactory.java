package models;

public class ProductFactory {
    public static Product createProduct(String id, String name, String category, int price, int stock, String details) {
        if ("Elektronik".equalsIgnoreCase(category)) {
            return new ElectronicProduct(id, name, price, stock, details);
        } else {
            // Makanan or other category uses FoodProduct
            String cat = (category == null || category.isEmpty()) ? "Makanan" : category;
            return new FoodProduct(id, name, cat, price, stock, details);
        }
    }
}
