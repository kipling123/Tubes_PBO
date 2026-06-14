package services;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import models.Member;
import models.Product;
import models.User;

public class StoreService {
    private final DatabaseManager dbManager = DatabaseManager.getInstance();
    private final UserService userService = new UserService();
    private final ProductService productService = new ProductService();
    private final MemberService memberService = new MemberService();
    private final TransactionService transactionService = new TransactionService(productService, memberService);

    public StoreService() {
        initDatabase();
    }

    private void initDatabase() {
        if (dbManager.isOffline()) {
            return;
        }
        try (Connection connection = dbManager.getBaseConnection()) {
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE DATABASE IF NOT EXISTS " + dbManager.getDbName());
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal menginisialisasi database", e);
        }

        try (Connection connection = dbManager.getConnection()) {
            try (Statement statement = connection.createStatement()) {
                // Hapus tabel bawaan agar selalu bersih pada startup (sesuai perilaku asli)
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
                    statement.executeUpdate("INSERT INTO users (id, name, email, password, role) VALUES ('USR-OWNER', 'Pemilik Toko', 'owner@toko.com', '" + hashPassword("owner123") + "', 'pemilik')");
                    statement.executeUpdate("INSERT INTO users (id, name, email, password, role) VALUES ('USR-ADMIN', 'Administrator', 'admin@toko.com', '" + hashPassword("admin123") + "', 'admin')");
                    statement.executeUpdate("INSERT INTO users (id, name, email, password, role) VALUES ('USR-CASHIER', 'Kasir', 'kasir@toko.com', '" + hashPassword("kasir123") + "', 'kasir')");
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal membuat tabel database", e);
        }
    }

    private boolean isTableEmpty(Connection connection, String tableName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("SELECT COUNT(*) FROM " + tableName);
             ResultSet resultSet = statement.executeQuery()) {
            resultSet.next();
            return resultSet.getInt(1) == 0;
        }
    }

    private String hashPassword(String password) {
        return userService.hashPassword(password);
    }

    // Delegasi Facade
    public List<Map<String, Object>> getProducts() {
        return productService.getProducts();
    }

    public Product addProduct(Map<String, Object> payload) {
        return productService.addProduct(payload);
    }

    public Product updateProduct(Map<String, Object> payload) {
        return productService.updateProduct(payload);
    }

    public boolean deleteProduct(String productId) {
        return productService.deleteProduct(productId);
    }

    public List<Map<String, Object>> getMembers() {
        return memberService.getMembers();
    }

    public Member addMember(Map<String, Object> payload) {
        return memberService.addMember(payload);
    }

    public Member updateMember(Map<String, Object> payload) {
        return memberService.updateMember(payload);
    }

    public boolean deleteMember(String memberId) {
        return memberService.deleteMember(memberId);
    }

    public List<Map<String, Object>> getUsers() {
        return userService.getUsers();
    }

    public User addUser(Map<String, Object> payload) {
        return userService.addUser(payload);
    }

    public Map<String, Object> login(Map<String, Object> payload) {
        return userService.login(payload);
    }

    public Map<String, Object> checkout(Map<String, Object> payload) {
        return transactionService.checkout(payload);
    }
}
