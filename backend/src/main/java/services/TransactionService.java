package services;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TransactionService {
    private final DatabaseManager dbManager = DatabaseManager.getInstance();
    private final ProductService productService;
    private final MemberService memberService;

    public TransactionService(ProductService productService, MemberService memberService) {
        this.productService = productService;
        this.memberService = memberService;
    }

    public Map<String, Object> checkout(Map<String, Object> payload) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        String trxId = payload.get("trx_id") == null ? "" : payload.get("trx_id").toString();
        String memberId = payload.get("member_id") == null ? null : payload.get("member_id").toString();
        int subtotal = parseInt(payload.get("subtotal"), 0);
        int discount = parseInt(payload.get("discount"), 0);
        int ppn = parseInt(payload.get("ppn"), 0);
        int total = parseInt(payload.get("total"), 0);

        if (dbManager.isOffline()) {
            String rawBody = payload.get("raw_body") == null ? "" : payload.get("raw_body").toString();
            if (!rawBody.isEmpty()) {
                Pattern itemsPattern = Pattern.compile("\"items\"\\s*:\\s*\\[(.*?)\\]");
                Matcher itemsMatcher = itemsPattern.matcher(rawBody);
                if (itemsMatcher.find()) {
                    String itemsContent = itemsMatcher.group(1);
                    Pattern itemPattern = Pattern.compile("\\{(.*?)\\}");
                    Matcher itemMatcher = itemPattern.matcher(itemsContent);
                    while (itemMatcher.find()) {
                        String itemObj = itemMatcher.group(1);
                        Map<String, Object> itemMap = parseJsonObject("{" + itemObj + "}");
                        String productId = itemMap.get("product_id") == null ? "" : itemMap.get("product_id").toString();
                        int quantity = parseInt(itemMap.get("quantity"), 0);

                        if (!productId.isEmpty() && quantity > 0) {
                            for (Map<String, Object> p : productService.getProducts()) {
                                if (productId.equalsIgnoreCase((String) p.get("id"))) {
                                    int oldStock = parseInt(p.get("stock"), 0);
                                    p.put("stock", Math.max(0, oldStock - quantity));
                                    productService.updateProduct(p);
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            if (memberId != null && !memberId.isEmpty()) {
                int earnedPoints = (subtotal - discount) / 10000;
                if (earnedPoints > 0) {
                    for (Map<String, Object> m : memberService.getMembers()) {
                        if (memberId.equalsIgnoreCase((String) m.get("id"))) {
                            int oldPoints = parseInt(m.get("points"), 0);
                            m.put("points", oldPoints + earnedPoints);
                            memberService.updateMember(m);
                            break;
                        }
                    }
                }
            }

            result.put("message", "Checkout berhasil (Offline Mode)");
            result.put("trx_id", trxId);
            result.put("total", total);
            return result;
        }

        try (Connection connection = dbManager.getConnection()) {
            connection.setAutoCommit(false);
            try {
                // 1. Insert into transactions
                try (PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO transactions (trx_id, member_id, subtotal, discount, ppn, total) VALUES (?, ?, ?, ?, ?, ?)")) {
                    statement.setString(1, trxId);
                    if (memberId == null || memberId.isEmpty()) {
                        statement.setNull(2, java.sql.Types.VARCHAR);
                    } else {
                        statement.setString(2, memberId);
                    }
                    statement.setInt(3, subtotal);
                    statement.setInt(4, discount);
                    statement.setInt(5, ppn);
                    statement.setInt(6, total);
                    statement.executeUpdate();
                }

                // 2. Parse and Insert into transaction_details, and decrement stock
                String rawBody = payload.get("raw_body") == null ? "" : payload.get("raw_body").toString();
                if (!rawBody.isEmpty()) {
                    Pattern itemsPattern = Pattern.compile("\"items\"\\s*:\\s*\\[(.*?)\\]");
                    Matcher itemsMatcher = itemsPattern.matcher(rawBody);
                    if (itemsMatcher.find()) {
                        String itemsContent = itemsMatcher.group(1);
                        Pattern itemPattern = Pattern.compile("\\{(.*?)\\}");
                        Matcher itemMatcher = itemPattern.matcher(itemsContent);
                        while (itemMatcher.find()) {
                            String itemObj = itemMatcher.group(1);
                            Map<String, Object> itemMap = parseJsonObject("{" + itemObj + "}");
                            String productId = itemMap.get("product_id") == null ? "" : itemMap.get("product_id").toString();
                            int quantity = parseInt(itemMap.get("quantity"), 0);
                            int price = parseInt(itemMap.get("price"), 0);

                            if (!productId.isEmpty() && quantity > 0) {
                                // Insert detail
                                try (PreparedStatement detailStatement = connection.prepareStatement(
                                        "INSERT INTO transaction_details (trx_id, product_id, quantity, price) VALUES (?, ?, ?, ?)")) {
                                    detailStatement.setString(1, trxId);
                                    detailStatement.setString(2, productId);
                                    detailStatement.setInt(3, quantity);
                                    detailStatement.setInt(4, price);
                                    detailStatement.executeUpdate();
                                }

                                // Decrement stock
                                try (PreparedStatement updateStockStatement = connection.prepareStatement(
                                        "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?")) {
                                    updateStockStatement.setInt(1, quantity);
                                    updateStockStatement.setString(2, productId);
                                    updateStockStatement.executeUpdate();
                                }
                            }
                        }
                    }
                }

                // 3. Increment Member Points
                if (memberId != null && !memberId.isEmpty()) {
                    int earnedPoints = (subtotal - discount) / 10000;
                    if (earnedPoints > 0) {
                        try (PreparedStatement updateMemberStatement = connection.prepareStatement(
                                "UPDATE members SET points = points + ? WHERE id = ?")) {
                            updateMemberStatement.setInt(1, earnedPoints);
                            updateMemberStatement.setString(2, memberId);
                            updateMemberStatement.executeUpdate();
                        }
                    }
                }

                connection.commit();
            } catch (SQLException e) {
                connection.rollback();
                throw e;
            } finally {
                connection.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Gagal mencatat checkout: " + e.getMessage(), e);
        }

        result.put("message", "Checkout berhasil");
        result.put("trx_id", trxId);
        result.put("total", total);
        return result;
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
