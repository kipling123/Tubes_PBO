package services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import models.User;
import models.UserFactory;

public class UserService {
    private final DatabaseManager dbManager = DatabaseManager.getInstance();
    private final List<User> offlineUsers = new ArrayList<>();

    public UserService() {
        offlineUsers.add(UserFactory.createUser("USR-OWNER", "Pemilik Toko", "owner@toko.com", hashPassword("owner123"), "pemilik"));
        offlineUsers.add(UserFactory.createUser("USR-ADMIN", "Administrator", "admin@toko.com", hashPassword("admin123"), "admin"));
        offlineUsers.add(UserFactory.createUser("USR-CASHIER", "Kasir", "kasir@toko.com", hashPassword("kasir123"), "kasir"));
    }

    public List<Map<String, Object>> getUsers() {
        if (dbManager.isOffline()) {
            List<Map<String, Object>> result = new ArrayList<>();
            for (User u : offlineUsers) {
                result.add(u.toMap());
            }
            return result;
        }

        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        String sql = "SELECT id, name, email, role FROM users ORDER BY id";

        try (Connection connection = dbManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                User user = UserFactory.createUser(
                        resultSet.getString("id"),
                        resultSet.getString("name"),
                        resultSet.getString("email"),
                        "",
                        resultSet.getString("role")
                );
                result.add(user.toMap());
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

        User user = UserFactory.createUser(id, name, email, hashPassword(password), role);

        if (dbManager.isOffline()) {
            for (User u : offlineUsers) {
                if (u.getEmail().equalsIgnoreCase(email)) {
                    throw new RuntimeException("Email sudah terdaftar (Offline Mode)");
                }
            }
            offlineUsers.add(user);
            return user;
        }

        String sql = "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)";
        try (Connection connection = dbManager.getConnection();
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

        if (dbManager.isOffline()) {
            for (User u : offlineUsers) {
                if (u.getEmail().equalsIgnoreCase(email)) {
                    if (hashPassword(password).equals(u.getPassword())) {
                        Map<String, Object> result = new LinkedHashMap<>();
                        result.put("success", true);
                        result.put("message", "Login berhasil (Offline Mode)");
                        result.put("user", u.toMap());
                        return result;
                    }
                }
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", false);
            result.put("message", "Email atau password salah");
            return result;
        }

        String sql = "SELECT id, name, email, password, role FROM users WHERE email = ?";
        try (Connection connection = dbManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    String storedHash = resultSet.getString("password");
                    if (hashPassword(password).equals(storedHash)) {
                        User user = UserFactory.createUser(
                                resultSet.getString("id"),
                                resultSet.getString("name"),
                                resultSet.getString("email"),
                                "",
                                resultSet.getString("role")
                        );
                        Map<String, Object> result = new LinkedHashMap<String, Object>();
                        result.put("success", true);
                        result.put("message", "Login berhasil");
                        result.put("user", user.toMap());
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

    public String hashPassword(String password) {
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

    private String normalizeRole(String role) {
        if (role == null) {
            return "kasir";
        }
        String normalized = role.trim().toLowerCase();
        if ("admin".equals(normalized)) {
            return "admin";
        } else if ("pemilik".equals(normalized)) {
            return "pemilik";
        } else {
            return "kasir";
        }
    }
}
