package services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import models.Member;
import models.Product;
import models.User;

public class StoreService {
    private static final String DB_NAME = "tubes_pbo";
    private static final String BASE_URL = "jdbc:mysql://localhost:3306/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String DB_URL = "jdbc:mysql://localhost:3306/" + DB_NAME + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASSWORD = "";

    public StoreService() {
        initDriver();
        initDatabase();
    }

    private void initDriver() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("MySQL JDBC Driver tidak ditemukan", e);
        }
    }

    private void initDatabase() {
        try (Connection connection = DriverManager.getConnection(BASE_URL, USER, PASSWORD)) {
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE DATABASE IF NOT EXISTS " + DB_NAME);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal menginisialisasi database", e);
        }

        try (Connection connection = getConnection()) {
            try (Statement statement = connection.createStatement()) {
                statement.executeUpdate("DROP TABLE IF EXISTS transaction_details");
                statement.executeUpdate("DROP TABLE IF EXISTS transactions");
                statement.executeUpdate("DROP TABLE IF EXISTS members");
                statement.executeUpdate("DROP TABLE IF EXISTS products");
                statement.executeUpdate("DROP TABLE IF EXISTS users");

                statement.executeUpdate(
                        "CREATE TABLE products (" +
                        "id VARCHAR(64) PRIMARY KEY, " +
                        "name VARCHAR(255) NOT NULL, " +
                        "category VARCHAR(64) NOT NULL, " +
                        "price INT NOT NULL, " +
                        "stock INT NOT NULL, " +
                        "details VARCHAR(255) DEFAULT '-')"
                );
                statement.executeUpdate(
                        "CREATE TABLE members (" +
                        "id VARCHAR(64) PRIMARY KEY, " +
                        "name VARCHAR(255) NOT NULL, " +
                        "email VARCHAR(255) NOT NULL, " +
                        "points INT NOT NULL DEFAULT 0)"
                );
                statement.executeUpdate(
                        "CREATE TABLE users (" +
                        "id VARCHAR(64) PRIMARY KEY, " +
                        "name VARCHAR(255) NOT NULL, " +
                        "email VARCHAR(255) NOT NULL UNIQUE, " +
                        "password VARCHAR(255) NOT NULL, " +
                        "role VARCHAR(64) NOT NULL, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
                );
                statement.executeUpdate(
                        "CREATE TABLE transactions (" +
                        "id INT AUTO_INCREMENT PRIMARY KEY, " +
                        "trx_id VARCHAR(64) NOT NULL, " +
                        "member_id VARCHAR(64), " +
                        "subtotal INT NOT NULL, " +
                        "discount INT NOT NULL, " +
                        "ppn INT NOT NULL, " +
                        "total INT NOT NULL, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
                );
                statement.executeUpdate(
                        "CREATE TABLE transaction_details (" +
                        "id INT AUTO_INCREMENT PRIMARY KEY, " +
                        "trx_id VARCHAR(64) NOT NULL, " +
                        "product_id VARCHAR(64) NOT NULL, " +
                        "quantity INT NOT NULL, " +
                        "price INT NOT NULL)"
                );

                if (isTableEmpty(connection, "products")) {
                    statement.executeUpdate("INSERT INTO products (id, name, category, price, stock, details) VALUES ('OBJ-ELC-202601', 'Kulkas Showcase LG Smart', 'Elektronik', 7500000, 18, '24 Bulan Garansi')");
                    statement.executeUpdate("INSERT INTO products (id, name, category, price, stock, details) VALUES ('OBJ-FOD-202644', 'Susu Almond Premium 1L', 'Makanan', 45000, 140, 'Kedaluwarsa: Des 2026')");
                    statement.executeUpdate("INSERT INTO products (id, name, category, price, stock, details) VALUES ('OBJ-ELC-202602', 'Rice Cooker Yong Ma Digital', 'Elektronik', 850000, 5, '12 Bulan Garansi')");
                    statement.executeUpdate("INSERT INTO products (id, name, category, price, stock, details) VALUES ('OBJ-FOD-202645', 'Roti Tawar Gandum Whole Wheat', 'Makanan', 18000, 8, 'Kedaluwarsa: Des 2026')");
                }

                if (isTableEmpty(connection, "members")) {
                    statement.executeUpdate("INSERT INTO members (id, name, email, points) VALUES ('PEL-001', 'Nazmi Rio Rabani', 'nazmi@student.telkom.ac.id', 2450)");
                    statement.executeUpdate("INSERT INTO members (id, name, email, points) VALUES ('PEL-002', 'Rafi Ikbar Fahrezy', 'rafi@student.telkom.ac.id', 850)");
                }

                if (isTableEmpty(connection, "users")) {
                    statement.executeUpdate("INSERT INTO users (id, name, email, password, role) VALUES ('USR-ADMIN', 'Administrator', 'admin@store.com', '" + hashPassword("admin123") + "', 'admin')");
                    statement.executeUpdate("INSERT INTO users (id, name, email, password, role) VALUES ('USR-CASHIER', 'Kasir', 'kasir@store.com', '" + hashPassword("kasir123") + "', 'kasir')");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal membuat tabel database", e);
        }
    }

    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, USER, PASSWORD);
    }

    private boolean isTableEmpty(Connection connection, String tableName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("SELECT COUNT(*) FROM " + tableName);
             ResultSet resultSet = statement.executeQuery()) {
            resultSet.next();
            return resultSet.getInt(1) == 0;
        }
    }

    public List<Map<String, Object>> getProducts() {
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        String sql = "SELECT id, name, category, price, stock, details FROM products ORDER BY id";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {

            while (resultSet.next()) {
                result.add(new Product(
                        resultSet.getString("id"),
                        resultSet.getString("name"),
                        resultSet.getString("category"),
                        resultSet.getInt("price"),
                        resultSet.getInt("stock"),
                        resultSet.getString("details")
                ).toMap());
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal mengambil produk", e);
        }

        return result;
    }

    public Product addProduct(Map<String, Object> payload) {
        Product product = buildProduct(payload, null);

        String sql = "INSERT INTO products (id, name, category, price, stock, details) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection connection = getConnection();
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
        Product product = buildProduct(payload, payload.get("id") == null ? null : payload.get("id").toString());
        String sql = "UPDATE products SET name = ?, category = ?, price = ?, stock = ?, details = ? WHERE id = ?";
        try (Connection connection = getConnection();
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
        String sql = "DELETE FROM products WHERE id = ?";
        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, productId);
            return statement.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException("Gagal menghapus produk: " + e.getMessage(), e);
        }
    }

    public List<Map<String, Object>> getMembers() {
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        String sql = "SELECT id, name, email, points FROM members ORDER BY id";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {

            while (resultSet.next()) {
                result.add(new Member(
                        resultSet.getString("id"),
                        resultSet.getString("name"),
                        resultSet.getString("email"),
                        resultSet.getInt("points")
                ).toMap());
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal mengambil member", e);
        }

        return result;
    }

    public Member addMember(Map<String, Object> payload) {
        Member member = buildMember(payload, null);

        String sql = "INSERT INTO members (id, name, email, points) VALUES (?, ?, ?, ?)";
        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, member.getId());
            statement.setString(2, member.getName());
            statement.setString(3, member.getEmail());
            statement.setInt(4, member.getPoints());
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Gagal menyimpan member ke database: " + e.getMessage(), e);
        }

        return member;
    }

    public List<Map<String, Object>> getUsers() {
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        String sql = "SELECT id, name, email, role FROM users ORDER BY id";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                result.add(new User(
                        resultSet.getString("id"),
                        resultSet.getString("name"),
                        resultSet.getString("email"),
                        "",
                        resultSet.getString("role")
                ).toMap());
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal mengambil pengguna", e);
        }

        return result;
    }

    public User addUser(Map<String, Object> payload) {
        String role = normalizeRole(payload.get("role") == null ? "kasir" : payload.get("role").toString());
        String email = payload.get("email") == null ? "" : payload.get("email").toString();
        String password = payload.get("password") == null ? "" : payload.get("password").toString();
        String name = payload.get("name") == null ? "" : payload.get("name").toString();
        String id = payload.get("id") == null ? "USR-" + System.currentTimeMillis() : payload.get("id").toString();

        User user = new User(id, name, email, hashPassword(password), role);
        String sql = "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)";
        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, user.getId());
            statement.setString(2, user.getName());
            statement.setString(3, user.getEmail());
            statement.setString(4, user.getPassword());
            statement.setString(5, user.getRole());
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Gagal menyimpan pengguna: " + e.getMessage(), e);
        }

        return user;
    }

    public Map<String, Object> login(Map<String, Object> payload) {
        String email = payload.get("email") == null ? "" : payload.get("email").toString();
        String password = payload.get("password") == null ? "" : payload.get("password").toString();
        String sql = "SELECT id, name, email, password, role FROM users WHERE email = ?";
        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    String storedHash = resultSet.getString("password");
                    if (hashPassword(password).equals(storedHash)) {
                        Map<String, Object> result = new LinkedHashMap<String, Object>();
                        result.put("success", true);
                        result.put("message", "Login berhasil");
                        result.put("user", new User(
                                resultSet.getString("id"),
                                resultSet.getString("name"),
                                resultSet.getString("email"),
                                "",
                                resultSet.getString("role")
                        ).toMap());
                        return result;
                    }
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal melakukan login: " + e.getMessage(), e);
        }

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("success", false);
        result.put("message", "Email atau password salah");
        return result;
    }

    public Member updateMember(Map<String, Object> payload) {
        Member member = buildMember(payload, payload.get("id") == null ? null : payload.get("id").toString());
        String sql = "UPDATE members SET name = ?, email = ?, points = ? WHERE id = ?";
        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, member.getName());
            statement.setString(2, member.getEmail());
            statement.setInt(3, member.getPoints());
            statement.setString(4, member.getId());
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Gagal memperbarui member: " + e.getMessage(), e);
        }

        return member;
    }

    public boolean deleteMember(String memberId) {
        String sql = "DELETE FROM members WHERE id = ?";
        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, memberId);
            return statement.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException("Gagal menghapus member: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> checkout(Map<String, Object> payload) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        try (Connection connection = getConnection()) {
            String trxId = payload.get("trx_id") == null ? "" : payload.get("trx_id").toString();
            String memberId = payload.get("member_id") == null ? null : payload.get("member_id").toString();
            int subtotal = parseInt(payload.get("subtotal"), 0);
            int discount = parseInt(payload.get("discount"), 0);
            int ppn = parseInt(payload.get("ppn"), 0);
            int total = parseInt(payload.get("total"), 0);

            try (PreparedStatement transactionStatement = connection.prepareStatement(
                    "INSERT INTO transactions (trx_id, member_id, subtotal, discount, ppn, total) VALUES (?, ?, ?, ?, ?, ?)")) {
                transactionStatement.setString(1, trxId);
                transactionStatement.setString(2, memberId);
                transactionStatement.setInt(3, subtotal);
                transactionStatement.setInt(4, discount);
                transactionStatement.setInt(5, ppn);
                transactionStatement.setInt(6, total);
                transactionStatement.executeUpdate();
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal mencatat checkout", e);
        }

        result.put("message", "Checkout berhasil");
        result.put("trx_id", payload.get("trx_id") == null ? "" : payload.get("trx_id"));
        result.put("total", payload.get("total") == null ? 0 : payload.get("total"));
        return result;
    }

    private Product buildProduct(Map<String, Object> payload, String forcedId) {
        String id = forcedId;
        if (id == null || id.isEmpty()) {
            id = payload.containsKey("id") && payload.get("id") != null && !payload.get("id").toString().isEmpty()
                    ? payload.get("id").toString()
                    : generateProductId(payload.get("category") == null ? "Elektronik" : payload.get("category").toString());
        }

        return new Product(
                id,
                payload.get("name") == null ? "" : payload.get("name").toString(),
                payload.get("category") == null ? "Elektronik" : payload.get("category").toString(),
                parseInt(payload.get("price"), 0),
                parseInt(payload.get("stock"), 0),
                payload.get("details") == null ? "-" : payload.get("details").toString()
        );
    }

    private Member buildMember(Map<String, Object> payload, String forcedId) {
        String id = forcedId;
        if (id == null || id.isEmpty()) {
            id = payload.get("id") == null ? "PEL-999" : payload.get("id").toString();
        }

        return new Member(
                id,
                payload.get("name") == null ? "" : payload.get("name").toString(),
                payload.get("email") == null ? "" : payload.get("email").toString(),
                parseInt(payload.get("points"), 0)
        );
    }

    private String generateProductId(String category) {
        String prefix = "Elektronik".equals(category) ? "OBJ-ELC-" : "OBJ-FOD-";
        return prefix + System.currentTimeMillis();
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "kasir";
        }
        String normalized = role.trim().toLowerCase();
        return "admin".equals(normalized) ? "admin" : "kasir";
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Tidak dapat mengenkripsi password", e);
        }
    }

    private int parseInt(Object value, int fallback) {
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException ignored) {
            }
        }
        return fallback;
    }
}
