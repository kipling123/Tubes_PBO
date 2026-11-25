"""
In-Memory & JSON File Data Store (Sesuai Ketentuan Tugas 9 Komputasi Awan dan Terdistribusi):
'Please don’t use a database for this course. All potential persistence data is hardcoded using JSON/DICT data type.'

Modul ini mengelola 3 Entitas Utama:
1. Product (Katalog Produk & Stok)
2. Member (Keanggotaan & Poin Loyalitas Pelanggan)
3. Transaction (Transaksi Penjualan & Invoice Kasir - Multi-Entity)
Serta Entitas Pendukung:
4. User (Akun Kasir & Pemilik/Admin)
"""

import copy
import functools
import json
import os
import tempfile
import threading
from pathlib import Path
from datetime import datetime

DATA_FILE = Path(
    os.environ.get(
        "POS_DATA_FILE",
        str(Path(__file__).resolve().parent.parent / "data_store.json"),
    )
).expanduser().resolve()
_STORE_THREAD_LOCK = threading.RLock()
_STORE_LOCK_STATE = threading.local()

# ==========================================
# DEFAULT DATA (Hardcoded JSON / Dict Structure)
# ==========================================
DEFAULT_PRODUCTS = [
    {
        "id": "BRG-001",
        "name": "Kulkas Showcase LG Smart",
        "category": "Elektronik",
        "price": 7500000,
        "stock": 12,
        "details": "24 Bulan Garansi Resmi",
    },
    {
        "id": "BRG-002",
        "name": "Rice Bowl Premium",
        "category": "Makanan",
        "price": 35000,
        "stock": 40,
        "details": "Kedaluwarsa: Des 2026",
    },
    {
        "id": "BRG-003",
        "name": "Smart TV 43 Inch",
        "category": "Elektronik",
        "price": 4200000,
        "stock": 8,
        "details": "Garansi Resmi 1 Tahun",
    },
    {
        "id": "BRG-004",
        "name": "Susu UHT 1 Liter",
        "category": "Makanan",
        "price": 18000,
        "stock": 55,
        "details": "Kedaluwarsa: Jan 2027",
    },
]

DEFAULT_MEMBERS = [
    {
        "id": "MBR-001",
        "name": "Ahmad Dani",
        "email": "ahmad@gmail.com",
        "phone": "081234567890",
        "points": 1250,
        "level": "Silver",
    },
    {
        "id": "MBR-002",
        "name": "Siti Nurhaliza",
        "email": "siti@gmail.com",
        "phone": "081987654321",
        "points": 2400,
        "level": "Gold",
    },
    {
        "id": "MBR-003",
        "name": "Budi Santoso",
        "email": "budi@yahoo.com",
        "phone": "082111222333",
        "points": 450,
        "level": "Bronze",
    },
]

DEFAULT_TRANSACTIONS = [
    {
        "id": "TRX-0001",
        "date": "2026-11-20 14:32:00",
        "member_id": "MBR-001",
        "member_name": "Ahmad Dani",
        "cashier_name": "Kasir Utama",
        "items": [
            {
                "id": "BRG-002",
                "name": "Rice Bowl Premium",
                "category": "Makanan",
                "price": 35000,
                "quantity": 2,
                "total": 70000,
            },
            {
                "id": "BRG-004",
                "name": "Susu UHT 1 Liter",
                "category": "Makanan",
                "price": 18000,
                "quantity": 1,
                "total": 18000,
            },
        ],
        "subtotal": 88000,
        "discount": 4400,
        "ppn": 9196,
        "total": 92796,
        "status": "COMPLETED",
    }
]

DEFAULT_USERS = [
    {
        "id": "USR-001",
        "username": "admin",
        "email": "admin@store.com",
        "role": "pemilik",
        "password": "admin123",
    },
    {
        "id": "USR-002",
        "username": "kasir",
        "email": "kasir@store.com",
        "role": "kasir",
        "password": "kasir123",
    },
]

PRODUCTS = [dict(p) for p in DEFAULT_PRODUCTS]
MEMBERS = [dict(m) for m in DEFAULT_MEMBERS]
TRANSACTIONS = [dict(t) for t in DEFAULT_TRANSACTIONS]
USERS = [dict(u) for u in DEFAULT_USERS]


class _StorageLock:
    def __enter__(self):
        _STORE_THREAD_LOCK.acquire()
        self.nested = getattr(_STORE_LOCK_STATE, "depth", 0) > 0
        if self.nested:
            _STORE_LOCK_STATE.depth += 1
            return self

        try:
            DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
            self.lock_file = DATA_FILE.with_name(f"{DATA_FILE.name}.lock").open("a+b")
            if os.name == "nt":
                import msvcrt

                if os.fstat(self.lock_file.fileno()).st_size == 0:
                    self.lock_file.write(b"\0")
                    self.lock_file.flush()
                self.lock_file.seek(0)
                msvcrt.locking(self.lock_file.fileno(), msvcrt.LK_LOCK, 1)
            else:
                import fcntl

                fcntl.flock(self.lock_file.fileno(), fcntl.LOCK_EX)
        except Exception:
            if hasattr(self, "lock_file"):
                self.lock_file.close()
            _STORE_THREAD_LOCK.release()
            raise
        _STORE_LOCK_STATE.depth = 1
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        if self.nested:
            _STORE_LOCK_STATE.depth -= 1
        else:
            try:
                try:
                    if os.name == "nt":
                        import msvcrt

                        self.lock_file.seek(0)
                        msvcrt.locking(self.lock_file.fileno(), msvcrt.LK_UNLCK, 1)
                    else:
                        import fcntl

                        fcntl.flock(self.lock_file.fileno(), fcntl.LOCK_UN)
                finally:
                    self.lock_file.close()
                    _STORE_LOCK_STATE.depth = 0
            finally:
                _STORE_THREAD_LOCK.release()


def _synchronized_store(function):
    @functools.wraps(function)
    def wrapped(*args, **kwargs):
        if getattr(_STORE_LOCK_STATE, "depth", 0) > 0:
            return function(*args, **kwargs)

        with _StorageLock():
            _load_from_disk_unlocked()
            return copy.deepcopy(function(*args, **kwargs))

    return wrapped


def save_to_disk():
    """Write a complete JSON snapshot using an atomic replacement."""
    data = {
        "PRODUCTS": PRODUCTS,
        "MEMBERS": MEMBERS,
        "TRANSACTIONS": TRANSACTIONS,
        "USERS": USERS,
    }
    with _StorageLock():
        file_descriptor, temporary_path = tempfile.mkstemp(
            prefix=f".{DATA_FILE.name}.",
            suffix=".tmp",
            dir=DATA_FILE.parent,
        )
        try:
            with os.fdopen(file_descriptor, "w", encoding="utf-8") as data_file:
                json.dump(data, data_file, indent=2, ensure_ascii=False)
                data_file.flush()
                os.fsync(data_file.fileno())
            os.replace(temporary_path, DATA_FILE)
        except Exception:
            if os.path.exists(temporary_path):
                os.unlink(temporary_path)
            raise


def _load_from_disk_unlocked():
    global PRODUCTS, MEMBERS, TRANSACTIONS, USERS
    if DATA_FILE.exists():
        with DATA_FILE.open("r", encoding="utf-8") as data_file:
            data = json.load(data_file)
        if not isinstance(data, dict):
            raise ValueError(f"Data store JSON must contain an object: {DATA_FILE}")
        defaults = {
            "PRODUCTS": DEFAULT_PRODUCTS,
            "MEMBERS": DEFAULT_MEMBERS,
            "TRANSACTIONS": DEFAULT_TRANSACTIONS,
            "USERS": DEFAULT_USERS,
        }
        loaded = {}
        for key, default in defaults.items():
            value = data.get(key, copy.deepcopy(default))
            if not isinstance(value, list):
                raise ValueError(f"Data store field '{key}' must be a list: {DATA_FILE}")
            loaded[key] = value
        PRODUCTS = loaded["PRODUCTS"]
        MEMBERS = loaded["MEMBERS"]
        TRANSACTIONS = loaded["TRANSACTIONS"]
        USERS = loaded["USERS"]
    else:
        save_to_disk()


def load_from_disk():
    """Load the latest shared JSON state while holding the cross-process lock."""
    with _StorageLock():
        _load_from_disk_unlocked()


# Muat data persisten saat aplikasi pertama dijalankan
load_from_disk()


def determine_member_level(points):
    """Menentukan tingkatan member berdasarkan jumlah poin."""
    if points >= 2000:
        return "Gold"
    elif points >= 1000:
        return "Silver"
    return "Bronze"


# ==========================================
# CRUD ENTITAS PRODUK (Product)
# ==========================================
@_synchronized_store
def get_products():
    return PRODUCTS

@_synchronized_store
def get_product_by_id(product_id):
    for p in PRODUCTS:
        if str(p["id"]).lower() == str(product_id).lower():
            return p
    return None

@_synchronized_store
def create_product(data):
    # Auto-generate ID: BRG-xxx
    next_num = len(PRODUCTS) + 1
    new_id = f"BRG-{str(next_num).zfill(3)}"
    new_product = {
        "id": new_id,
        "name": data.get("name", "").strip(),
        "category": data.get("category", "Umum").strip(),
        "price": float(data.get("price", 0)),
        "stock": int(data.get("stock", 0)),
        "details": data.get("details", "-").strip(),
    }
    PRODUCTS.append(new_product)
    save_to_disk()
    return new_product

@_synchronized_store
def update_product(product_id, data):
    product = get_product_by_id(product_id)
    if not product:
        return None
    
    if "name" in data:
        product["name"] = data["name"].strip()
    if "category" in data:
        product["category"] = data["category"].strip()
    if "price" in data:
        product["price"] = float(data["price"])
    if "stock" in data:
        product["stock"] = int(data["stock"])
    if "details" in data:
        product["details"] = data["details"].strip()
    save_to_disk()
    return product

@_synchronized_store
def delete_product(product_id):
    global PRODUCTS
    product = get_product_by_id(product_id)
    if not product:
        return False
    PRODUCTS = [p for p in PRODUCTS if str(p["id"]).lower() != str(product_id).lower()]
    save_to_disk()
    return True


# ==========================================
# CRUD ENTITAS MEMBER (Member)
# ==========================================
@_synchronized_store
def get_members():
    return MEMBERS

@_synchronized_store
def get_member_by_id(member_id):
    for m in MEMBERS:
        if str(m["id"]).lower() == str(member_id).lower():
            return m
    return None

@_synchronized_store
def create_member(data):
    next_num = len(MEMBERS) + 1
    new_id = f"MBR-{str(next_num).zfill(3)}"
    points = int(data.get("points", 0))
    new_member = {
        "id": new_id,
        "name": data.get("name", "").strip(),
        "email": data.get("email", "").strip(),
        "phone": data.get("phone", "").strip(),
        "points": points,
        "level": determine_member_level(points),
    }
    MEMBERS.append(new_member)
    save_to_disk()
    return new_member

@_synchronized_store
def update_member(member_id, data):
    member = get_member_by_id(member_id)
    if not member:
        return None
    
    if "name" in data:
        member["name"] = data["name"].strip()
    if "email" in data:
        member["email"] = data["email"].strip()
    if "phone" in data:
        member["phone"] = data["phone"].strip()
    if "points" in data:
        member["points"] = int(data["points"])
        member["level"] = determine_member_level(member["points"])
    save_to_disk()
    return member

@_synchronized_store
def delete_member(member_id):
    global MEMBERS
    member = get_member_by_id(member_id)
    if not member:
        return False
    MEMBERS = [m for m in MEMBERS if str(m["id"]).lower() != str(member_id).lower()]
    save_to_disk()
    return True


# ==========================================
# CRUD & FITUR TRANSAKSI (MULTI-ENTITY)
# (Mengintegrasikan Product, Member, & Transaction)
# ==========================================
@_synchronized_store
def get_transactions():
    return TRANSACTIONS

@_synchronized_store
def get_transaction_by_id(trx_id):
    for t in TRANSACTIONS:
        if str(t["id"]).lower() == str(trx_id).lower():
            return t
    return None

@_synchronized_store
def create_transaction(data):
    raw_items = data.get("items", [])
    if not raw_items:
        raise ValueError("Keranjang belanja kosong.")

    cart_items = []
    subtotal = 0

    # 1. Validasi & Kurangi Stok Produk (Entity: Product)
    for item in raw_items:
        product_id = item.get("id")
        qty = int(item.get("quantity", 1))
        product = get_product_by_id(product_id)

        if not product:
            raise ValueError(f"Produk dengan ID {product_id} tidak ditemukan.")
        if product["stock"] < qty:
            raise ValueError(f"Stok produk '{product['name']}' tidak mencukupi (Tersedia: {product['stock']}, Diminta: {qty}).")

        line_total = product["price"] * qty
        subtotal += line_total

        cart_items.append({
            "id": product["id"],
            "name": product["name"],
            "category": product["category"],
            "price": product["price"],
            "quantity": qty,
            "total": line_total,
        })

    # Kurangi stok produk setelah validasi sukses
    for item in raw_items:
        product = get_product_by_id(item.get("id"))
        qty = int(item.get("quantity", 1))
        product["stock"] = max(0, product["stock"] - qty)

    # 2. Perhitungan Diskon & Poin Member (Entity: Member)
    member_id = data.get("member_id")
    member = get_member_by_id(member_id) if member_id else None
    
    discount = round(subtotal * 0.05) if member else 0
    taxable_amount = max(0, subtotal - discount)
    ppn = round(taxable_amount * 0.01)
    grand_total = taxable_amount + ppn

    # Tambah poin member (1 poin tiap pembelanjaan Rp 10.000)
    if member:
        earned_points = int(grand_total // 10000)
        member["points"] += earned_points
        member["level"] = determine_member_level(member["points"])

    # 3. Rekam ke Entitas Transaksi (Entity: Transaction)
    next_num = len(TRANSACTIONS) + 1
    trx_id = f"TRX-{str(next_num).zfill(4)}"
    payment_method = data.get("payment_method", "Tunai")
    cash_received = float(data.get("cash_received", grand_total))
    change_amount = float(data.get("change", max(0.0, cash_received - grand_total)))

    new_trx = {
        "id": trx_id,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "member_id": member["id"] if member else None,
        "member_name": member["name"] if member else "Non-Member (Umum)",
        "cashier_name": data.get("cashier_name", "Kasir"),
        "items": cart_items,
        "subtotal": subtotal,
        "discount": discount,
        "ppn": ppn,
        "total": grand_total,
        "payment_method": payment_method,
        "cash_received": cash_received,
        "change": change_amount,
        "status": "COMPLETED",
    }
    TRANSACTIONS.append(new_trx)
    save_to_disk()
    return new_trx

@_synchronized_store
def delete_transaction(trx_id):
    global TRANSACTIONS
    trx = get_transaction_by_id(trx_id)
    if not trx:
        return False
    TRANSACTIONS = [t for t in TRANSACTIONS if str(t["id"]).lower() != str(trx_id).lower()]
    save_to_disk()
    return True


# ==========================================
# CRUD ENTITAS USER & AUTH
# ==========================================
@_synchronized_store
def get_users():
    return [{"id": u["id"], "username": u["username"], "email": u["email"], "role": u["role"]} for u in USERS]

@_synchronized_store
def authenticate_user(email, password):
    for u in USERS:
        if u["email"].lower() == str(email).lower() and u["password"] == password:
            return {
                "id": u["id"],
                "username": u["username"],
                "email": u["email"],
                "role": u["role"],
            }
    return None

@_synchronized_store
def create_user(data):
    email = data.get("email", "").strip()
    for u in USERS:
        if u["email"].lower() == email.lower():
            raise ValueError("Email sudah terdaftar.")
    
    next_num = len(USERS) + 1
    new_id = f"USR-{str(next_num).zfill(3)}"
    new_user = {
        "id": new_id,
        "username": data.get("username", email.split("@")[0]),
        "email": email,
        "role": data.get("role", "kasir"),
        "password": data.get("password", "123456"),
    }
    USERS.append(new_user)
    save_to_disk()
    return {
        "id": new_user["id"],
        "username": new_user["username"],
        "email": new_user["email"],
        "role": new_user["role"],
    }

@_synchronized_store
def get_stats():
    total_sales = sum(t["total"] for t in TRANSACTIONS)
    total_products = len(PRODUCTS)
    total_members = len(MEMBERS)
    total_transactions = len(TRANSACTIONS)
    low_stock_products = [p for p in PRODUCTS if p["stock"] <= 10]
    return {
        "total_sales": total_sales,
        "total_products": total_products,
        "total_members": total_members,
        "total_transactions": total_transactions,
        "low_stock_count": len(low_stock_products),
    }
