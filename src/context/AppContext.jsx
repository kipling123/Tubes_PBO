import React, { createContext, useMemo, useState } from 'react';

export const AppContext = createContext(null);

const initialProducts = [
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

const formatReceiptId = (number) => `TRX-${String(number).padStart(4, '0')}`;

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState(initialProducts);
  const [members, setMembers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);

  const addProduct = (product) => {
    const nextId = `BRG-${String(products.length + 1).padStart(3, '0')}`;
    setProducts((currentProducts) => [
      ...currentProducts,
      {
        id: nextId,
        name: product.name,
        category: product.category,
        price: Number(product.price) || 0,
        stock: Number(product.stock) || 0,
        details: product.details || '-',
      },
    ]);
  };

  const registerMember = (member) => {
    const nextId = `MBR-${String(members.length + 1).padStart(3, '0')}`;
    setMembers((currentMembers) => [
      ...currentMembers,
      {
        id: nextId,
        name: member.name,
        email: member.email,
        points: Number(member.points) || 0,
      },
    ]);
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

  const checkoutCart = () => {
    if (cart.length === 0) {
      return;
    }

    const cartItems = cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.id);
        if (!product) {
          return null;
        }

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

    if (cartItems.length === 0) {
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const member = members.find((entry) => entry.id === selectedMemberId);
    const discount = member ? Math.round(subtotal * 0.05) : 0;
    const ppn = Math.round((subtotal - discount) * 0.11);
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
    };

    setProducts((currentProducts) => currentProducts.map((product) => {
      const cartItem = cart.find((item) => item.id === product.id);
      if (!cartItem) {
        return product;
      }

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
  }), [
    activeTab,
    cart,
    currentReceipt,
    members,
    products,
    salesHistory,
    selectedMemberId,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext;
