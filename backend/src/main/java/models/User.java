package models;

import java.util.LinkedHashMap;
import java.util.Map;

public abstract class User {
    protected final String id;
    protected final String name;
    protected final String email;
    protected final String password;
    protected final String role;

    public User(String id, String name, String email, String password, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getRole() {
        return role;
    }

    public abstract boolean hasAccess(String path, String method);

    public Map<String, Object> toMap() {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("id", id);
        result.put("name", name);
        result.put("email", email);
        result.put("role", role);
        return result;
    }
}
