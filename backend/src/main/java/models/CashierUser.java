package models;

public class CashierUser extends User {
    public CashierUser(String id, String name, String email, String password) {
        super(id, name, email, password, "kasir");
    }

    @Override
    public boolean hasAccess(String path, String method) {
        // Cashier can read products, read & write members, and perform checkout.
        if (path.equals("/api/products") && "GET".equals(method)) {
            return true;
        }
        if (path.startsWith("/api/members")) {
            return true;
        }
        if (path.equals("/api/checkout") && "POST".equals(method)) {
            return true;
        }
        return false;
    }
}
