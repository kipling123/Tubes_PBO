package models;

public class UserFactory {
    public static User createUser(String id, String name, String email, String password, String role) {
        if (role == null) {
            return new CashierUser(id, name, email, password);
        }
        switch (role.trim().toLowerCase()) {
            case "pemilik":
                return new PemilikUser(id, name, email, password);
            case "admin":
                return new AdminUser(id, name, email, password);
            case "kasir":
            default:
                return new CashierUser(id, name, email, password);
        }
    }
}
