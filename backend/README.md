# Backend Java

Backend ini dibuat dengan Java dan terhubung ke MySQL. Server berjalan di port 3000.

## Struktur folder

- src/main/java/JavaBackendServer.java: entry point server HTTP
- src/main/java/models/Product.java: model data produk
- src/main/java/models/Member.java: model data member
- src/main/java/models/User.java: model data akun pengguna dan role
- src/main/java/services/StoreService.java: logika CRUD, login, checkout, dan koneksi database
- lib/: library MySQL JDBC
- build/classes/: hasil kompilasi Java

## Jalankan backend

Dari folder project root:

```powershell
npm run be
```

Atau dari folder backend:

```powershell
run.bat
```

Backend akan berjalan di:

```text
http://localhost:3000/api
```

## Endpoint utama

- GET /api/products
- POST /api/products
- PUT /api/products/{id}
- DELETE /api/products/{id}
- GET /api/members
- POST /api/members
- POST /api/auth/login
- GET /api/users
- POST /api/users
- POST /api/checkout

## Akun contoh

Akun default yang tersedia setelah backend pertama kali berjalan:

- Email: admin@store.com
- Password: admin123

## Database

Database yang dipakai adalah:

```text
tubes_pbo
```

Tabel utama:

- products
- members
- users
- transactions
- transaction_details
