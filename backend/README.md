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

Akun default dari `database/DB_PBO.sql`:

- Admin: admin@store.com / admin123
- Kasir: kasir@store.com / kasir123

## Database

Database yang dipakai:

```text
tubes_pbo
```

File schema dan seed data:

```text
backend/database/DB_PBO.sql
```

Saat backend pertama kali dijalankan, file SQL di atas otomatis diimpor jika tabel belum ada. Untuk import manual (misalnya reset database):

```powershell
cd backend\database
setup-db.bat
```

Atau lewat MySQL CLI:

```powershell
mysql -u root -e "CREATE DATABASE IF NOT EXISTS tubes_pbo;"
mysql -u root tubes_pbo < backend\database\DB_PBO.sql
```

Konfigurasi koneksi ada di `src/main/java/services/DatabaseManager.java`:

- Host: localhost:3306
- User: root
- Password: (kosong, default XAMPP)

Tabel utama:

- products
- members
- users
- transactions
- transaction_details
