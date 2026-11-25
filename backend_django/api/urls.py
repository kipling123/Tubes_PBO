from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_root, name='api_root'),
    path('health/', views.health_check, name='health_check'),
    path('stats/', views.stats_view, name='stats'),
    
    # Entity 1: Products (CRUD)
    path('products/', views.product_list_create, name='product_list_create'),
    path('products/<str:pk>/', views.product_detail, name='product_detail'),
    
    # Entity 2: Members (CRUD)
    path('members/', views.member_list_create, name='member_list_create'),
    path('members/<str:pk>/', views.member_detail, name='member_detail'),
    
    # Entity 3: Transactions (CRUD & Checkout Multi-Entity)
    path('transactions/', views.transaction_list_create, name='transaction_list_create'),
    path('transactions/<str:pk>/', views.transaction_detail, name='transaction_detail'),
    path('checkout/', views.transaction_list_create, name='checkout_alias'),
    
    # Entity 4: Users & Auth
    path('users/', views.user_list_create, name='user_list_create'),
    path('auth/login/', views.auth_login, name='auth_login'),
]
