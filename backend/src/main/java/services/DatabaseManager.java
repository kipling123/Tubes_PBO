package services;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseManager {
    private static DatabaseManager instance;
    private static final String DB_NAME = "tubes_pbo";
    private static final String BASE_URL = "jdbc:mysql://localhost:3306/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String DB_URL = "jdbc:mysql://localhost:3306/" + DB_NAME + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASSWORD = "";
    
    private boolean offline = false;

    private DatabaseManager() {
        initDriver();
        testConnection();
    }

    public static synchronized DatabaseManager getInstance() {
        if (instance == null) {
            instance = new DatabaseManager();
        }
        return instance;
    }

    private void initDriver() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            offline = true;
        }
    }

    private void testConnection() {
        try (Connection conn = DriverManager.getConnection(BASE_URL, USER, PASSWORD)) {
            offline = false;
        } catch (SQLException e) {
            System.out.println("[WARNING] Gagal terhubung ke MySQL di localhost:3306.");
            System.out.println("[WARNING] Server akan berjalan dalam Mode Offline (In-Memory).");
            offline = true;
        }
    }

    public boolean isOffline() {
        return offline;
    }

    public Connection getConnection() throws SQLException {
        if (offline) {
            throw new SQLException("Database is in offline mode");
        }
        return DriverManager.getConnection(DB_URL, USER, PASSWORD);
    }

    public Connection getBaseConnection() throws SQLException {
        if (offline) {
            throw new SQLException("Database is in offline mode");
        }
        return DriverManager.getConnection(BASE_URL, USER, PASSWORD);
    }

    public String getDbName() {
        return DB_NAME;
    }
}
