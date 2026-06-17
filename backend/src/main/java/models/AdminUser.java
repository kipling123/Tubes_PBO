package models;

public class AdminUser extends User {
    public AdminUser(String id, String name, String email, String password) {
        super(id, name, email, password, "admin");
    }

    @Override
    public boolean hasAccess(String path, String method) {
        // Admin can manage products (CRUD), manage users, and view members.
        if (path.startsWith("/api/products")) {
            return true;
        }
        if (path.startsWith("/api/members")) {
            return true;
        }
        if (path.startsWith("/api/users")) {
            return true;
        }
        return false;
    }
}
