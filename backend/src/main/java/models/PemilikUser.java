package models;

public class PemilikUser extends User {
    public PemilikUser(String id, String name, String email, String password) {
        super(id, name, email, password, "pemilik");
    }

    @Override
    public boolean hasAccess(String path, String method) {
        // Owner has access to read all data (GET products, members, users).
        if ("GET".equals(method)) {
            if (path.equals("/api/products") || path.equals("/api/members") || path.equals("/api/users")) {
                return true;
            }
        }
        return false;
    }
}
