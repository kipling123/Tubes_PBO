import React, { createContext, useMemo, useState, useEffect, useCallback } from 'react';

export const AppContext = createContext(null);

const API_BASE = 'http://127.0.0.1:8000/api';

const defaultProducts = [
  {
    id: 'BRG-001',
    name: 'Kulkas Showcase LG Smart',
    category: 'Elektronik',
    price: 7500000,
    stock: 12,
    details: '24 Bulan Garansi',
  },
  {
    id: 'BRG-002',
    name: 'Rice Bowl Premium',
    category: 'Makanan',
    price: 35000,
    stock: 40,
    details: 'Kedaluwarsa: Des 2026',
  },
  {
    id: 'BRG-003',
    name: 'Smart TV 43 Inch',
    category: 'Elektronik',
    price: 4200000,
    stock: 8,
    details: 'Garansi Resmi 1 Tahun',
  },
  {
    id: 'BRG-004',
    name: 'Susu UHT 1 Liter',
    category: 'Makanan',
    price: 18000,
    stock: 55,
    details: 'Kedaluwarsa: Jan 2027',
  },
];

const defaultMembers = [
  {
    id: 'MBR-001',
    name: 'Ahmad Dani',
    email: 'ahmad@gmail.com',
    points: 1250,
  },
  {
    id: 'MBR-002',
    name: 'Siti Nurhaliza',
    email: 'siti@gmail.com',
    points: 2400,
  },
];

const formatReceiptId = (number) => `TRX-${String(number).padStart(4, '0')}`;

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load awal dari localStorage agar saat refresh data langsung tersedia
  const [products, setProductsState] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_products');
      return saved ? JSON.parse(saved) : defaultProducts;
    } catch {
      return defaultProducts;
    }
  });

  const [members, setMembersState] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_members');
      return saved ? JSON.parse(saved) : defaultMembers;
    } catch {
      return defaultMembers;
    }
  });

  const [salesHistory, setSalesHistoryState] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_sales_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Helper setter dengan persistensi localStorage
  const setProducts = (updater) => {
    setProductsState((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('pos_products', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const setMembers = (updater) => {
    setMembersState((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('pos_members', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const setSalesHistory = (updater) => {
    setSalesHistoryState((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('pos_sales_history', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Sync dengan backend Django
  const fetchBackendData = useCallback(async () => {
    try {
      const [resProd, resMbr, resTrx] = await Promise.all([
        fetch(`${API_BASE}/products/`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/members/`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/transactions/`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (resProd && resProd.data && resProd.data.length > 0) {
        setProducts(resProd.data);
        setBackendOnline(true);
      }
      if (resMbr && resMbr.data && resMbr.data.length > 0) {
        setMembers(resMbr.data);
      }
      if (resTrx && resTrx.data && resTrx.data.length > 0) {
        setSalesHistory(resTrx.data.map(t => ({
          ...t,
          trxId: t.id,
        })));
      }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  const addProduct = async (product) => {
    let savedProduct = null;
    try {
      const res = await fetch(`${API_BASE}/products/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const json = await res.json();
        savedProduct = json.data;
      }
    } catch {
      // Fallback lokal jika backend offline
    }

    if (!savedProduct) {
      const nextId = `BRG-${String(products.length + 1).padStart(3, '0')}`;
      savedProduct = {
        id: nextId,
        name: product.name,
        category: product.category,
        price: Number(product.price) || 0,
        stock: Number(product.stock) || 0,
        details: product.details || '-',
      };
    }

    setProducts((currentProducts) => [...currentProducts, savedProduct]);
    return savedProduct;
  };

  const updateProduct = async (id, updatedFields) => {
    try {
      await fetch(`${API_BASE}/products/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
    } catch (e) {
      console.error(e);
    }

    setProducts((currentProducts) =>
      currentProducts.map((p) =>
        p.id === id ? { ...p, ...updatedFields } : p
      )
    );
  };

  const deleteProduct = async (id) => {
    try {
      await fetch(`${API_BASE}/products/${id}/`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error(e);
    }

    setProducts((currentProducts) =>
      currentProducts.filter((p) => p.id !== id)
    );
  };

  const registerMember = async (member) => {
    let savedMember = null;
    try {
      const res = await fetch(`${API_BASE}/members/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (res.ok) {
        const json = await res.json();
        savedMember = json.data;
      }
    } catch {
      // Fallback lokal jika backend offline
    }

    if (!savedMember) {
      const nextId = `MBR-${String(members.length + 1).padStart(3, '0')}`;
      savedMember = {
        id: nextId,
        name: member.name,
        email: member.email,
        points: Number(member.points) || 0,
      };
    }

    setMembers((currentMembers) => [...currentMembers, savedMember]);
    return savedMember;
  };

  const addToCart = (productId) => {
    const targetProduct = products.find((product) => product.id === productId);
    if (!targetProduct || targetProduct.stock <= 0) {
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === productId);
      if (existingItem && existingItem.quantity >= targetProduct.stock) {
        return currentCart;
      }

      if (existingItem) {
        return currentCart.map((item) => (
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }

      return [...currentCart, { id: productId, quantity: 1 }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart((currentCart) => currentCart
      .map((item) => (
        item.id === productId
          ? { ...item, quantity: item.quantity + delta }
          : item
      ))
      .filter((item) => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  };

  const checkoutCart = async (paymentDetails = {}) => {
    if (cart.length === 0) {
      return;
    }

    const paymentMethod = paymentDetails.paymentMethod || 'Tunai';
    const cashReceived = paymentDetails.cashReceived !== undefined ? Number(paymentDetails.cashReceived) : 0;
    const change = paymentDetails.change !== undefined ? Number(paymentDetails.change) : 0;

    // Coba checkout lewat endpoint backend Django (Multi-Entity)
    try {
      const checkoutPayload = {
        member_id: selectedMemberId || null,
        cashier_name: 'Kasir',
        items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
        payment_method: paymentMethod,
        cash_received: cashReceived,
        change: change,
      };

      const res = await fetch(`${API_BASE}/checkout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      });

      if (res.ok) {
        const json = await res.json();
        const trx = json.data;
        const receipt = {
          ...trx,
          trxId: trx.id,
          member: trx.member_id ? { id: trx.member_id, name: trx.member_name } : null,
          paymentMethod: trx.payment_method || paymentMethod,
          cashReceived: trx.cash_received !== undefined ? trx.cash_received : cashReceived,
          change: trx.change !== undefined ? trx.change : change,
        };
        setCurrentReceipt(receipt);
        setSalesHistory(curr => [...curr, receipt]);
        setCart([]);
        setSelectedMemberId('');
        fetchBackendData();
        return;
      }
    } catch {
      // Fallback ke proses lokal
    }

    // Fallback proses lokal jika backend offline
    const cartItems = cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.id);
        if (!product) return null;
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: item.quantity,
          total: product.price * item.quantity,
        };
      })
      .filter(Boolean);

    if (cartItems.length === 0) return;

    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const member = members.find((entry) => entry.id === selectedMemberId);
    const discount = member ? Math.round(subtotal * 0.05) : 0;
    const ppn = Math.round((subtotal - discount) * 0.01);
    const total = subtotal - discount + ppn;
    const trxId = formatReceiptId(salesHistory.length + 1);
    const receipt = {
      trxId,
      date: new Date().toLocaleString('id-ID'),
      member: member ? { id: member.id, name: member.name } : null,
      items: cartItems,
      subtotal,
      discount,
      ppn,
      total,
      paymentMethod,
      cashReceived: cashReceived || total,
      change: change || Math.max(0, (cashReceived || total) - total),
    };

    setProducts((currentProducts) => currentProducts.map((product) => {
      const cartItem = cart.find((item) => item.id === product.id);
      if (!cartItem) return product;
      return {
        ...product,
        stock: Math.max(0, product.stock - cartItem.quantity),
      };
    }));

    if (member) {
      setMembers((currentMembers) => currentMembers.map((entry) => (
        entry.id === member.id
          ? { ...entry, points: entry.points + Math.floor(total / 10000) }
          : entry
      )));
    }

    setSalesHistory((currentHistory) => [...currentHistory, receipt]);
    setCurrentReceipt(receipt);
    setCart([]);
    setSelectedMemberId('');
  };

  const value = useMemo(() => ({
    activeTab,
    setActiveTab,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    members,
    registerMember,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    selectedMemberId,
    setSelectedMemberId,
    checkoutCart,
    currentTrxId: formatReceiptId(salesHistory.length + 1),
    currentReceipt,
    setCurrentReceipt,
    salesHistory,
    backendOnline,
    refreshBackend: fetchBackendData,
  }), [
    activeTab,
    cart,
    currentReceipt,
    members,
    products,
    salesHistory,
    selectedMemberId,
    backendOnline,
    fetchBackendData,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
