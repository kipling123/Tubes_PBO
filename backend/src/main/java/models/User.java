package models;

import java.util.LinkedHashMap;
import java.util.Map;

public class User {
    private final String id;
    private final String name;
    private final String email;
    private final String password;
    private final String role;

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

    public Map<String, Object> toMap() {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("id", id);
        result.put("name", name);
        result.put("email", email);
        result.put("role", role);
        return result;
    }
}
