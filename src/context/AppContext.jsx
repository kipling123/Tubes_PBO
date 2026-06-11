import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const initialProducts = [
  {
    id: 'OBJ-ELC-202601',
    name: 'Kulkas Showcase LG Smart',
    category: 'Elektronik',
    price: 7500000,
    stock: 18,
    details: '24 Bulan Garansi'
  },
  {
    id: 'OBJ-FOD-202644',
    name: 'Susu Almond Premium 1L',
    category: 'Makanan',
    price: 45000,
    stock: 140,
    details: 'Kedaluwarsa: Des 2026'
  },
  {
    id: 'OBJ-ELC-202602',
    name: 'Rice Cooker Yong Ma Digital',
    category: 'Elektronik',
    price: 850000,
    stock: 5,
    details: '12 Bulan Garansi'
  },
  {
    id: 'OBJ-FOD-202645',
    name: 'Roti Tawar Gandum Whole Wheat',
    category: 'Makanan',
    price: 18000,
    stock: 8,
    details: 'Kedaluwarsa: Des 2026'
  }
];

const initialMembers = [
  {
    id: 'PEL-001',
    name: 'Nazmi Rio Rabani',
    email: 'nazmi@student.telkom.ac.id',
    points: 2450
  },
  {
    id: 'PEL-002',
    name: 'Rafi Ikbar Fahrezy',
    email: 'rafi@student.telkom.ac.id',
    points: 850
  }
];

const buildHeaders = () => ({ 'Content-Type': 'application/json' });

const fetchJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildHeaders(),
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState(initialProducts);
  const [members, setMembers] = useState(initialMembers);
  const [cart, setCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);

  const generateTrxId = () => {
    const today = new Date();
    const dateStr = today.getFullYear() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');
    const random = String(Math.floor(100 + Math.random() * 900));
    return `TRX-${dateStr}-${random}`;
  };

  const [currentTrxId, setCurrentTrxId] = useState('');

  useEffect(() => {
    setCurrentTrxId(generateTrxId());
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [productData, memberData] = await Promise.all([
          fetchJson('/products'),
          fetchJson('/members')
        ]);

        if (Array.isArray(productData)) {
          setProducts(productData.map((product) => ({
            ...product,
            price: Number(product.price),
            stock: Number(product.stock)
          })));
        }

        if (Array.isArray(memberData)) {
          setMembers(memberData.map((member) => ({
            ...member,
            points: Number(member.points || 0)
          })));
        }
      } catch (error) {
        console.warn('Backend belum tersedia, memakai data lokal:', error.message);
      }
    };

    loadInitialData();
  }, []);

  const addProduct = async (newProduct) => {
    const payload = {
      id: '',
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      details: newProduct.details || '-'
    };

    try {
      const response = await fetchJson('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const product = response.product || {
        ...payload,
        id: payload.id || `OBJ-${Date.now()}`
      };

      setProducts((prev) => [...prev, product]);
      return product;
    } catch (error) {
      const prefix = newProduct.category === 'Elektronik' ? 'OBJ-ELC-' : 'OBJ-FOD-';
      const randomId = Math.floor(202000 + Math.random() * 8000);
      const fallbackProduct = {
        id: `${prefix}${randomId}`,
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock)
      };

      setProducts((prev) => [...prev, fallbackProduct]);
      console.warn('Gagal menyimpan produk ke backend, memakai mode lokal:', error.message);
      return fallbackProduct;
    }
  };

  const registerMember = async (newMember) => {
    const nextIdNum = members.length + 1;
    const payload = {
      id: `PEL-${String(nextIdNum).padStart(3, '0')}`,
      name: newMember.name,
      email: newMember.email,
      points: Number(newMember.points || 0)
    };

    try {
      const response = await fetchJson('/members', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const member = response.member || payload;
      setMembers((prev) => [...prev, member]);
      return member;
    } catch (error) {
      setMembers((prev) => [...prev, payload]);
      console.warn('Gagal menyimpan member ke backend, memakai mode lokal:', error.message);
      return payload;
    }
  };

  const addToCart = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === productId);
      if (existing) {
        if (existing.quantity >= product.stock) return prevCart;
        return prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prevCart, { id: productId, quantity: 1 }];
    });
  };

  const updateCartQty = (productId, delta) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const checkoutCart = async () => {
    if (cart.length === 0) return;

    const cartDetails = cart.map((item) => {
      const prod = products.find((p) => p.id === item.id);
      return {
        ...prod,
        quantity: item.quantity,
        total: prod ? prod.price * item.quantity : 0
      };
    });

    const subtotal = cartDetails.reduce((sum, item) => sum + item.total, 0);
    const isMember = !!selectedMemberId;
    const discount = isMember ? Math.round(subtotal * 0.05) : 0;
    const ppn = Math.round((subtotal - discount) * 0.11);
    const total = subtotal - discount + ppn;

    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const cartItem = cart.find((c) => c.id === prod.id);
        if (cartItem) {
          return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
        }
        return prod;
      })
    );

    let memberName = '';
    if (isMember) {
      const earnedPoints = Math.floor((subtotal - discount) / 10000);
      setMembers((prevMembers) =>
        prevMembers.map((m) => {
          if (m.id === selectedMemberId) {
            memberName = m.name;
            return { ...m, points: m.points + earnedPoints };
          }
          return m;
        })
      );
    }

    try {
      await fetchJson('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          trx_id: currentTrxId,
          member_id: selectedMemberId || null,
          subtotal,
          discount,
          ppn,
          total,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            price: products.find((p) => p.id === item.id)?.price || 0
          }))
        })
      });
    } catch (error) {
      console.warn('Checkout backend tidak tersedia, memakai mode lokal:', error.message);
    }

    const receiptData = {
      trxId: currentTrxId,
      date: new Date().toLocaleString('id-ID'),
      items: cartDetails,
      subtotal,
      discount,
      ppn,
      total,
      member: isMember ? { id: selectedMemberId, name: memberName } : null
    };

    setCurrentReceipt(receiptData);
    setSalesHistory((prev) => [...prev, receiptData]);
    setCart([]);
    setSelectedMemberId('');
    setCurrentTrxId(generateTrxId());
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        products,
        addProduct,
        members,
        registerMember,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        selectedMemberId,
        setSelectedMemberId,
        checkoutCart,
        currentTrxId,
        currentReceipt,
        setCurrentReceipt,
        salesHistory
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
