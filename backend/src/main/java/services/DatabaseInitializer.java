package services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

public class DatabaseInitializer {
    private static final Pattern BLOCK_COMMENT = Pattern.compile("/\\*[^!][\\s\\S]*?\\*/");
    private static final Pattern MYSQL_VERSION_COMMENT = Pattern.compile("/\\*!\\d+\\s([\\s\\S]*?)\\*/");

    private final DatabaseManager dbManager = DatabaseManager.getInstance();

    public void initialize() {
        if (dbManager.isOffline()) {
            return;
        }

        try {
            createDatabaseIfNotExists();
            if (isSchemaInitialized()) {
                System.out.println("[INFO] Database '" + dbManager.getDbName() + "' sudah terhubung.");
                return;
            }

            runSqlScript(resolveSqlFile());
            System.out.println("[INFO] Database '" + dbManager.getDbName() + "' berhasil diinisialisasi dari DB_PBO.sql");
        } catch (SQLException | IOException e) {
            throw new RuntimeException("Gagal menginisialisasi database", e);
        }
    }

    private void createDatabaseIfNotExists() throws SQLException {
        try (Connection connection = dbManager.getBaseConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE DATABASE IF NOT EXISTS " + dbManager.getDbName());
        }
    }

    private boolean isSchemaInitialized() throws SQLException {
        try (Connection connection = dbManager.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(
                     "SELECT COUNT(*) FROM information_schema.tables " +
                     "WHERE table_schema = '" + dbManager.getDbName() + "' AND table_name = 'users'")) {
            resultSet.next();
            return resultSet.getInt(1) > 0;
        }
    }

    private Path resolveSqlFile() throws IOException {
        Path relativePath = Paths.get("database", "DB_PBO.sql");
        if (Files.exists(relativePath)) {
            return relativePath;
        }

        Path backendPath = Paths.get("backend", "database", "DB_PBO.sql");
        if (Files.exists(backendPath)) {
            return backendPath;
        }

        throw new IOException("File SQL tidak ditemukan. Pastikan database/DB_PBO.sql ada di folder backend.");
    }

    private void runSqlScript(Path sqlPath) throws SQLException, IOException {
        byte[] bytes = Files.readAllBytes(sqlPath);
        String content = new String(bytes, StandardCharsets.UTF_8);
        List<String> statements = parseStatements(content);

        try (Connection connection = dbManager.getConnection();
             Statement statement = connection.createStatement()) {
            for (String sql : statements) {
                statement.execute(sql);
            }
        }
    }

    private List<String> parseStatements(String content) {
        content = MYSQL_VERSION_COMMENT.matcher(content).replaceAll("$1");
        content = BLOCK_COMMENT.matcher(content).replaceAll("");

        StringBuilder cleaned = new StringBuilder();
        for (String line : content.split("\\R")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("--") || trimmed.isEmpty()) {
                continue;
            }
            cleaned.append(line).append('\n');
        }

        List<String> statements = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (char character : cleaned.toString().toCharArray()) {
            if (character == ';') {
                String sql = current.toString().trim();
                if (shouldExecute(sql)) {
                    statements.add(sql);
                }
                current.setLength(0);
            } else {
                current.append(character);
            }
        }
        return statements;
    }

    private boolean shouldExecute(String sql) {
        if (sql.isEmpty()) {
            return false;
        }

        String normalized = sql.toLowerCase(Locale.ROOT);
        return !normalized.equals("start transaction")
                && !normalized.equals("commit")
                && !normalized.startsWith("set @old_")
                && !normalized.startsWith("set character_set_client")
                && !normalized.startsWith("set character_set_results")
                && !normalized.startsWith("set collation_connection");
    }
}
