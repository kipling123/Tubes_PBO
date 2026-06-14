package services;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import models.Product;
import models.ProductFactory;

public class ProductService {
    private final DatabaseManager dbManager = DatabaseManager.getInstance();
    private final List<Product> offlineProducts = new ArrayList<>();

    public ProductService() {
        offlineProducts.add(ProductFactory.createProduct("OBJ-ELC-202601", "Kulkas Showcase LG Smart", "Elektronik", 7500000, 18, "24 Bulan Garansi"));
        offlineProducts.add(ProductFactory.createProduct("OBJ-FOD-202644", "Susu Almond Premium 1L", "Makanan", 45000, 140, "Kedaluwarsa: Des 2026"));
        offlineProducts.add(ProductFactory.createProduct("OBJ-ELC-202602", "Rice Cooker Yong Ma Digital", "Elektronik", 850000, 5, "12 Bulan Garansi"));
        offlineProducts.add(ProductFactory.createProduct("OBJ-FOD-202645", "Roti Tawar Gandum Whole Wheat", "Makanan", 18000, 8, "Kedaluwarsa: Des 2026"));
    }

    public List<Map<String, Object>> getProducts() {
        if (dbManager.isOffline()) {
            List<Map<String, Object>> result = new ArrayList<>();
            for (Product p : offlineProducts) {
                result.add(p.toMap());
            }
            return result;
        }

        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        String sql = "SELECT id, name, category, price, stock, details FROM products ORDER BY id";

        try (Connection connection = dbManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {

            while (resultSet.next()) {
                Product product = ProductFactory.createProduct(
                        resultSet.getString("id"),
                        resultSet.getString("name"),
                        resultSet.getString("category"),
                        resultSet.getInt("price"),
                        resultSet.getInt("stock"),
                        resultSet.getString("details")
                );
                result.add(product.toMap());
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal mengambil produk", e);
        }

        return result;
    }

    public Product addProduct(Map<String, Object> payload) {
        Product product = buildProduct(payload, null);

        if (dbManager.isOffline()) {
            offlineProducts.add(product);
            return product;
        }

        String sql = "INSERT INTO products (id, name, category, price, stock, details) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection connection = dbManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, product.getId());
            statement.setString(2, product.getName());
            statement.setString(3, product.getCategory());
            statement.setInt(4, product.getPrice());
            statement.setInt(5, product.getStock());
            statement.setString(6, product.getDetails());
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Gagal menyimpan produk ke database: " + e.getMessage(), e);
        }

        return product;
    }

    public Product updateProduct(Map<String, Object> payload) {
        String id = payload.get("id") == null ? null : payload.get("id").toString();
        Product product = buildProduct(payload, id);

        if (dbManager.isOffline()) {
            for (int i = 0; i < offlineProducts.size(); i++) {
                if (offlineProducts.get(i).getId().equalsIgnoreCase(id)) {
                    offlineProducts.set(i, product);
                    return product;
                }
            }
            offlineProducts.add(product);
            return product;
        }

        String sql = "UPDATE products SET name = ?, category = ?, price = ?, stock = ?, details = ? WHERE id = ?";
        try (Connection connection = dbManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, product.getName());
            statement.setString(2, product.getCategory());
            statement.setInt(3, product.getPrice());
            statement.setInt(4, product.getStock());
            statement.setString(5, product.getDetails());
            statement.setString(6, product.getId());
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Gagal memperbarui produk: " + e.getMessage(), e);
        }

        return product;
    }

    public boolean deleteProduct(String productId) {
        if (dbManager.isOffline()) {
            return offlineProducts.removeIf(p -> p.getId().equalsIgnoreCase(productId));
        }

        String sql = "DELETE FROM products WHERE id = ?";
        try (Connection connection = dbManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, productId);
            return statement.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException("Gagal menghapus produk: " + e.getMessage(), e);
        }
    }

    private Product buildProduct(Map<String, Object> payload, String forcedId) {
        String id = forcedId;
        if (id == null || id.isEmpty()) {
            id = payload.containsKey("id") && payload.get("id") != null && !payload.get("id").toString().isEmpty()
                    ? payload.get("id").toString()
                    : generateProductId(payload.get("category") == null ? "Elektronik" : payload.get("category").toString());
        }

        return ProductFactory.createProduct(
                id,
                payload.get("name") == null ? "" : payload.get("name").toString(),
                payload.get("category") == null ? "Elektronik" : payload.get("category").toString(),
                parseInt(payload.get("price"), 0),
                parseInt(payload.get("stock"), 0),
                payload.get("details") == null ? "-" : payload.get("details").toString()
        );
    }

    private String generateProductId(String category) {
        String prefix = "Elektronik".equalsIgnoreCase(category) ? "OBJ-ELC-" : "OBJ-FOD-";
        return prefix + System.currentTimeMillis();
    }

    private int parseInt(Object value, int fallback) {
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        if (value instanceof String) {
            try {
                return java.lang.Integer.parseInt((String) value);
            } catch (NumberFormatException ignored) {
            }
        }
        return fallback;
    }
}
