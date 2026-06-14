package services;

import java.util.List;
import java.util.Map;

import models.Member;
import models.Product;
import models.User;

public class StoreService {
    private final UserService userService = new UserService();
    private final ProductService productService = new ProductService();
    private final MemberService memberService = new MemberService();
    private final TransactionService transactionService = new TransactionService(productService, memberService);

    public StoreService() {
        new DatabaseInitializer().initialize();
    }

    // Delegasi Facade
    public List<Map<String, Object>> getProducts() {
        return productService.getProducts();
    }

    public Product addProduct(Map<String, Object> payload) {
        return productService.addProduct(payload);
    }

    public Product updateProduct(Map<String, Object> payload) {
        return productService.updateProduct(payload);
    }

    public boolean deleteProduct(String productId) {
        return productService.deleteProduct(productId);
    }

    public List<Map<String, Object>> getMembers() {
        return memberService.getMembers();
    }

    public Member addMember(Map<String, Object> payload) {
        return memberService.addMember(payload);
    }

    public Member updateMember(Map<String, Object> payload) {
        return memberService.updateMember(payload);
    }

    public boolean deleteMember(String memberId) {
        return memberService.deleteMember(memberId);
    }

    public List<Map<String, Object>> getUsers() {
        return userService.getUsers();
    }

    public User addUser(Map<String, Object> payload) {
        return userService.addUser(payload);
    }

    public Map<String, Object> login(Map<String, Object> payload) {
        return userService.login(payload);
    }

    public Map<String, Object> checkout(Map<String, Object> payload) {
        return transactionService.checkout(payload);
    }
}
