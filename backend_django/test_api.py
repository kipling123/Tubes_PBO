import os
import sys
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pos_backend.settings')
import django
django.setup()

from django.test import Client

client = Client()

def run_tests():
    print("=== TEST 1: API ROOT ===")
    res = client.get('/api/')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print("API Root OK:", res.json()['message'])

    print("\n=== TEST 2: PRODUCT CRUD ===")
    # Read
    res = client.get('/api/products/')
    assert res.status_code == 200
    products = res.json()['data']
    print(f"Products count: {len(products)}")
    
    # Create
    new_prod_data = {
        "name": "Kopi Arabika Toraja 250g",
        "category": "Minuman",
        "price": 65000,
        "stock": 25,
        "details": "Roast date: 2026-11-01"
    }
    res = client.post('/api/products/', data=json.dumps(new_prod_data), content_type='application/json')
    assert res.status_code == 201
    created_prod = res.json()['data']
    prod_id = created_prod['id']
    print(f"Created Product: {prod_id} - {created_prod['name']}")

    # Update
    res = client.put(f'/api/products/{prod_id}/', data=json.dumps({"stock": 30, "price": 60000}), content_type='application/json')
    assert res.status_code == 200
    assert res.json()['data']['stock'] == 30
    print(f"Updated Product {prod_id} stock to 30")

    # Detail
    res = client.get(f'/api/products/{prod_id}/')
    assert res.status_code == 200
    print(f"Fetched Product Detail: {res.json()['data']['name']}")

    # Delete
    res = client.delete(f'/api/products/{prod_id}/')
    assert res.status_code == 200
    print(f"Deleted Product {prod_id} successfully")

    print("\n=== TEST 3: MEMBER CRUD ===")
    # Read
    res = client.get('/api/members/')
    assert res.status_code == 200
    members = res.json()['data']
    print(f"Members count: {len(members)}")

    # Create
    new_mbr_data = {
        "name": "Dewi Sartika",
        "email": "dewi@telkomuniversity.ac.id",
        "phone": "081299998888",
        "points": 500
    }
    res = client.post('/api/members/', data=json.dumps(new_mbr_data), content_type='application/json')
    assert res.status_code == 201
    created_mbr = res.json()['data']
    mbr_id = created_mbr['id']
    print(f"Created Member: {mbr_id} - {created_mbr['name']} (Level: {created_mbr['level']})")

    # Update
    res = client.put(f'/api/members/{mbr_id}/', data=json.dumps({"points": 1500}), content_type='application/json')
    assert res.status_code == 200
    assert res.json()['data']['level'] == "Silver"
    print(f"Updated Member {mbr_id} points to 1500 (Level: {res.json()['data']['level']})")

    # Detail
    res = client.get(f'/api/members/{mbr_id}/')
    assert res.status_code == 200
    print(f"Fetched Member Detail: {res.json()['data']['name']}")

    print("\n=== TEST 4: MULTI-ENTITY CHECKOUT (Product + Member + Transaction) ===")
    # Stock before checkout
    rice_bowl = client.get('/api/products/BRG-002/').json()['data']
    stock_before = rice_bowl['stock']
    member_before = client.get(f'/api/members/{mbr_id}/').json()['data']
    points_before = member_before['points']

    checkout_payload = {
        "member_id": mbr_id,
        "cashier_name": "Kasir Rafi",
        "items": [
            {
                "id": "BRG-002",
                "quantity": 2
            }
        ]
    }
    res = client.post('/api/checkout/', data=json.dumps(checkout_payload), content_type='application/json')
    assert res.status_code == 201, f"Checkout failed: {res.json()}"
    receipt = res.json()['data']
    print(f"Checkout Success! TRX ID: {receipt['id']}, Total: Rp {receipt['total']:,}")
    print(f"  Subtotal: Rp {receipt['subtotal']:,}")
    print(f"  Member Discount (5%): Rp {receipt['discount']:,}")
    print(f"  PPN (1%): Rp {receipt['ppn']:,}")

    # Verify Product stock was deducted
    rice_bowl_after = client.get('/api/products/BRG-002/').json()['data']
    print(f"  Stock BRG-002: {stock_before} -> {rice_bowl_after['stock']} (Deducted by 2)")
    assert rice_bowl_after['stock'] == stock_before - 2

    # Verify Member points were increased
    member_after = client.get(f'/api/members/{mbr_id}/').json()['data']
    print(f"  Points Member {mbr_id}: {points_before} -> {member_after['points']} (Awarded loyalty points)")
    assert member_after['points'] > points_before

    # Verify Transaction is listed
    res = client.get('/api/transactions/')
    trx_list = res.json()['data']
    assert any(t['id'] == receipt['id'] for t in trx_list)
    print(f"  Transaction recorded in TRANSACTIONS list. Total count: {len(trx_list)}")

    print("\n=== TEST 5: AUTHENTICATION ===")
    res = client.post('/api/auth/login/', data=json.dumps({"email": "admin@store.com", "password": "admin123"}), content_type='application/json')
    assert res.status_code == 200
    print("Login Admin OK:", res.json()['data']['username'], res.json()['data']['role'])

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
