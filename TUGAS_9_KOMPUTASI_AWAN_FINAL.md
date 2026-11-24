# CAK3EAB3 KOMPUTASI AWAN DAN TERDISTRIBUSI
## Tugas-9: Perancangan Aplikasi Web Cloud, Skalabilitas, dan Load Balancing
**Kelompok**: Kelompok 2  
**Kelas**: IF-XX-XX  
**Dosen**: Dosen Pengampu Komputasi Awan  
**Program Studi**: S1 Informatika  
**Fakultas**: Fakultas Informatika  
**Universitas**: Universitas Telkom Bandung  
**Tahun**: 2026  

---

### PERNYATAAN
Saya menyatakan bahwa saya:
(a) benar-benar ikut mengerjakan soal  
(b) telah menjelaskan jawaban saya ke teman anggota kelompok  
(c) telah memahami penjelasan dari teman anggota kelompok  
(d) tidak mencontek jawaban dari kelompok lain  
(e) tidak memberikan jawaban PR ini ke kelompok lain  

| Nama Anggota | NIM | Kontribusi Tugas | Tanda Tangan |
| :--- | :--- | :--- | :--- |
| **Rafi Ikbar Fahrezy** | 130122XXXX | Backend Django Architecture, Cloud Design, CRUD Entities | [Tanda Tangan] |
| **Anggota Kelompok 2** | 130122XXXX | Frontend React POS, Wireframe, UI Components | [Tanda Tangan] |
| **Anggota Kelompok 3** | 130122XXXX | Use Case Diagram, Scalability Analysis, Testing | [Tanda Tangan] |
| **Anggota Kelompok 4** | 130122XXXX | Load Balancing Algorithms & Technical Documentation | [Tanda Tangan] |

---

## Soal 1. Akun AWS (10 poin) - ONSITE

Screenshot akun AWS Management Console yang telah dibuat untuk implementasi praktikum komputasi awan:

| Screenshot AWS Management Console |
| :--- |
| `[Tempel Screenshot Halaman Akun AWS / AWS Management Console (Account ID & Region: us-east-1 / ap-southeast-1) di sini]` |

---

## Soal 2. Aplikasi Web (45 poin) - IA 2 (ONSITE)

### a. Masalah yang Ingin Diselesaikan
Pengelolaan transaksi kasir (*Point of Sale*) pada toko kelontong, minimarket, dan UMKM ritel mandiri umumnya masih mengandalkan pencatatan nota fisik manual atau aplikasi kasir lokal (*desktop-based offline*) yang rentan terhadap resiko *single point of failure*, kehilangan arsip transaksi, dan ketidaksesuaian jumlah stok barang (*human error*). Selain itu, sistem pencatatan konvensional mempersulit integrasi program loyalitas pelanggan (*membership discount*), perhitungan pajak pertambahan nilai (PPN 1%) yang akurat, serta membatasi visibilitas pemilik toko (*owner*) yang ingin memantau omzet harian secara *real-time* dari jarak jauh.

Masalah ini sangat penting untuk diselesaikan karena kecepatan dan akurasi layanan di meja kasir berpengaruh langsung terhadap kepuasan pelanggan serta keberlangsungan arus kas (*cashflow*) bisnis ritel. Ketidaksinkronan stok barang dapat mengakibatkan kehabisan stok (*stockout*) tanpa diketahui, atau sebaliknya penumpukan barang yang memicu kerugian modal. Untuk mengatasi permasalahan tersebut, kami membangun aplikasi web **"Toko Maju POS"** yang mengusung arsitektur komputasi awan terdistribusi (*distributed cloud web application*). Sistem ini mengintegrasikan antarmuka modern berbasis **React + Vite** di sisi klien dengan backend berbasis **Django REST Framework** yang ringan. Sesuai dengan batasan pedoman tugas, sistem tidak menggunakan *relational database* (DBMS) eksternal, melainkan memanfaatkan persistensi data terstruktur menggunakan tipe data in-memory *JSON/Dict* yang terisolasi dan dapat di-backup ke file JSON lokal secara atomik. Aplikasi ini menyediakan pemisahan hak akses berbasis peran (*Role-Based Access Control* antara Kasir dan Pemilik Toko), pencatatan transaksi multi-entitas (*Checkout*), potongan diskon member otomatis, pemungutan PPN 1%, serta siap untuk disebarkan (*deploy*) ke infrastruktur *Amazon Web Services* (AWS).

---

### b. Rancangan Aplikasi Web & Arsitektur Komputasi Awan

#### b.1 Entitas Data Utama (In-Memory JSON / Dict Persistence)
Aplikasi didukung oleh 3 entitas bisnis utama (ditambah 1 entitas pendukung autentikasi RBAC), di mana setiap entitas mendukung operasi CRUD (*Create, Read, Update, Delete*) lengkap:

| Entitas | Atribut Utama | Operasi CRUD & Endpoint API |
| :--- | :--- | :--- |
| **Product** | `id`, `name`, `category` (subclass), `price`, `stock`, `details` | `GET/POST /api/products/`<br>`GET/PUT/DELETE /api/products/{id}/` |
| **Member** | `id`, `name`, `phone`, `points`, `level` (Bronze/Silver/Gold) | `GET/POST /api/members/`<br>`GET/PUT/DELETE /api/members/{id}/` |
| **Transaction** | `id`, `date`, `member_id`, `items`, `subtotal`, `discount`, `ppn`, `total`, `payment_method`, `cash_received`, `change` | `GET/POST /api/transactions/`<br>`GET/DELETE /api/transactions/{id}/` |
| **User (RBAC)** | `id`, `email`, `password`, `name`, `role` (`kasir` / `pemilik`) | `POST /api/auth/login/`<br>`POST /api/auth/register/` |

---

#### b.2 Tabel Fitur Aplikasi
Sesuai dengan ketentuan tugas, sistem mengimplementasikan fitur *multi-entity* yang memproses lebih dari 2 entitas secara terintegrasi pada backend:

| Fitur | Deskripsi | Entitas yang Terlibat |
| :--- | :--- | :--- |
| **Kelola Katalog & Stok Barang (CRUD)** | Menambah barang baru dengan kategori/subclass kustom (polimorfisme), melihat daftar stok, mengubah harga dan stok, serta menghapus data produk. | **Product** |
| **Manajemen Pelanggan Member (CRUD)** | Mendaftarkan member baru, melihat akumulasi poin belanja, memperbarui nomor kontak, dan klasifikasi level keanggotaan. | **Member** |
| **Multi-Entity Checkout Kasir & Pembayaran** | **Fitur Utama Multi-Entitas**: Kasir memilih produk belanjaan dan member (opsional). Backend secara atomik memvalidasi ketersediaan stok produk, memotong kuantitas stok produk, menghitung diskon member (5%), memungut PPN (1%), menambahkan poin loyalitas member, dan mencatat transaksi invoice secara permanen. | **Transaction, Product, Member** |
| **Pilihan Metode Pembayaran Interaktif** | Menyediakan opsi pembayaran Tunai (dengan hitungan uang diterima dan kembalian *real-time*), QRIS Dinamis, Kartu Debit EDC, dan Transfer Bank. | **Transaction** |
| **Cetak & Audit Struk Penjualan Kasir** | Menampilkan struk resmi transaksi kasir lengkap dengan nomor nota, rincian barang, PPN 1%, metode bayar, dan kembalian, serta tombol cetak struk (print). | **Transaction** |
| **Rekapitulasi Riwayat Transaksi Shift Kasir** | Menampilkan rekapitulasi penjualan, metrik omzet harian kasir, rata-rata belanja (*ticket size*), serta fitur ekspor laporan ke format CSV. | **Transaction, Member** |
| **Role-Based Access Control (RBAC)** | Membatasi hak akses: Kasir hanya dapat mengakses POS, Rekap Penjualan, Stok, dan Member. Pemilik Toko memiliki hak akses eksklusif ke Cashflow Bisnis, Laporan Keuangan (Laba Rugi & Pajak PPN), dan Manajemen Staf. | **User, Transaction** |

---

#### b.3 Arsitektur Komputasi Awan (Cloud Architecture on AWS)
Untuk menjamin ketersediaan tinggi (*high availability*), keandalan (*reliability*), dan performa optimal, aplikasi Toko Maju POS dirancang untuk berjalan di atas infrastruktur cloud AWS dengan topologi arsitektur berikut:

```
[ Klien / Kasir Browser ]
           │
           ▼
[ Amazon Route 53 (DNS) ]
           │
     ┌─────┴────────────────────────────────┐
     ▼                                      ▼
[ AWS CloudFront CDN ]         [ AWS Application Load Balancer (ALB) ]
     │ (HTTPS / Static Assets)              │ (Reverse Proxy & SSL Termination)
     ▼                                      ├───► [ EC2 Instance 1 (Django API) ]
[ Amazon S3 Bucket ]                        ├───► [ EC2 Instance 2 (Django API) ]
 (Frontend React + Vite Build)              └───► [ EC2 Instance N (Auto Scaling) ]
                                                            │
                                              [ Amazon EFS / Shared Storage ]
                                              (Backup File JSON / Dict Store)
                                                            │
                                              [ Amazon CloudWatch ]
                                              (Monitoring Metrik CPU/RAM & Alarm)
```

1. **Frontend Hosting (Jamstack on S3 & CloudFront)**:
   - File statis build React Vite (`dist/index.html`, bundle JS, CSS, aset gambar) di-host di **Amazon S3 Bucket** yang dikonfigurasi sebagai *Static Website Hosting*.
   - **AWS CloudFront** berfungsi sebagai *Content Delivery Network (CDN)* global yang mendistribusikan aset dengan latensi rendah dan mengaktifkan sertifikat HTTPS/SSL secara otomatis.
2. **Backend Compute (Stateless EC2 & Auto Scaling)**:
   - Server backend Django berjalan di dalam **Amazon EC2 Instances** (tipe instance `t3.micro` / `t3.small`) berbasis Linux Ubuntu.
   - Dikelola oleh **Auto Scaling Group (ASG)** yang secara dinamis menambah atau mengurangi jumlah instance berdasarkan beban trafik CPU/Network.
3. **Load Balancing (AWS Application Load Balancer - ALB)**:
   - Menerima request REST API (`/api/*`) dari browser kasir dan mendistribusikan beban secara merata ke instance EC2 yang sehat (*healthy*) menggunakan algoritma load balancing.
4. **Data Persistence & Shared State**:
   - Sesuai regulasi tugas (tanpa database SQL), persistensi data in-memory di-backup ke file JSON tersentralisasi melalui **Amazon Elastic File System (Amazon EFS)** yang dimount bersama ke seluruh EC2 instance, sehingga seluruh instance membaca dan menulis ke *state* data yang konsisten.
5. **Monitoring & Logging**:
   - **Amazon CloudWatch** memantau penggunaan CPU, jumlah request HTTP, *health check*, dan memicu *scaling policy* secara otomatis.

---

### c. Sketsa Tampilan Frontend (Wireframe)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  🏪 TOKO MAJU POS - Kasir & Manajemen Ritel                 [🌙 Dark] [👤 Kasir] │
├──────────────┬─────────────────────────────────────────────────┬─────────────────┤
│ [SIDEBAR]    │ 🔍 [ Cari Nama Produk / Barcode...            ] │ KERANJANG KASIR │
│              ├─────────────────────────────────────────────────┼─────────────────┤
│ • POS Kasir  │ [KATALOG PRODUK]                                │ Pelanggan:      │
│ • Rekap Trx  │ ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │ [ Umum (Non)  ▾]│
│ • Data Stok  │ │ 📺 Kulkas LG │ │ 🍞 Rice Bowl │ │ 🥤 Susu   │ ├─────────────────┤
│ • Data Member│ │ Rp 7.500.000 │ │ Rp 35.000    │ │ Rp 18.000 │ │ • Kulkas LG x1  │
│              │ │ Stok: 12     │ │ Stok: 40     │ │ Stok: 25  │ │   Rp 7.500.000  │
│ [OWNER ONLY] │ │ [+ Tambah]   │ │ [+ Tambah]   │ │ [+ Tambah]│ ├─────────────────┤
│ • Cashflow   │ └──────────────┘ └──────────────┘ └───────────┘ │ Subtotal:       │
│ • Lap Keuangan│                                                │   Rp 7.500.000  │
│ • Kelola Akses│                                                │ Diskon (5%): -  │
│              │                                                 │ PPN (1%):       │
│              │                                                 │   Rp 75.000     │
│              │                                                 │ TOTAL BAYAR:    │
│              │                                                 │   Rp 7.575.000  │
│              │                                                 ├─────────────────┤
│              │                                                 │ [ PROSES BAYAR ]│
└──────────────┴─────────────────────────────────────────────────┴─────────────────┘
                                       │
                                       ▼ (Klik Tombol Proses Bayar)
┌──────────────────────────────────────────────────────────────────────────────────┐
│ MODAL KONFIRMASI PEMBAYARAN KASIR                                            [X] │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. Rincian Item:                                                                 │
│    • Kulkas Showcase LG Smart x 1 .............................. Rp 7.500.000    │
│ 2. Ringkasan Tagihan:                                                            │
│    Subtotal: Rp 7.500.000  |  PPN (1%): Rp 75.000  |  TOTAL: Rp 7.575.000        │
│ 3. Pilih Metode Pembayaran:                                                      │
│    [💵 Tunai (Cash)]    [📱 QRIS Dinamis]    [💳 Kartu Debit]    [🏦 Transfer]   │
│    Nominal Uang Diterima: [ Rp 7.600.000   ]  Kembalian: Rp 25.000               │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                      [Batal / Kembali]  [ Selesaikan Pembayaran ]│
└──────────────────────────────────────────────────────────────────────────────────┘
```
*Gambar 1. Wireframe Antarmuka Aplikasi Toko Maju POS (Halaman Kasir & Dialog Pembayaran)*

---

### d. Use Case Diagram

```
                              ┌──────────────────────────────────────────────┐
                              │           Sistem Toko Maju POS               │
                              │                                              │
                              │    ┌────────────────────────────────────┐    │
                              │    │       Autentikasi & Login (RBAC)   │    │
                              │    └────────────────────────────────────┘    │
                              │          ▲            ▲            ▲         │
                              │          │            │            │         │
    ┌─────────────┐           │    ┌─────┴──────┐     │            │         │
    │             │───────────┼───►│ Kelola     │     │            │         │
    │             │           │    │ Produk     │     │            │         │
    │             │───────────┼───►│ (CRUD)     │     │            │         │
    │             │           │    └────────────┘     │            │         │
    │             │           │    ┌────────────┐     │            │         │
    │             │───────────┼───►│ Kelola     │     │            │         │
    │             │           │    │ Member     │     │            │         │
    │    Kasir    │           │    │ (CRUD)     │     │            │         │
    │             │           │    └────────────┘     │            │         │
    │             │           │    ┌────────────┐     │            │         │
    │             │───────────┼───►│ Transaksi  │     │            │         │
    │             │           │    │ Checkout   │     │            │         │
    │             │           │    │ Kasir      │     │            │         │
    │             │           │    └────────────┘     │            │         │
    │             │           │    ┌────────────┐     │            │         │
    │             │───────────┼───►│ Cetak      │     │            │         │
    │             │           │    │ Struk &    │     │            │         │
    │             │           │    │ Rekap Shift│     │            │         │
    └─────────────┘           │    └────────────┘     │            │         │
                              │                       │            │         │
    ┌─────────────┐           │    ┌────────────┐     │            │         │
    │             │───────────┼───►│ Pantau     │─────┘            │         │
    │   Pemilik   │           │    │ Cashflow   │                  │         │
    │    Toko     │           │    │ Bisnis     │                  │         │
    │   (Admin)   │           │    └────────────┘                  │         │
    │             │           │    ┌────────────┐                  │         │
    │             │───────────┼───►│ Laporan    │──────────────────┘         │
    │             │           │    │ Keuangan & │                            │
    │             │           │    │ Pajak PPN  │                            │
    │             │           │    └────────────┘                            │
    └─────────────┘           └──────────────────────────────────────────────┘
```
*Gambar 2. Use Case Diagram Sistem Toko Maju POS*

#### Identifikasi Aktor & Deskripsi Use Case:
1. **Aktor Kasir**: Bertanggung jawab melayani pembeli di meja transaksi, mengelola data inventaris produk, menginput member baru, melakukan multi-entity checkout dengan memilih metode pembayaran, serta mencetak struk belanja dan mengekspor rekap penjualan shift.
2. **Aktor Pemilik Toko (Admin)**: Memiliki hak akses terhadap seluruh modul eksekutif, meliputi analisis likuiditas arus kas masuk dan keluar (*Cashflow*), audit laba rugi toko, rekapitulasi pelaporan kepatuhan Pajak PPN 1%, dan penambahan akun staf karyawan.

| Use Case | Aktor Terlibat | Keterangan Fungsional |
| :--- | :--- | :--- |
| **Login & Autentikasi RBAC** | Kasir, Pemilik Toko | Memvalidasi kredensial email dan password serta mengarahkan ke dashboard sesuai hak akses peran. |
| **Kelola Produk (CRUD)** | Kasir, Pemilik Toko | Menambah barang baru, mengatur kuantitas stok, mengubah harga, dan menghapus barang. |
| **Kelola Member (CRUD)** | Kasir, Pemilik Toko | Mendaftarkan member baru, melihat akumulasi poin belanja, dan pembaruan data member. |
| **Transaksi Checkout Kasir** | Kasir | Menghitung subtotal keranjang, memotong diskon 5% member, memungut PPN 1%, memotong stok produk secara atomik, dan menambah poin loyalitas. |
| **Pilih Metode Pembayaran** | Kasir | Memproses pembayaran via Tunai (dengan hitungan uang kembali), QRIS Dinamis, Kartu Debit, atau Transfer. |
| **Cetak Struk & Rekap Shift** | Kasir | Mencetak invoice fisik atau digital untuk pembeli dan mengekspor riwayat transaksi harian ke file CSV. |
| **Pantau Cashflow Toko** | Pemilik Toko | Mencatat dan menganalisis arus kas masuk (*inflow*), kas keluar operasional (*outflow*), dan saldo likuiditas bersih. |
| **Laporan Keuangan & Pajak PPN** | Pemilik Toko | Menyajikan neraca keuangan, valuasi aset stok gudang, estimasi laba kotor, dan audit setoran PPN 1%. |

---

## Soal 3. Vertical dan Horizontal Scalability (20 poin) - ONSITE

Skalabilitas (*scalability*) adalah kapabilitas arsitektur sistem komputasi awan dalam mempertahankan performa, waktu respons, dan ketersediaan layanan ketika volume beban kerja (*workload/traffic*) mengalami lonjakan signifikan.

### a. Vertical Scalability (Scale-Up dan Scale-Down)

```
                  ┌───────────────────────────────┐
                  │          SCALE-UP             │
                  │   (Upgrade Kapasitas Server)  │
                  └───────────────────────────────┘
                                  │
    ┌──────────────────────┐      │       ┌──────────────────────┐
    │   Amazon EC2 Awal    │      ▼       │  Amazon EC2 Upgrade  │
    │     (t3.micro)       │ ───────────► │     (t3.xlarge)      │
    │  2 vCPU | 1 GB RAM   │              │  4 vCPU | 16 GB RAM  │
    └──────────────────────┘              └──────────────────────┘
               ▲                                     │
               │  ┌───────────────────────────────┐  │
               └──│          SCALE-DOWN           │◄─┘
                  │  (Downgrade Kapasitas Server) │
                  └───────────────────────────────┘
```
*Gambar 3. Ilustrasi Konsep Vertical Scalability*

#### Penjelasan Komprehensif:
1. **Scale-Up**: Merupakan pendekatan penskalaan dengan cara memperbesar spesifikasi perangkat keras (*hardware resources*) pada sebuah mesin instance server tunggal yang sama. Dalam konteks AWS, hal ini dilakukan dengan mengubah *Instance Type* pada Amazon EC2, misalnya dari `t3.micro` (2 vCPU, 1 GB RAM) menjadi `t3.xlarge` (4 vCPU, 16 GB RAM). Server yang lebih bertenaga mampu mengeksekusi lebih banyak konkurensi request API Django per detik tanpa mengubah arsitektur kode.
2. **Scale-Down**: Sebaliknya, ketika volume transaksi menurun drastis (misalnya pada malam hari saat toko tutup), kapasitas instance server diubah kembali ke tipe yang lebih kecil (`t3.micro`) untuk menekan biaya tagihan cloud (*cost optimization*).
3. **Kelebihan**:
   - Sangat sederhana diimplementasikan, tidak memerlukan konfigurasi jaringan yang rumit ataupun load balancer tambahan.
   - Aplikasi tidak perlu dirancang ulang menjadi *stateless*.
4. **Kelemahan & Batasan**:
   - Memiliki batas fisik maksimal (*hardware ceiling*); server tidak bisa ditingkatkan melebihi spesifikasi terbesar yang disediakan penyedia cloud.
   - Proses peningkatan tipe instance biasanya membutuhkan *restart* instance (menimbulkan *downtime* layanan).
   - Menghasilkan *Single Point of Failure (SPOF)*; jika server tersebut mengalami gangguan fatal (*hardware failure*), seluruh operasional toko terhenti total.

---

### b. Horizontal Scalability (Scale-Out dan Scale-In)

```
A. SCALE-OUT (Menambah Jumlah Server saat Beban Trafik Melonjak):

                    ┌─────────────────────────┐      ┌─────────────────────────┐
                    │                         ├─────►│  EC2 Backend Server 1   │
[ Ribuan Klien Kasir│                         │      └─────────────────────────┘
  & Pengunjung Toko ├────►[ Application Load  ├─────►┌─────────────────────────┐
  Mengirim Request  │     │     Balancer      │      │  EC2 Backend Server 2   │
                    │     │      (ALB)        │      └─────────────────────────┘
                    │                         ├─────►┌─────────────────────────┐
                    └─────────────────────────┘      │  EC2 Backend Server 3   │
                                                     └─────────────────────────┘

----------------------------------------------------------------------------------

B. SCALE-IN (Mengurangi Server saat Beban Trafik Normal/Rendah):

                    ┌─────────────────────────┐      ┌─────────────────────────┐
                    │   Application Load      ├─────►│  EC2 Backend Server 1   │
[ Klien Kasir Normal├────►     Balancer       │      │  (Tetap Aktif)          │
  Mengirim Request  │     │      (ALB)        │      └─────────────────────────┘
                    │                         ├── - -[ EC2 Server 2: Stopped ]
                    └─────────────────────────┘  - - [ EC2 Server 3: Stopped ]
```
*Gambar 4. Ilustrasi Konsep Horizontal Scalability (Scale-Out dan Scale-In)*

#### Penjelasan Komprehensif:
1. **Scale-Out**: Pendekatan penskalaan dengan cara **menambah kuantitas unit server** yang bekerja secara paralel di belakang sebuah *Load Balancer*. Ketika ribuan kasir memproses transaksi bersamaan pada periode promosi (*flash sale*), AWS Auto Scaling Group secara otomatis meluncurkan instance EC2 baru (dari 1 instance menjadi 3 atau lebih). Load Balancer membagi beban secara merata sehingga tidak ada satu pun server yang kelebihan muatan (*overloaded*).
2. **Scale-In**: Ketika beban transaksi kembali normal atau rendah, sistem secara otomatis menghentikan (*terminate*) instance EC2 tambahan yang tidak terpakai, sehingga tagihan cloud dapat ditekan secara signifikan tanpa mengorbankan kualitas layanan.
3. **Kelebihan**:
   - Kapasitas komputasi praktis **tanpa batas (*infinite elasticity*)**, karena kapasitas ditingkatkan hanya dengan terus menambah jumlah server.
   - **Tinggi Ketersediaannya (*High Availability & Fault Tolerance*)**: Apabila salah satu instance EC2 mengalami *crash*, Load Balancer secara otomatis mengalihkan request ke server lain yang masih beroperasi normal tanpa menyebabkan *downtime* bagi pengguna kasir.
4. **Kekurangan**:
   - Memerlukan arsitektur aplikasi yang *stateless*, di mana data sesi dan data persisten tidak boleh terikat pada memori lokal server tunggal melainkan harus tersimpan pada shared storage (seperti Amazon EFS / S3).
   - Membutuhkan komponen jaringan tambahan seperti *Application Load Balancer* dan konfigurasi *Auto Scaling Group*.

#### Tabel Komparasi Penskalaan:
| Aspek Perbandingan | Vertical Scalability | Horizontal Scalability |
| :--- | :--- | :--- |
| **Metode Pelaksanaan** | Memperbesar kapasitas komputasi (CPU/RAM) pada server yang sama | Menambah atau mengurangi jumlah unit server |
| **Batas Kapasitas** | Terbatas pada spesifikasi hardware maksimal server | Praktis tidak terbatas (*elastic scaling*) |
| **Downtime / Gangguan** | Umumnya ada *downtime* saat instance di-restart | **Zero downtime**, server baru dapat ditambah secara *seamless* |
| **Resiko Kegagalan** | *Single Point of Failure* (sangat berisiko jika server mati) | *Fault Tolerant* (tetap berjalan walau ada server yang gagal) |
| **Kompleksitas Jaringan**| Sangat rendah | Lebih tinggi (membutuhkan Load Balancer & Shared Storage) |

---

## Soal 4. Load Balancing (25 poin) - Homework AI-2

**Load Balancer** adalah komponen infrastruktur jaringan yang ditempatkan di antara klien pengguna (browser kasir) dan sekelompok server backend. Load Balancer bertindak sebagai gerbang terdepan (*reverse proxy*) yang menerima setiap request HTTP/HTTPS yang masuk, mengevaluasi algoritma distribusi beban yang ditetapkan, meneruskan request ke server backend yang paling optimal, lalu mengembalikan respon server kembali kepada klien.

Tujuan utama Load Balancer adalah:
1. Mencegah kelebihan beban (*overload*) pada salah satu server.
2. Memaksimalkan *throughput* dan meminimalkan waktu respon (*response time*).
3. Melakukan pemeriksaan kesehatan (*Health Check*) rutin; server yang tidak merespon (*unhealthy*) akan dikeluarkan dari siklus pembagian trafik secara otomatis.

---

### a. Algoritma Round-Robin

```
                     ALGORITMA ROUND-ROBIN (Siklus Berputar A -> B -> C -> A)

Req 1 [R1] ───► [ Load Balancer ] ─────────────────────────► [ Server A ] (Menerima R1)
                                                              [ Server B ]
                                                              [ Server C ]

Req 2 [R2] ───► [ Load Balancer ] ─────────────────────────► [ Server B ] (Menerima R2)
                                                              [ Server A ]
                                                              [ Server C ]

Req 3 [R3] ───► [ Load Balancer ] ─────────────────────────► [ Server C ] (Menerima R3)
                                                              [ Server A ]
                                                              [ Server B ]

Req 4 [R4] ───► [ Load Balancer ] ─────────────────────────► [ Server A ] (Kembali ke A)
                                                              [ Server B ]
                                                              [ Server C ]

Req 5 [R5] ───► [ Load Balancer ] ─────────────────────────► [ Server B ] (Menerima R5)
Req 6 [R6] ───► [ Load Balancer ] ─────────────────────────► [ Server C ] (Menerima R6)
```
*Gambar 5. Alur Distribusi Request pada Algoritma Round-Robin*

#### Paragraf Analisis Alur Request:
Pada algoritma **Round-Robin**, Load Balancer meneruskan request yang masuk secara bergiliran menurut urutan statis daftar server yang tersedia tanpa memperhitungkan beban CPU, pemakaian memori, maupun waktu eksekusi pada masing-masing server. Seperti yang diilustrasikan pada Gambar 5:
- Request pertama (**R1**) dari kasir dikirimkan ke **Server A**.
- Request kedua (**R2**) secara otomatis diteruskan ke **Server B**.
- Request ketiga (**R3**) dialihkan ke **Server C**.
- Setelah mencapai server terakhir di dalam daftar pool, algoritma memutar kembali gilirannya ke awal urutan: request keempat (**R4**) diarahkan ke **Server A**, request kelima (**R5**) ke **Server B**, dan request keenam (**R6**) ke **Server C**.

Hasil akhirnya, setiap server melayani jumlah request yang identik secara kuantitas (masing-masing 2 request). Algoritma ini sangat ringan, deterministik, dan bekerja sangat baik apabila seluruh server memiliki spesifikasi perangkat keras yang identik serta durasi pemrosesan tiap request relatif seragam. Namun, kelemahannya muncul apabila terdapat transaksi berat (misalnya kalkulasi audit keuangan yang memakan waktu lama) yang tertumpuk di satu server, sementara server lain yang telah selesai menganggur.

---

### b. Algoritma Least Connection

```
                   ALGORITMA LEAST CONNECTION (Pilih Koneksi Aktif Terendah)

Langkah 1: Koneksi Awal Aktif [ Server A: 3 ] | [ Server B: 1 ] | [ Server C: 2 ]
Req 1 [R1] ───► [ Load Balancer ] ─────────────► [ Server B ] (B paling sedikit: 1 -> 2)

Langkah 2: Satu koneksi di Server A selesai diproses (A turun dari 3 menjadi 2).
           Kondisi saat ini: [ Server A: 2 ] | [ Server B: 2 ] | [ Server C: 2 ] (Seri)
Req 2 [R2] ───► [ Load Balancer ] ─────────────► [ Server A ] (Dipilih urutan awal: 2 -> 3)

Langkah 3: Kondisi saat ini: [ Server A: 3 ] | [ Server B: 2 ] | [ Server C: 2 ]
Req 3 [R3] ───► [ Load Balancer ] ─────────────► [ Server B ] (B & C terendah, pilih B: 2 -> 3)

Langkah 4: Kondisi saat ini: [ Server A: 3 ] | [ Server B: 3 ] | [ Server C: 2 ]
Req 4 [R4] ───► [ Load Balancer ] ─────────────► [ Server C ] (C terendah: 2 -> 3)
```
*Gambar 6. Alur Distribusi Request pada Algoritma Least Connection*

#### Paragraf Analisis Alur Request:
Algoritma **Least Connection** bersifat dinamis dengan memantau secara aktif jumlah koneksi konkuren (*active open connections*) yang sedang ditangani oleh masing-masing server pada saat request tiba. Load Balancer akan selalu memprioritaskan server dengan koneksi aktif paling sedikit:
- Pada **Langkah 1**, koneksi aktif tercatat: Server A = 3, Server B = 1, dan Server C = 2. Karena Server B memiliki koneksi aktif paling sedikit (1), maka request **R1** langsung diarahkan ke **Server B** (menjadikan koneksinya 2).
- Pada **Langkah 2**, sebuah proses transaksi di Server A selesai sehingga koneksinya turun menjadi 2. Ketika request **R2** masuk, ketiga server berada pada posisi seimbang/seri dengan masing-masing 2 koneksi aktif. Load Balancer memilih server pertama dalam urutan pool, yaitu **Server A** (koneksinya naik menjadi 3).
- Pada **Langkah 3**, posisi koneksi aktif adalah A = 3, B = 2, C = 2. Menghadapi nilai seimbang antara B dan C, request **R3** dialokasikan ke **Server B** (koneksi naik menjadi 3).
- Pada **Langkah 4**, Server A = 3, Server B = 3, dan Server C = 2. Server C jelas merupakan server paling longgar sehingga request **R4** diteruskan ke **Server C**.

Algoritma ini jauh lebih adaptif dibandingkan Round-Robin untuk sistem kasir POS, karena transaksi kasir yang melakukan pembayaran panjang tidak akan membebani server secara sepihak; request baru akan dialihkan ke server yang sedang memiliki beban koneksi paling ringan.

---

### c. Algoritma Least Response Time

```
               ALGORITMA LEAST RESPONSE TIME (Pilih Server Tercepat / Latensi Terendah)

Langkah 1: Waktu respons terukur: [ Server A: 120 ms ] | [ Server B: 80 ms ] | [ Server C: 200 ms ]
Req 1 [R1] ───► [ Load Balancer ] ─────────────────────► [ Server B ] (B tercepat: 80 ms)
                (Setelah melayani R1, respons Server B naik menjadi 150 ms)

Langkah 2: Waktu respons terukur: [ Server A: 120 ms ] | [ Server B: 150 ms ] | [ Server C: 200 ms ]
Req 2 [R2] ───► [ Load Balancer ] ─────────────────────► [ Server A ] (A tercepat: 120 ms)
                (Setelah melayani R2, respons Server A naik menjadi 210 ms)

Langkah 3: Waktu respons terukur: [ Server A: 210 ms ] | [ Server B: 150 ms ] | [ Server C: 200 ms ]
Req 3 [R3] ───► [ Load Balancer ] ─────────────────────► [ Server B ] (B tercepat: 150 ms)
                (Setelah melayani R3, respons Server B naik menjadi 230 ms)

Langkah 4: Waktu respons terukur: [ Server A: 210 ms ] | [ Server B: 230 ms ] | [ Server C: 200 ms ]
Req 4 [R4] ───► [ Load Balancer ] ─────────────────────► [ Server C ] (C tercepat: 200 ms)
                (Server C menyelesaikan proses lama, waktu responsnya turun drastis ke 90 ms)
```
*Gambar 7. Alur Distribusi Request pada Algoritma Least Response Time*

#### Paragraf Analisis Alur Request:
Algoritma **Least Response Time** merupakan salah satu metode pembagian beban paling cerdas (*intelligent load balancing*) yang mengombinasikan pemantauan metrik waktu respons (*response time latency*) rata-rata dengan jumlah koneksi aktif pada tiap target server. Load Balancer secara kontinu mengukur waktu yang dibutuhkan tiap server dalam mengembalikan paket *Time to First Byte (TTFB)*:
- Pada **Langkah 1**, data telemetri mencatat Server A = 120 ms, Server B = 80 ms, dan Server C = 200 ms. Karena Server B memberikan respons paling cepat (80 ms), request **R1** dialihkan ke **Server B**. Beban tambahan ini menaikkan waktu respons Server B menjadi 150 ms.
- Pada **Langkah 2**, Server A kini menjadi kandidat tercepat dengan 120 ms (dibandingkan Server B 150 ms dan Server C 200 ms), sehingga request **R2** diarahkan ke **Server A**, yang kemudian menaikkan latensinya menjadi 210 ms.
- Pada **Langkah 3**, Server B (150 ms) kembali menjadi yang tercepat di antara ketiga kandidat, sehingga request **R3** dialokasikan ke **Server B** (latensi naik menjadi 230 ms).
- Pada **Langkah 4**, Server C (200 ms) lebih cepat daripada Server A (210 ms) dan Server B (230 ms), sehingga request **R4** diteruskan ke **Server C**. Bersamaan dengan itu, tugas komputasi lama di Server C selesai sehingga latensinya turun tajam ke 90 ms, menjadikannya prioritas utama untuk request selanjutnya.

Algoritma ini memberikan *User Experience (UX)* terbaik bagi kasir karena request checkout pembayaran selalu dilayani oleh server dengan performa paling responsif di dalam klaster cloud.

---

### Ringkasan Evaluasi Algoritma Load Balancing

| Algoritma | Parameter Penentu | Kapan Paling Tepat Digunakan? | Kelemahan Utama |
| :--- | :--- | :--- | :--- |
| **Round-Robin** | Urutan indeks statis berputar | Beban tiap request seragam dan spesifikasi server sama | Tidak memperhitungkan beban riil server |
| **Least Connection** | Kuantitas koneksi aktif terkecil | Durasi transaksi bervariasi (sesi kasir panjang vs pendek) | Tidak mengukur kecepatan hardware tiap server |
| **Least Response Time**| Latensi respon tercepat + koneksi | Performa kecepatan transaksi adalah prioritas utama kasir | Membutuhkan overhead pemantauan latensi berkala |
