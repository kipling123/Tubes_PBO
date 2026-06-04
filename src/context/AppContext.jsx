import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

  // Product Inventory State
  const [products, setProducts] = useState([
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
  ]);

  // Members Database State
  const [members, setMembers] = useState([
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
  ]);

  // Cart / Cashier State
  const [cart, setCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [currentReceipt, setCurrentReceipt] = useState(null);

  // Auto-generate transaction number
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

  // CRUD & Actions
  const addProduct = (newProduct) => {
    const prefix = newProduct.category === 'Elektronik' ? 'OBJ-ELC-' : 'OBJ-FOD-';
    const randomId = Math.floor(202000 + Math.random() * 8000);
    const id = `${prefix}${randomId}`;
    
    setProducts((prev) => [
      ...prev,
      {
        id,
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock)
      }
    ]);
  };

  const registerMember = (newMember) => {
    const nextIdNum = members.length + 1;
    const id = `PEL-${String(nextIdNum).padStart(3, '0')}`;
    
    setMembers((prev) => [
      ...prev,
      {
        id,
        ...newMember,
        points: Number(newMember.points || 0)
      }
    ]);
  };

  const addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === productId);
      if (existing) {
        if (existing.quantity >= product.stock) return prevCart; // limit by stock
        return prevCart.map(item =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { id: productId, quantity: 1 }];
      }
    });
  };

  const updateCartQty = (productId, delta) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > product.stock) return item; // limit by stock
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== productId));
  };

  const checkoutCart = () => {
    if (cart.length === 0) return;

    // Calculate invoice totals
    const cartDetails = cart.map(item => {
      const prod = products.find(p => p.id === item.id);
      return {
        ...prod,
        quantity: item.quantity,
        total: prod.price * item.quantity
      };
    });

    const subtotal = cartDetails.reduce((sum, item) => sum + item.total, 0);
    const isMember = !!selectedMemberId;
    const discount = isMember ? Math.round(subtotal * 0.05) : 0;
    const ppn = Math.round((subtotal - discount) * 0.11);
    const total = subtotal - discount + ppn;

    // Deduct stock
    setProducts(prevProducts => 
      prevProducts.map(prod => {
        const cartItem = cart.find(c => c.id === prod.id);
        if (cartItem) {
          return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
        }
        return prod;
      })
    );

    // Update member points: Rp 10.000 spent = 1 point
    let memberName = '';
    if (isMember) {
      const earnedPoints = Math.floor((subtotal - discount) / 10000);
      setMembers(prevMembers => 
        prevMembers.map(m => {
          if (m.id === selectedMemberId) {
            memberName = m.name;
            return { ...m, points: m.points + earnedPoints };
          }
          return m;
        })
      );
    }

    // Save receipt representation
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
    setCart([]);
    setSelectedMemberId('');
    setCurrentTrxId(generateTrxId()); // Prep next trx ID
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
        setCurrentReceipt
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
