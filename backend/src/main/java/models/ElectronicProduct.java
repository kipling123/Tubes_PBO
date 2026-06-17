package models;

public class ElectronicProduct extends Product {
    public ElectronicProduct(String id, String name, int price, int stock, String details) {
        super(id, name, "Elektronik", price, stock, details);
    }

    @Override
    public String getFormattedDetails() {
        if (details == null || details.isEmpty()) {
            return "Tanpa Garansi";
        }
        if (details.toLowerCase().contains("garansi")) {
            return details;
        }
        return details + " (Garansi)";
    }
}
