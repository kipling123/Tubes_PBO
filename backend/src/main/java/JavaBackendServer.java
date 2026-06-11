import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import models.Member;
import models.Product;
import models.User;
import services.StoreService;

public class JavaBackendServer {
    private final StoreService storeService = new StoreService();

    public static void main(String[] args) throws Exception {
        JavaBackendServer server = new JavaBackendServer();
        server.start(3000);
    }

    public void start(int port) throws Exception {
        HttpServer httpServer = HttpServer.create(new InetSocketAddress(port), 0);
        httpServer.createContext("/", this::handleRoot);
        httpServer.createContext("/api", this::handleApi);
        httpServer.setExecutor(null);
        httpServer.start();
        System.out.println("Java backend running on http://localhost:" + port + "/api");
    }

    private void handleRoot(HttpExchange exchange) throws IOException {
        respondJson(exchange, "Backend Java berjalan");
    }

    private void handleApi(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);

        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if ("/api/products".equals(path)) {
            if ("GET".equals(method)) {
                respondJson(exchange, storeService.getProducts());
            } else if ("POST".equals(method)) {
                handleCreateProduct(exchange);
            }
            return;
        }

        if (path != null && path.startsWith("/api/products/")) {
            String productId = path.substring("/api/products/".length());
            if ("PUT".equals(method)) {
                handleUpdateProduct(exchange, productId);
            } else if ("DELETE".equals(method)) {
                handleDeleteProduct(exchange, productId);
            }
            return;
        }

        if ("/api/members".equals(path)) {
            if ("GET".equals(method)) {
                respondJson(exchange, storeService.getMembers());
            } else if ("POST".equals(method)) {
                handleCreateMember(exchange);
            }
            return;
        }

        if ("/api/users".equals(path)) {
            if ("GET".equals(method)) {
                handleGetUsers(exchange);
            } else if ("POST".equals(method)) {
                handleCreateUser(exchange);
            }
            return;
        }

        if ("/api/auth/login".equals(path) && "POST".equals(method)) {
            handleLogin(exchange);
            return;
        }

        if (path != null && path.startsWith("/api/members/")) {
            String memberId = path.substring("/api/members/".length());
            if ("PUT".equals(method)) {
                handleUpdateMember(exchange, memberId);
            } else if ("DELETE".equals(method)) {
                handleDeleteMember(exchange, memberId);
            }
            return;
        }

        if ("/api/checkout".equals(path) && "POST".equals(method)) {
            handleCheckout(exchange);
            return;
        }

        respondJson(exchange, Collections.singletonMap("message", "Not found"), 404);
    }

    private void handleCreateProduct(HttpExchange exchange) throws IOException {
        try {
            Map<String, Object> payload = parseJsonObject(readBody(exchange));
            if (!isAllowedRole(exchange, payload)) {
                respondJson(exchange, Collections.singletonMap("message", "Akses ditolak. Hanya kasir dan admin yang bisa mengubah data."), 403);
                return;
            }

            Product product = storeService.addProduct(payload);

            Map<String, Object> response = new LinkedHashMap<String, Object>();
            response.put("message", "Produk berhasil ditambahkan");
            response.put("product", product.toMap());
            respondJson(exchange, response, 201);
        } catch (RuntimeException e) {
            respondJson(exchange, Collections.singletonMap("message", e.getMessage()), 500);
        }
    }

    private void handleUpdateProduct(HttpExchange exchange, String productId) throws IOException {
        try {
            Map<String, Object> payload = parseJsonObject(readBody(exchange));
            payload.put("id", productId);
            if (!isAllowedRole(exchange, payload)) {
                respondJson(exchange, Collections.singletonMap("message", "Akses ditolak. Hanya kasir dan admin yang bisa mengubah data."), 403);
                return;
            }

            Product product = storeService.updateProduct(payload);
            Map<String, Object> response = new LinkedHashMap<String, Object>();
            response.put("message", "Produk berhasil diperbarui");
            response.put("product", product.toMap());
            respondJson(exchange, response, 200);
        } catch (RuntimeException e) {
            respondJson(exchange, Collections.singletonMap("message", e.getMessage()), 500);
        }
    }

    private void handleDeleteProduct(HttpExchange exchange, String productId) throws IOException {
        try {
            Map<String, Object> payload = new LinkedHashMap<String, Object>();
            payload.put("id", productId);
            if (!isAllowedRole(exchange, payload)) {
                respondJson(exchange, Collections.singletonMap("message", "Akses ditolak. Hanya kasir dan admin yang bisa mengubah data."), 403);
                return;
            }

            boolean deleted = storeService.deleteProduct(productId);
            Map<String, Object> response = new LinkedHashMap<String, Object>();
            response.put("message", deleted ? "Produk berhasil dihapus" : "Produk tidak ditemukan");
            response.put("deleted", deleted);
            respondJson(exchange, response, 200);
        } catch (RuntimeException e) {
            respondJson(exchange, Collections.singletonMap("message", e.getMessage()), 500);
        }
    }

    private void handleCreateMember(HttpExchange exchange) throws IOException {
        try {
            Map<String, Object> payload = parseJsonObject(readBody(exchange));
            if (!isAllowedRole(exchange, payload)) {
                respondJson(exchange, Collections.singletonMap("message", "Akses ditolak. Hanya kasir dan admin yang bisa mengubah data."), 403);
                return;
            }

            Member member = storeService.addMember(payload);

            Map<String, Object> response = new LinkedHashMap<String, Object>();
            response.put("message", "Member berhasil ditambahkan");
            response.put("member", member.toMap());
            respondJson(exchange, response, 201);
        } catch (RuntimeException e) {
            respondJson(exchange, Collections.singletonMap("message", e.getMessage()), 500);
        }
    }

    private void handleGetUsers(HttpExchange exchange) throws IOException {
        try {
            if (!isAdmin(exchange, null)) {
                respondJson(exchange, Collections.singletonMap("message", "Akses ditolak. Hanya admin yang bisa melihat data pengguna."), 403);
                return;
            }
            respondJson(exchange, storeService.getUsers());
        } catch (RuntimeException e) {
            respondJson(exchange, Collections.singletonMap("message", e.getMessage()), 500);
        }
    }

    private void handleCreateUser(HttpExchange exchange) throws IOException {
        try {
            Map<String, Object> payload = parseJsonObject(readBody(exchange));
            if (!isAdmin(exchange, payload)) {
                respondJson(exchange, Collections.singletonMap("message", "Akses ditolak. Hanya admin yang bisa membuat akun pengguna."), 403);
                return;
            }

            User user = storeService.addUser(payload);
            Map<String, Object> response = new LinkedHashMap<String, Object>();
            response.put("message", "Akun pengguna berhasil dibuat");
            response.put("user", user.toMap());
            respondJson(exchange, response, 201);
        } catch (RuntimeException e) {
            respondJson(exchange, Collections.singletonMap("message", e.getMessage()), 500);
        }
    }

    private void handleLogin(HttpExchange exchange) throws IOException {
        try {
            Map<String, Object> payload = parseJsonObject(readBody(exchange));
            Map<String, Object> result = storeService.login(payload);
            boolean success = Boolean.TRUE.equals(result.get("success"));
            respondJson(exchange, result, success ? 200 : 401);
        } catch (RuntimeException e) {
            respondJson(exchange, Collections.singletonMap("message", e.getMessage()), 500);
        }
    }

    private void handleUpdateMember(HttpExchange exchange, String memberId) throws IOException {
        try {
            Map<String, Object> payload = parseJsonObject(readBody(exchange));
            payload.put("id", memberId);
            if (!isAllowedRole(exchange, payload)) {
                respondJson(exchange, Collections.singletonMap("message", "Akses ditolak. Hanya kasir dan admin yang bisa mengubah data."), 403);
                return;
            }

            Member member = storeService.updateMember(payload);
            Map<String, Object> response = new LinkedHashMap<String, Object>();
            response.put("message", "Member berhasil diperbarui");
            response.put("member", member.toMap());
            respondJson(exchange, response, 200);
        } catch (RuntimeException e) {
            respondJson(exchange, Collections.singletonMap("message", e.getMessage()), 500);
        }
    }

    private void handleDeleteMember(HttpExchange exchange, String memberId) throws IOException {
        try {
            Map<String, Object> payload = new LinkedHashMap<String, Object>();
            payload.put("id", memberId);
            if (!isAllowedRole(exchange, payload)) {
                respondJson(exchange, Collections.singletonMap("message", "Akses ditolak. Hanya kasir dan admin yang bisa mengubah data."), 403);
                return;
            }

            boolean deleted = storeService.deleteMember(memberId);
            Map<String, Object> response = new LinkedHashMap<String, Object>();
            response.put("message", deleted ? "Member berhasil dihapus" : "Member tidak ditemukan");
            response.put("deleted", deleted);
            respondJson(exchange, response, 200);
        } catch (RuntimeException e) {
            respondJson(exchange, Collections.singletonMap("message", e.getMessage()), 500);
        }
    }

    private void handleCheckout(HttpExchange exchange) throws IOException {
        Map<String, Object> payload = parseJsonObject(readBody(exchange));
        respondJson(exchange, storeService.checkout(payload));
    }

    private String readBody(HttpExchange exchange) throws IOException {
        InputStream inputStream = exchange.getRequestBody();
        byte[] buffer = new byte[1024 * 8];
        int read;
        StringBuilder builder = new StringBuilder();
        while ((read = inputStream.read(buffer)) != -1) {
            builder.append(new String(buffer, 0, read, StandardCharsets.UTF_8));
        }
        return builder.toString();
    }

    private void respondJson(HttpExchange exchange, Object body) throws IOException {
        respondJson(exchange, body, 200);
    }

    private void respondJson(HttpExchange exchange, Object body, int statusCode) throws IOException {
        byte[] responseBytes = toJson(body).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(statusCode, responseBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseBytes);
        }
    }

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, X-Role");
    }

    private boolean isAllowedRole(HttpExchange exchange, Map<String, Object> payload) {
        String role = resolveRole(exchange, payload);
        if (role == null) {
            return false;
        }

        String normalizedRole = role.toLowerCase();
        return "kasir".equals(normalizedRole) || "admin".equals(normalizedRole);
    }

    private boolean isAdmin(HttpExchange exchange, Map<String, Object> payload) {
        String role = resolveRole(exchange, payload);
        return role != null && "admin".equals(role.toLowerCase());
    }

    private String resolveRole(HttpExchange exchange, Map<String, Object> payload) {
        String role = exchange.getRequestHeaders().getFirst("X-Role");
        if (role == null) {
            role = exchange.getRequestHeaders().getFirst("x-role");
        }
        if (role == null && payload != null) {
            role = getStringValue(payload.get("role"));
            if (role == null) {
                role = getStringValue(payload.get("userRole"));
            }
        }
        return role;
    }

    private String getStringValue(Object value) {
        if (value == null) {
            return null;
        }
        return value.toString();
    }

    private String toJson(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof String) {
            return '"' + escapeJson((String) value) + '"';
        }
        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }
        if (value instanceof Map) {
            StringBuilder builder = new StringBuilder();
            builder.append('{');
            boolean first = true;
            for (Object key : ((Map<?, ?>) value).keySet()) {
                if (!first) {
                    builder.append(',');
                }
                builder.append(toJson(String.valueOf(key))).append(':').append(toJson(((Map<?, ?>) value).get(key)));
                first = false;
            }
            builder.append('}');
            return builder.toString();
        }
        if (value instanceof Iterable) {
            StringBuilder builder = new StringBuilder();
            builder.append('[');
            boolean first = true;
            for (Object item : (Iterable<?>) value) {
                if (!first) {
                    builder.append(',');
                }
                builder.append(toJson(item));
                first = false;
            }
            builder.append(']');
            return builder.toString();
        }
        return '"' + escapeJson(String.valueOf(value)) + '"';
    }

    private String escapeJson(String input) {
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private Map<String, Object> parseJsonObject(String body) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        Pattern pattern = Pattern.compile("\\\"([^\\\"]+)\\\"\\s*:\\s*(\\\"([^\\\"]*)\\\"|(-?\\d+(?:\\.\\d+)?|true|false|null))");
        Matcher matcher = pattern.matcher(body);
        while (matcher.find()) {
            String key = matcher.group(1);
            String rawValue = matcher.group(2);
            if (rawValue.startsWith("\"")) {
                result.put(key, rawValue.substring(1, rawValue.length() - 1));
            } else if ("true".equals(rawValue)) {
                result.put(key, Boolean.TRUE);
            } else if ("false".equals(rawValue)) {
                result.put(key, Boolean.FALSE);
            } else if ("null".equals(rawValue)) {
                result.put(key, null);
            } else {
                if (rawValue.contains(".")) {
                    result.put(key, Double.parseDouble(rawValue));
                } else {
                    result.put(key, Long.parseLong(rawValue));
                }
            }
        }
        return result;
    }
}
