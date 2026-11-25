import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from . import data_store

def parse_json_body(request):
    try:
        if request.body:
            return json.loads(request.body.decode('utf-8'))
        return {}
    except Exception:
        return {}


# ==========================================
# API ROOT & STATS
# ==========================================
def health_check(request):
    """Lightweight endpoint for load balancer target health checks."""
    return JsonResponse({"status": "ok"})


def api_root(request):
    return JsonResponse({
        "status": "success",
        "message": "POS Cloud Computing Tugas 9 Backend (Django Architecture)",
        "version": "1.0.0",
        "persistence": "In-Memory Python Dict/JSON Store (No Database, conforming to Tugas 9)",
        "entities": ["Product", "Member", "Transaction", "User"],
        "endpoints": {
            "products": "/api/products/",
            "members": "/api/members/",
            "transactions": "/api/transactions/",
            "checkout": "/api/checkout/",
            "users": "/api/users/",
            "login": "/api/auth/login/",
            "stats": "/api/stats/"
        }
    })

def stats_view(request):
    return JsonResponse({"status": "success", "data": data_store.get_stats()})


# ==========================================
# 1. ENTITAS PRODUK (CRUD)
# ==========================================
@csrf_exempt
def product_list_create(request):
    if request.method == 'GET':
        products = data_store.get_products()
        return JsonResponse({"status": "success", "data": products}, safe=False)
    
    elif request.method == 'POST':
        payload = parse_json_body(request)
        if not payload.get("name") or payload.get("price") is None:
            return JsonResponse({"status": "error", "message": "Nama produk dan harga wajib diisi."}, status=400)
        
        new_prod = data_store.create_product(payload)
        return JsonResponse({"status": "success", "message": "Produk berhasil ditambahkan.", "data": new_prod}, status=201)
    
    return JsonResponse({"status": "error", "message": "Metode HTTP tidak diizinkan."}, status=405)


@csrf_exempt
def product_detail(request, pk):
    product = data_store.get_product_by_id(pk)
    if not product:
        return JsonResponse({"status": "error", "message": f"Produk dengan ID {pk} tidak ditemukan."}, status=404)
    
    if request.method == 'GET':
        return JsonResponse({"status": "success", "data": product})
    
    elif request.method in ['PUT', 'PATCH']:
        payload = parse_json_body(request)
        updated = data_store.update_product(pk, payload)
        return JsonResponse({"status": "success", "message": "Produk berhasil diperbarui.", "data": updated})
    
    elif request.method == 'DELETE':
        success = data_store.delete_product(pk)
        if success:
            return JsonResponse({"status": "success", "message": f"Produk {pk} berhasil dihapus."})
        return JsonResponse({"status": "error", "message": "Gagal menghapus produk."}, status=400)
    
    return JsonResponse({"status": "error", "message": "Metode HTTP tidak diizinkan."}, status=405)


# ==========================================
# 2. ENTITAS MEMBER (CRUD)
# ==========================================
@csrf_exempt
def member_list_create(request):
    if request.method == 'GET':
        members = data_store.get_members()
        return JsonResponse({"status": "success", "data": members}, safe=False)
    
    elif request.method == 'POST':
        payload = parse_json_body(request)
        if not payload.get("name"):
            return JsonResponse({"status": "error", "message": "Nama member wajib diisi."}, status=400)
        
        new_mbr = data_store.create_member(payload)
        return JsonResponse({"status": "success", "message": "Member berhasil didaftarkan.", "data": new_mbr}, status=201)
    
    return JsonResponse({"status": "error", "message": "Metode HTTP tidak diizinkan."}, status=405)


@csrf_exempt
def member_detail(request, pk):
    member = data_store.get_member_by_id(pk)
    if not member:
        return JsonResponse({"status": "error", "message": f"Member dengan ID {pk} tidak ditemukan."}, status=404)
    
    if request.method == 'GET':
        return JsonResponse({"status": "success", "data": member})
    
    elif request.method in ['PUT', 'PATCH']:
        payload = parse_json_body(request)
        updated = data_store.update_member(pk, payload)
        return JsonResponse({"status": "success", "message": "Member berhasil diperbarui.", "data": updated})
    
    elif request.method == 'DELETE':
        success = data_store.delete_member(pk)
        if success:
            return JsonResponse({"status": "success", "message": f"Member {pk} berhasil dihapus."})
        return JsonResponse({"status": "error", "message": "Gagal menghapus member."}, status=400)
    
    return JsonResponse({"status": "error", "message": "Metode HTTP tidak diizinkan."}, status=405)


# ==========================================
# 3. ENTITAS TRANSAKSI (CRUD & CHECKOUT MULTI-ENTITY)
# ==========================================
@csrf_exempt
def transaction_list_create(request):
    if request.method == 'GET':
        transactions = data_store.get_transactions()
        return JsonResponse({"status": "success", "data": transactions}, safe=False)
    
    elif request.method == 'POST':
        payload = parse_json_body(request)
        try:
            new_trx = data_store.create_transaction(payload)
            return JsonResponse({
                "status": "success",
                "message": "Checkout transaksi kasir berhasil diproses.",
                "data": new_trx
            }, status=201)
        except ValueError as err:
            return JsonResponse({"status": "error", "message": str(err)}, status=400)
        except Exception as err:
            return JsonResponse({"status": "error", "message": f"Terjadi kesalahan: {str(err)}"}, status=500)
    
    return JsonResponse({"status": "error", "message": "Metode HTTP tidak diizinkan."}, status=405)


@csrf_exempt
def transaction_detail(request, pk):
    trx = data_store.get_transaction_by_id(pk)
    if not trx:
        return JsonResponse({"status": "error", "message": f"Transaksi dengan ID {pk} tidak ditemukan."}, status=404)
    
    if request.method == 'GET':
        return JsonResponse({"status": "success", "data": trx})
    
    elif request.method == 'DELETE':
        success = data_store.delete_transaction(pk)
        if success:
            return JsonResponse({"status": "success", "message": f"Transaksi {pk} berhasil dibatalkan/dihapus."})
        return JsonResponse({"status": "error", "message": "Gagal menghapus transaksi."}, status=400)
    
    return JsonResponse({"status": "error", "message": "Metode HTTP tidak diizinkan."}, status=405)


# ==========================================
# 4. USER & AUTENTIKASI
# ==========================================
@csrf_exempt
def user_list_create(request):
    if request.method == 'GET':
        users = data_store.get_users()
        return JsonResponse({"status": "success", "data": users}, safe=False)
    
    elif request.method == 'POST':
        payload = parse_json_body(request)
        try:
            user = data_store.create_user(payload)
            return JsonResponse({"status": "success", "message": "Pengguna berhasil didaftarkan.", "data": user}, status=201)
        except ValueError as err:
            return JsonResponse({"status": "error", "message": str(err)}, status=400)
    
    return JsonResponse({"status": "error", "message": "Metode HTTP tidak diizinkan."}, status=405)


@csrf_exempt
def auth_login(request):
    if request.method != 'POST':
        return JsonResponse({"status": "error", "message": "Harus menggunakan metode POST."}, status=405)
    
    payload = parse_json_body(request)
    email = payload.get("email")
    password = payload.get("password")
    
    user = data_store.authenticate_user(email, password)
    if user:
        return JsonResponse({
            "status": "success",
            "message": "Login berhasil.",
            "data": user
        })
    return JsonResponse({"status": "error", "message": "Email atau password salah."}, status=401)
