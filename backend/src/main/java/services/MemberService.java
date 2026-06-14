package services;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import models.Member;

public class MemberService {
    private final DatabaseManager dbManager = DatabaseManager.getInstance();
    private final List<Member> offlineMembers = new ArrayList<>();

    public MemberService() {
        offlineMembers.add(new Member("PEL-001", "Nazmi Rio Rabani", "nazmi@student.telkom.ac.id", 2450));
        offlineMembers.add(new Member("PEL-002", "Rafi Ikbar Fahrezy", "rafi@student.telkom.ac.id", 850));
    }

    public List<Map<String, Object>> getMembers() {
        if (dbManager.isOffline()) {
            List<Map<String, Object>> result = new ArrayList<>();
            for (Member m : offlineMembers) {
                result.add(m.toMap());
            }
            return result;
        }

        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        String sql = "SELECT id, name, email, points FROM members ORDER BY id";

        try (Connection connection = dbManager.getConnection();
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

        if (dbManager.isOffline()) {
            offlineMembers.add(member);
            return member;
        }

        String sql = "INSERT INTO members (id, name, email, points) VALUES (?, ?, ?, ?)";
        try (Connection connection = dbManager.getConnection();
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

    public Member updateMember(Map<String, Object> payload) {
        String id = payload.get("id") == null ? null : payload.get("id").toString();
        Member member = buildMember(payload, id);

        if (dbManager.isOffline()) {
            for (int i = 0; i < offlineMembers.size(); i++) {
                if (offlineMembers.get(i).getId().equalsIgnoreCase(id)) {
                    offlineMembers.set(i, member);
                    return member;
                }
            }
            offlineMembers.add(member);
            return member;
        }

        String sql = "UPDATE members SET name = ?, email = ?, points = ? WHERE id = ?";
        try (Connection connection = dbManager.getConnection();
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
        if (dbManager.isOffline()) {
            return offlineMembers.removeIf(m -> m.getId().equalsIgnoreCase(memberId));
        }

        String sql = "DELETE FROM members WHERE id = ?";
        try (Connection connection = dbManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, memberId);
            return statement.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException("Gagal menghapus member: " + e.getMessage(), e);
        }
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
