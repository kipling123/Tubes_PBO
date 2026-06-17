package models;

import java.util.LinkedHashMap;
import java.util.Map;

public class Member {
    private final String id;
    private final String name;
    private final String email;
    private final int points;

    public Member(String id, String name, String email, int points) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.points = points;
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

    public int getPoints() {
        return points;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> data = new LinkedHashMap<String, Object>();
        data.put("id", id);
        data.put("name", name);
        data.put("email", email);
        data.put("points", points);
        return data;
    }
}
