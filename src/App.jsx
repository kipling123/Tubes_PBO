import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import AddProductDrawer from './components/tambahProduk';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  Search, 
  Package, 
  Coins, 
  Folder, 
  AlertTriangle, 
  ShoppingCart, 
  UserPlus, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  X, 
  Sparkles,
  Printer,
  Moon,
  Sun,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ChevronDown,
  Layers,
  Edit3,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2
} from 'lucide-react';
import loginIllustration from './assets/login-illustration.png';
import loginAppIcon from './assets/login-app-icon.png';
import CashflowView from './components/CashflowView';
import FinancialReportsView from './components/FinancialReportsView';
import TeamAccessView from './components/TeamAccessView';
import SalesRecapView from './components/SalesRecapView';

function App() {
  const {
    activeTab,
    setActiveTab,
    products,
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
    salesHistory,
    updateProduct,
    deleteProduct
  } = useContext(AppContext);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai'); // 'Tunai', 'QRIS', 'Debit', 'Transfer Bank'
  const [cashGiven, setCashGiven] = useState('');

  // Modal & Dropdown Aksi Produk (Atur Stok, Edit, Hapus)
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [adjustStockModalItem, setAdjustStockModalItem] = useState(null);
  const [adjustMode, setAdjustMode] = useState('add'); // 'add', 'subtract', 'set'
  const [adjustQty, setAdjustQty] = useState('');
  
  const [editProductModalItem, setEditProductModalItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Elektronik');
  const [editPrice, setEditPrice] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cashierSearchQuery, setCashierSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('pos_authenticated') === 'true';
  });
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('pos_active_role') || 'kasir';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerRole, setRegisterRole] = useState('kasir');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_registered_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // fungsi buat member
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPoints, setMemberPoints] = useState('');

  // Theme toggle effect
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      htmlElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  // format keunganan ke Rupiah
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // member level berdasarkan poin
  const getMemberLevel = (points) => {
    if (points >= 2000) return { label: 'Gold', class: 'gold' };
    if (points >= 1000) return { label: 'Silver', class: 'silver' };
    return { label: 'Bronze', class: 'bronze' };
  };

  const authCredentials = {
    pemilik: {
      email: 'owner@toko.com',
      password: 'owner123'
    },
    admin: {
      email: 'admin@toko.com',
      password: 'admin123'
    },
    kasir: {
      email: 'kasir@toko.com',
      password: 'kasir123'
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setLoginError('');
    setRegisterSuccess('');

    const trimmedEmail = loginEmail.trim().toLowerCase();
    const trimmedPass = loginPassword.trim();

    // 1. Cek akun bawaan
    const credentials = authCredentials[activeRole];
    const isBuiltInValid = credentials && trimmedEmail === credentials.email.toLowerCase() && trimmedPass === credentials.password;

    // 2. Cek akun yang didaftarkan (baca state & localStorage)
    let currentUsers = registeredUsers;
    try {
      const saved = localStorage.getItem('pos_registered_users');
      if (saved) currentUsers = JSON.parse(saved);
    } catch {}

    const registeredUser = currentUsers.find((user) =>
      user.email.trim().toLowerCase() === trimmedEmail &&
      user.password === trimmedPass
    );

    if (!isBuiltInValid && !registeredUser) {
      setLoginError('Email / password tidak sesuai atau akun belum terdaftar.');
      return;
    }

    const targetRole = registeredUser ? registeredUser.role : activeRole;
    setActiveRole(targetRole);
    setIsAuthenticated(true);
    localStorage.setItem('pos_authenticated', 'true');
    localStorage.setItem('pos_active_role', targetRole);
    setLoginError('');
    setSearchQuery('');
    setCashierSearchQuery('');

    if (targetRole === 'kasir') {
      setActiveTab('cashier');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleRegisterSubmit = (event) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    const trimmedEmail = registerEmail.trim();
    const trimmedUsername = registerUsername.trim();
    const trimmedPass = registerPassword.trim();

    if (!trimmedEmail || !trimmedUsername || !trimmedPass) {
      setRegisterError('Semua field wajib diisi.');
      return;
    }
    if (trimmedPass.length < 6) {
      setRegisterError('Password minimal 6 karakter.');
      return;
    }

    let currentUsers = registeredUsers;
    try {
      const saved = localStorage.getItem('pos_registered_users');
      if (saved) currentUsers = JSON.parse(saved);
    } catch {}

    if (currentUsers.some((user) => user.email.toLowerCase() === trimmedEmail.toLowerCase())) {
      setRegisterError('Email sudah terdaftar. Silakan gunakan email lain atau langsung masuk.');
      return;
    }

    const newUser = {
      role: registerRole,
      email: trimmedEmail,
      username: trimmedUsername,
      password: trimmedPass,
    };

    const updated = [...currentUsers, newUser];
    setRegisteredUsers(updated);
    try {
      localStorage.setItem('pos_registered_users', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Simpan ke backend Django
    try {
      fetch('http://127.0.0.1:8000/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(() => {});
    } catch {}

    // Otomatis langsung masuk sesuai peran yang dipilih saat daftar
    const targetRole = registerRole;
    setActiveRole(targetRole);
    setIsAuthenticated(true);
    localStorage.setItem('pos_authenticated', 'true');
    localStorage.setItem('pos_active_role', targetRole);

    if (targetRole === 'kasir') {
      setActiveTab('cashier');
    } else {
      setActiveTab('dashboard');
    }

    setIsRegisterMode(false);
    setRegisterEmail('');
    setRegisterUsername('');
    setRegisterPassword('');
    setRegisterRole('kasir');
  };

  function setActiveMemberDefault() {
    if (activeRole === 'kasir') {
      setActiveTab('cashier');
    } else {
      setActiveTab('cashflow');
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pos_authenticated');
    localStorage.removeItem('pos_active_role');
    setActiveRole('kasir');
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setSelectedMemberId('');
  };

  const handleAddUser = (user) => {
    const updated = [...registeredUsers, user];
    setRegisteredUsers(updated);
    try {
      localStorage.setItem('pos_registered_users', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    try {
      fetch('http://127.0.0.1:8000/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      }).catch(() => {});
    } catch {}
  };

  const handleDeleteUser = (email) => {
    if (confirm(`Yakin ingin menghapus akun staf dengan email ${email}?`)) {
      const updated = registeredUsers.filter(u => u.email !== email);
      setRegisteredUsers(updated);
      try {
        localStorage.setItem('pos_registered_users', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const kasirTabs = ['cashier', 'sales_recap', 'inventory', 'members'];
      const ownerTabs = ['cashflow', 'financial_reports', 'team_access'];
      const allowedTabs = activeRole === 'kasir' ? kasirTabs : ownerTabs;
      if (!allowedTabs.includes(activeTab)) {
        setActiveTab(allowedTabs[0]);
      }
    }
  }, [activeRole, activeTab, isAuthenticated, setActiveTab]);

  // Dashboard Stats Calculations
  const totalJenis = products.length;
  const totalAset = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const uniqueCategories = new Set(products.map(p => p.category));
  const totalKategori = uniqueCategories.size;
  
  const lowStockThreshold = 10;
  const lowStockProducts = products.filter(p => p.stock <= lowStockThreshold);
  const stokMenipisCount = lowStockProducts.length;
  const totalMenipisUnits = lowStockProducts.reduce((sum, p) => sum + p.stock, 0);

  // Filtered Products for Inventory Table
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  // Handler Aksi Manajemen Stok: Atur Stok
  const openAdjustStock = (product) => {
    setAdjustStockModalItem(product);
    setAdjustMode('add');
    setAdjustQty('10');
  };

  const handleSaveAdjustStock = (e) => {
    e.preventDefault();
    if (!adjustStockModalItem) return;
    const delta = Number(adjustQty) || 0;
    let newStock = adjustStockModalItem.stock;
    if (adjustMode === 'add') {
      newStock += delta;
    } else if (adjustMode === 'subtract') {
      newStock = Math.max(0, newStock - delta);
    } else if (adjustMode === 'set') {
      newStock = Math.max(0, delta);
    }

    updateProduct(adjustStockModalItem.id, { stock: newStock });
    setAdjustStockModalItem(null);
  };

  // Handler Aksi Manajemen Stok: Edit Produk
  const openEditProduct = (product) => {
    setEditProductModalItem(product);
    setEditName(product.name);
    setEditCategory(product.category || 'Elektronik');
    setEditPrice(String(product.price));
    setEditDetails(product.details || '');
  };

  const handleSaveEditProduct = (e) => {
    e.preventDefault();
    if (!editProductModalItem) return;
    if (!editName || !editPrice) {
      alert('Nama dan harga wajib diisi!');
      return;
    }

    updateProduct(editProductModalItem.id, {
      name: editName.trim(),
      category: editCategory,
      price: Number(editPrice),
      details: editDetails.trim() || '-'
    });
    setEditProductModalItem(null);
  };

  // Handler Aksi Manajemen Stok: Hapus Produk
  const handleDeleteProduct = (product) => {
    if (confirm(`Yakin ingin menghapus produk "${product.name}" (${product.id}) dari inventaris?`)) {
      deleteProduct(product.id);
    }
  };

  // Filtered Products for Cashier Selection
  const filteredCashierProducts = products.filter(p => {
    const q = cashierSearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  // Cashier Cart Totals Calculations
  const cartDetails = cart.map(item => {
    const prod = products.find(p => p.id === item.id);
    return {
      ...prod,
      quantity: item.quantity,
      total: prod ? prod.price * item.quantity : 0
    };
  });
  const cartSubtotal = cartDetails.reduce((sum, item) => sum + item.total, 0);
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const isMember = !!selectedMemberId;
  const cartDiscount = isMember ? Math.round(cartSubtotal * 0.05) : 0;
  const cartPpn = Math.round((cartSubtotal - cartDiscount) * 0.01);
  const cartTotal = cartSubtotal - cartDiscount + cartPpn;

  const totalRevenue = salesHistory.reduce((sum, trx) => sum + trx.total, 0);
  const totalTransactions = salesHistory.length;
  const averageTicket = totalTransactions ? Math.round(totalRevenue / totalTransactions) : 0;

  const dashboardTitle = activeRole === 'pemilik'
    ? 'Dashboard Hasil Penjualan'
    : activeRole === 'admin'
      ? 'Dashboard Input Barang'
      : 'Dashboard Kasir';
  const dashboardSubtitle = activeRole === 'pemilik'
    ? 'Lihat ringkasan penjualan, transaksi, dan nilai aset toko Anda.'
    : activeRole === 'admin'
      ? 'Kelola inventaris dan catat barang masuk toko.'
      : 'Tangani transaksi pembeli secara cepat dan akurat.';

  // Asset Report calculations
  const electronicsAsset = products
    .filter(p => p.category === 'Elektronik')
    .reduce((sum, p) => sum + (p.price * p.stock), 0);

  const foodAsset = products
    .filter(p => p.category === 'Makanan')
    .reduce((sum, p) => sum + (p.price * p.stock), 0);

  const reportTotalAsset = electronicsAsset + foodAsset;
  const elecPct = reportTotalAsset > 0 ? (electronicsAsset / reportTotalAsset) * 100 : 0;
  const foodPct = reportTotalAsset > 0 ? (foodAsset / reportTotalAsset) * 100 : 0;

  // Add Member Handler
  const handleRegisterMember = (e) => {
    e.preventDefault();
    if (!memberName || !memberEmail) {
      alert('Nama dan Email wajib diisi!');
      return;
    }
    registerMember({
      name: memberName,
      email: memberEmail,
      points: Number(memberPoints || 0)
    });
    setMemberName('');
    setMemberEmail('');
    setMemberPoints('');
    setIsAddMemberOpen(false);
  };

  // Export Inventory as CSV
  const handleExportCSV = () => {
    let csvContent = 'ID Barang,Nama Barang,Kategori,Harga Satuan,Stok,Estimasi Aset,Detail/Garansi\n';
    products.forEach(p => {
      csvContent += `"${p.id}","${p.name}","${p.category}",${p.price},${p.stock},${p.price * p.stock},"${p.details}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Laporan_Inventaris_Toko_Maju_Jaya.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Report as PDF using jsPDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Navy primary
    doc.text('LAPORAN ESTIMASI ASET TOKO MAJU JAYA', 14, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 26);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 30, 196, 30);
    
    // Summary Section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Ringkasan Aset Kelas Polymorphism', 14, 40);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`1. Total Aset Kelas Elektronik: ${formatRupiah(electronicsAsset)}`, 14, 48);
    doc.text(`2. Total Aset Kelas Makanan: ${formatRupiah(foodAsset)}`, 14, 55);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Total Nilai Aset Keseluruhan: ${formatRupiah(reportTotalAsset)}`, 14, 64);
    
    doc.line(14, 70, 196, 70);
    
    // Table Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Detail Rincian Inventaris', 14, 80);
    
    let y = 90;
    doc.setFontSize(9);
    // Draw table columns header
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y - 5, 182, 7, 'F');
    doc.setTextColor(71, 85, 105);
    doc.text('ID Barang', 16, y);
    doc.text('Nama Barang', 50, y);
    doc.text('Kategori', 105, y);
    doc.text('Harga', 130, y);
    doc.text('Stok', 160, y);
    doc.text('Total Nilai', 175, y);
    
    y += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    
    products.forEach((p, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(p.id, 16, y);
      
      // Truncate name if too long
      const displayName = p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name;
      doc.text(displayName, 50, y);
      doc.text(p.category, 105, y);
      doc.text(formatRupiah(p.price), 130, y);
      doc.text(`${p.stock} Unit`, 160, y);
      doc.text(formatRupiah(p.price * p.stock), 175, y);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 2, 196, y + 2);
      y += 8;
    });

    // Save
    doc.save('Laporan_Keuangan_Aset_MajuJaya.pdf');
  };

  if (!isAuthenticated) {
    return (
      <div className="maju-login-page">
        <div className="maju-login-wrapper">
          {/* Sisi Kiri: Ilustrasi Karakter & Fitur Toko */}
          <div className="maju-login-left">
            <img 
              src={loginIllustration} 
              alt="Maju POS - Kelola Toko Anda dengan Lebih Mudah" 
              className="maju-hero-image"
            />
          </div>

          {/* Sisi Kanan: Kartu Form Login */}
          <div className="maju-login-card">
            {/* Header / Logo */}
            <div className="maju-card-header">
              <div className="maju-logo-box">
                <img src={loginAppIcon} alt="Maju POS Icon" className="maju-app-logo" />
              </div>
              <h1 className="maju-card-title">{isRegisterMode ? 'Buat Akun' : 'Maju POS'}</h1>
              <p className="maju-card-tagline">
                {isRegisterMode ? 'Daftar untuk mengakses kasir atau manajemen toko.' : 'Bersama, Membangun Bisnis yang Lebih Baik.'}
              </p>
              <div className="maju-card-divider" />
            </div>

            {isRegisterMode ? (
              <form className="maju-form" onSubmit={handleRegisterSubmit}>
                <div className="maju-field-group">
                  <label className="maju-field-label">
                    <User size={15} className="maju-label-icon" /> Peran
                  </label>
                  <select
                    className="maju-input maju-select"
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value)}
                  >
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin</option>
                    <option value="pemilik">Pemilik</option>
                  </select>
                </div>

                <div className="maju-field-group">
                  <label className="maju-field-label">
                    <User size={15} className="maju-label-icon" /> Username
                  </label>
                  <input
                    type="text"
                    className="maju-input"
                    placeholder="Contoh: kiplingikbar"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="maju-field-group">
                  <label className="maju-field-label">
                    <Mail size={15} className="maju-label-icon" /> Email
                  </label>
                  <input
                    type="email"
                    className="maju-input"
                    placeholder="kiplingikbar@gmail.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="maju-field-group">
                  <label className="maju-field-label">
                    <Lock size={15} className="maju-label-icon" /> Password
                  </label>
                  <div className="maju-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="maju-input maju-input-password"
                      placeholder="Minimal 6 karakter"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="maju-toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {registerError && <div className="login-error">{registerError}</div>}
                {registerSuccess && <div className="register-success">{registerSuccess}</div>}

                <button type="submit" className="maju-btn-submit">
                  <UserPlus size={18} /> Buat Akun & Masuk
                </button>

                <div className="maju-switch-mode">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    className="maju-switch-link"
                    onClick={() => {
                      setIsRegisterMode(false);
                      setRegisterError('');
                    }}
                  >
                    Masuk di sini
                  </button>
                </div>
              </form>
            ) : (
              <form className="maju-form" onSubmit={handleLogin}>
                {/* Field Peran */}
                <div className="maju-field-group">
                  <label className="maju-field-label">
                    <User size={15} className="maju-label-icon" /> Peran
                  </label>
                  <select
                    className="maju-input maju-select"
                    value={activeRole}
                    onChange={(e) => setActiveRole(e.target.value)}
                  >
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin</option>
                    <option value="pemilik">Pemilik</option>
                  </select>
                </div>

                {/* Field Email */}
                <div className="maju-field-group">
                  <label className="maju-field-label">
                    <Mail size={15} className="maju-label-icon" /> Email
                  </label>
                  <input
                    type="email"
                    className="maju-input"
                    placeholder="kiplingikbar@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Field Password */}
                <div className="maju-field-group">
                  <label className="maju-field-label">
                    <Lock size={15} className="maju-label-icon" /> Password
                  </label>
                  <div className="maju-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="maju-input maju-input-password"
                      placeholder="•••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="maju-toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {loginError && <div className="login-error">{loginError}</div>}
                {registerSuccess && <div className="register-success">{registerSuccess}</div>}

                {/* Tombol Masuk */}
                <button type="submit" className="maju-btn-submit">
                  <LogIn size={18} /> Masuk
                </button>

                <div className="maju-switch-mode">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    className="maju-switch-link"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setLoginError('');
                      setRegisterSuccess('');
                    }}
                  >
                    Daftar Sekarang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar role={activeRole} onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="auth-header">
          <div>
            <span className="auth-label">Masuk sebagai</span>
            <strong>
              {activeRole === 'pemilik'
                ? 'Pemilik Toko'
                : activeRole === 'admin'
                  ? 'Admin'
                  : 'Kasir'}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="btn-theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn-secondary" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* VIEW: DASHBOARD / INVENTORY */}
        {(activeTab === 'inventory' || activeTab === 'dashboard') && (
          <>
            {/* Top Navigation */}
            <div className="top-nav">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari produk berdasarkan nama, kode, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={() => setIsAddProductOpen(true)}>
                <Plus size={18} />
                <span>Tambah Barang Baru</span>
              </button>
            </div>

            {/* Page Title */}
            <div className="page-title-section">
              <h1 className="page-title">{dashboardTitle}</h1>
              <p className="page-subtitle">{dashboardSubtitle}</p>
            </div>

            {/* Summary Grid Cards */}
            <div className="summary-grid">
              <div className="summary-card">
                <div className="card-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <Package size={24} />
                </div>
                <div className="card-info">
                  <span className="card-label">{activeRole === 'pemilik' ? 'Total Pendapatan' : 'Total Jenis Barang'}</span>
                  <div className="card-value-container">
                    <span className="card-value">{activeRole === 'pemilik' ? formatRupiah(totalRevenue) : `${totalJenis} Jenis`}</span>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon-wrapper" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                  <Coins size={24} />
                </div>
                <div className="card-info">
                  <span className="card-label">{activeRole === 'pemilik' ? 'Total Transaksi' : 'Total Aset Toko'}</span>
                  <div className="card-value-container">
                    <span className="card-value">{activeRole === 'pemilik' ? `${totalTransactions} Transaksi` : formatRupiah(totalAset)}</span>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon-wrapper" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
                  <Folder size={24} />
                </div>
                <div className="card-info">
                  <span className="card-label">{activeRole === 'pemilik' ? 'Rata-rata Transaksi' : 'Kategori Produk'}</span>
                  <div className="card-value-container">
                    <span className="card-value">{activeRole === 'pemilik' ? formatRupiah(averageTicket) : `${totalKategori} Kategori`}</span>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon-wrapper" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                  <AlertTriangle size={24} />
                </div>
                <div className="card-info">
                  <span className="card-label">{activeRole === 'pemilik' ? 'Nilai Aset Toko' : 'Barang Stok Menipis'}</span>
                  <div className="card-value-container">
                    {activeRole === 'pemilik' ? (
                      <span className="card-value">{formatRupiah(totalAset)}</span>
                    ) : (
                      <>
                        <span className="card-value">{stokMenipisCount} Barang</span>
                        {stokMenipisCount > 0 && (
                          <span className="card-badge danger">{totalMenipisUnits} Unit</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nama & Kode Barang</th>
                    <th>Kategori</th>
                    <th>Harga Satuan</th>
                    <th>Stok</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Tidak ada barang ditemukan untuk pencarian "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLowStock = p.stock <= lowStockThreshold;
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="product-cell">
                              <span className="product-icon">{p.category === 'Elektronik' ? '📺' : '🥛'}</span>
                              <div className="product-meta">
                                <span className="product-name">{p.name}</span>
                                <span className="product-id">{p.id}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${p.category.toLowerCase()}`}>
                              {p.category}
                            </span>
                          </td>
                          <td>{formatRupiah(p.price)}</td>
                          <td>{p.stock} Unit</td>
                          <td>
                            <span className={`badge ${isLowStock ? 'danger' : 'success'}`}>
                              {isLowStock ? 'Menipis' : 'Aman'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="product-action-wrapper">
                              <button 
                                type="button"
                                className="btn-pill-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenu(activeActionMenu === p.id ? null : p.id);
                                }}
                              >
                                Edit <ChevronDown size={13} />
                              </button>

                              {activeActionMenu === p.id && (
                                <div className="product-action-dropdown">
                                  <button 
                                    type="button"
                                    className="dropdown-action-item"
                                    onClick={() => {
                                      setActiveActionMenu(null);
                                      openAdjustStock(p);
                                    }}
                                  >
                                    <Layers size={14} style={{ color: '#2563eb' }} />
                                    <span>Atur Stok</span>
                                  </button>
                                  <button 
                                    type="button"
                                    className="dropdown-action-item"
                                    onClick={() => {
                                      setActiveActionMenu(null);
                                      openEditProduct(p);
                                    }}
                                  >
                                    <Edit3 size={14} style={{ color: '#d97706' }} />
                                    <span>Edit Produk</span>
                                  </button>
                                  <button 
                                    type="button"
                                    className="dropdown-action-item danger"
                                    onClick={() => {
                                      setActiveActionMenu(null);
                                      handleDeleteProduct(p);
                                    }}
                                  >
                                    <Trash2 size={14} style={{ color: '#dc2626' }} />
                                    <span>Hapus Produk</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* VIEW: CASHIER TERMINAL */}
        {activeTab === 'cashier' && (
          <>
            {/* Header */}
            <div className="page-title-section">
              <h1 className="page-title">Transaksi Pembeli</h1>
              <p className="page-subtitle">Tambahkan barang pelanggan, proses pembayaran, lalu cetak struk di akhir transaksi.</p>
            </div>
            <div className="alert-box" style={{ marginBottom: '24px' }}>
              <strong>Langkah Kasir:</strong> pilih barang → tambahkan ke keranjang → pilih member (opsional) → bayar → cetak struk.
            </div>

            {/* Cashier Grid */}
            <div className="cashier-grid">
              
              {/* Left Column: Product Selection */}
              <div className="cashier-card-left">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 className="cashier-title-main" style={{ fontSize: '16px', color: 'var(--text-main)' }}>
                    Cari & Pilih Produk dari Inventaris
                  </h2>
                </div>
                
                <div className="search-container" style={{ maxWidth: '100%', marginBottom: '4px' }}>
                  <Search className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Ketik nama atau kode produk..."
                    value={cashierSearchQuery}
                    onChange={(e) => setCashierSearchQuery(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredCashierProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Produk tidak ditemukan
                    </div>
                  ) : (
                    filteredCashierProducts.map(p => {
                      const isOutOfStock = p.stock <= 0;
                      return (
                        <div 
                          key={p.id} 
                          className="cart-item" 
                          style={{ 
                            opacity: isOutOfStock ? 0.6 : 1,
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div className="cart-item-details">
                            <span className="cart-item-name">{p.name}</span>
                            <span className="cart-item-subclass" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <span className={`badge ${p.category.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 6px' }}>{p.category}</span>
                              <span>{p.id}</span>
                              <span>• {p.details}</span>
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span className="cart-item-price">{formatRupiah(p.price)}</span>
                            {isOutOfStock ? (
                              <span className="badge danger">Habis</span>
                            ) : (
                              <span className="badge success" style={{ fontSize: '10px' }}>Stok: {p.stock}</span>
                            )}
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ fontSize: '12px', padding: '6px 10px', whiteSpace: 'nowrap' }}
                              disabled={isOutOfStock}
                              onClick={() => !isOutOfStock && addToCart(p.id)}
                            >
                              Tambah
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Checkout Summary */}
              <div className="cashier-card-right">
                <div className="cashier-header-bar">
                  <span className="cashier-title-main">Struk Transaksi</span>
                  <span className="cashier-struk-id">{currentTrxId}</span>
                </div>

                {/* Member selection dropdown */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Pilih Member Pelanggan</label>
                  <select
                    className="form-input"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Non Member (Tanpa Diskon) --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id} - Poin: {m.points})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cart list */}
                <div style={{ minHeight: '180px', maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px' }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <ShoppingCart size={32} style={{ opacity: 0.3 }} />
                      <span>Keranjang Belanja Kosong</span>
                      <span style={{ fontSize: '11px' }}>Klik produk di sebelah kiri untuk menambahkan.</span>
                    </div>
                  ) : (
                    cartDetails.map(item => {
                      if (!item) return null;
                      return (
                        <div key={item.id} className="cart-item" style={{ marginBottom: '8px', padding: '12px' }}>
                          <div className="cart-item-details" style={{ width: '45%' }}>
                            <span className="cart-item-name" style={{ fontSize: '13px' }}>{item.name}</span>
                            <span className="cart-item-subclass">{formatRupiah(item.price)}</span>
                          </div>
                          <div className="cart-item-controls" style={{ width: '55%', justifyContent: 'flex-end' }}>
                            <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, -1)}>-</button>
                            <span className="cart-qty-val">{item.quantity}</span>
                            <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, 1)}>+</button>
                            <span className="cart-item-price" style={{ width: '85px', textAlign: 'right', fontSize: '13px' }}>{formatRupiah(item.total)}</span>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              style={{ color: 'var(--danger)', marginLeft: '8px', display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Summary calculation totals */}
                <div className="checkout-summary">
                  <div className="summary-row">
                    <span>Subtotal Barang</span>
                    <span>{formatRupiah(cartSubtotal)}</span>
                  </div>
                  {isMember && (
                    <div className="summary-row">
                      <span>Diskon Pelanggan Member (5%)</span>
                      <span className="discount-val">-{formatRupiah(cartDiscount)}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>PPN (1%)</span>
                    <span>{formatRupiah(cartPpn)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>TOTAL BAYAR</span>
                    <span className="val">{formatRupiah(cartTotal)}</span>
                  </div>
                </div>

                <button
                  className="btn-checkout"
                  disabled={cart.length === 0}
                  onClick={() => {
                    if (cart.length === 0) return;
                    setPaymentMethod('Tunai');
                    setCashGiven(String(cartTotal));
                    setIsPaymentModalOpen(true);
                  }}
                >
                  Proses Transaksi / Bayar
                </button>
              </div>

            </div>
          </>
        )}

        {/* VIEW: MANAJEMEN MEMBER */}
        {activeTab === 'members' && (
          <>
            {/* Top Navigation / Header */}
            <div className="top-nav">
              <div style={{ flex: 1 }}></div>
              <button className="btn-primary" onClick={() => setIsAddMemberOpen(true)}>
                <UserPlus size={18} />
                <span>Registrasi Member Baru</span>
              </button>
            </div>

            {/* Page Title */}
            <div className="page-title-section">
              <h1 className="page-title">Database Pelanggan & Loyalitas</h1>
              <p className="page-subtitle">Manajemen data member dan perolehan poin loyalitas pelanggan</p>
            </div>

            {/* Members Table */}
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nama Pelanggan & ID</th>
                    <th>Email / Kontak</th>
                    <th>Total Poin Loyalitas</th>
                    <th>Tingkat Status Member</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const level = getMemberLevel(m.points);
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="product-cell">
                            <span className="product-icon">👤</span>
                            <div className="product-meta">
                              <span className="product-name">{m.name}</span>
                              <span className="product-id">{m.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>{m.email}</td>
                        <td>
                          <strong>{m.points.toLocaleString('id-ID')} Poin</strong>
                        </td>
                        <td>
                          <span className={`badge ${level.class}`}>
                            {level.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* VIEW: REKAP PENJUALAN (KASIR) */}
        {activeTab === 'sales_recap' && (
          <SalesRecapView formatRupiah={formatRupiah} />
        )}

        {/* VIEW: CASHFLOW BISNIS (ADMIN / PEMILIK) */}
        {activeTab === 'cashflow' && (
          <CashflowView formatRupiah={formatRupiah} />
        )}

        {/* VIEW: LAPORAN KEUANGAN (ADMIN / PEMILIK) */}
        {(activeTab === 'financial_reports' || activeTab === 'reports') && (
          <FinancialReportsView formatRupiah={formatRupiah} />
        )}

        {/* VIEW: MANAJEMEN AKSES (ADMIN / PEMILIK) */}
        {activeTab === 'team_access' && (
          <TeamAccessView 
            registeredUsers={registeredUsers} 
            onAddUser={handleAddUser} 
            onDeleteUser={handleDeleteUser} 
          />
        )}

      </main>

      {/* DRAWERS & MODALS */}

      {/* Slide-over Add Product Drawer */}
      <AddProductDrawer 
        isOpen={isAddProductOpen} 
        onClose={() => setIsAddProductOpen(false)} 
      />

      {/* Custom Member Registration Modal */}
      {isAddMemberOpen && (
        <div className="modal-overlay" onClick={() => setIsAddMemberOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Registrasi Member Baru</h2>
              <button className="modal-close" onClick={() => setIsAddMemberOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRegisterMember}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Budi Santoso"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email / Kontak *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Contoh: budi@gmail.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Poin Awal (Opsional)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Contoh: 100"
                    value={memberPoints}
                    onChange={(e) => setMemberPoints(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddMemberOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Registrasi Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi & Pembayaran Transaksi Kasir */}
      {isPaymentModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="payment-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '18px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#dbeafe', color: '#2563eb', padding: '8px', borderRadius: '10px' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Konfirmasi & Pembayaran Kasir</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Periksa rincian item belanja dan tentukan metode pembayaran
                  </div>
                </div>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Bagian 1: Apa Saja yang Dibeli (Daftar Produk) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                    Item Belanja ({cart.reduce((s, it) => s + it.quantity, 0)} Barang)
                  </label>
                  {selectedMember && (
                    <span className="badge badge-info" style={{ fontSize: '11px' }}>
                      Member: {selectedMember.name} (Diskon 5%)
                    </span>
                  )}
                </div>

                <div className="payment-items-list">
                  {cartDetails.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {item.quantity} x {formatRupiah(item.price)}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {formatRupiah(item.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bagian 2: Ringkasan Total Harga */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal Produk</span>
                    <span>{formatRupiah(cartSubtotal)}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                      <span>Diskon Member (5%)</span>
                      <span style={{ fontWeight: 700 }}>-{formatRupiah(cartDiscount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>PPN (1%)</span>
                    <span>{formatRupiah(cartPpn)}</span>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>TOTAL HARGA</span>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#16a34a' }}>
                      {formatRupiah(cartTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bagian 3: Metode Pembayaran */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                  Pilih Metode Pembayaran *
                </label>
                <div className="payment-method-grid">
                  <button
                    type="button"
                    className={`payment-method-card ${paymentMethod === 'Tunai' ? 'active' : ''}`}
                    onClick={() => {
                      setPaymentMethod('Tunai');
                      if (!cashGiven) setCashGiven(String(cartTotal));
                    }}
                  >
                    <Banknote size={18} style={{ color: paymentMethod === 'Tunai' ? '#2563eb' : 'var(--text-muted)' }} />
                    <span>💵 Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-method-card ${paymentMethod === 'QRIS' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('QRIS')}
                  >
                    <QrCode size={18} style={{ color: paymentMethod === 'QRIS' ? '#2563eb' : 'var(--text-muted)' }} />
                    <span>📱 QRIS Dinamis</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-method-card ${paymentMethod === 'Debit' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('Debit')}
                  >
                    <CreditCard size={18} style={{ color: paymentMethod === 'Debit' ? '#2563eb' : 'var(--text-muted)' }} />
                    <span>💳 Kartu Debit/EDC</span>
                  </button>

                  <button
                    type="button"
                    className={`payment-method-card ${paymentMethod === 'Transfer Bank' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('Transfer Bank')}
                  >
                    <Building2 size={18} style={{ color: paymentMethod === 'Transfer Bank' ? '#2563eb' : 'var(--text-muted)' }} />
                    <span>🏦 Transfer Bank</span>
                  </button>
                </div>

                {/* Detail Input Berdasarkan Metode */}
                <div style={{ marginTop: '12px' }}>
                  {paymentMethod === 'Tunai' && (
                    <div style={{ background: 'var(--bg-hover)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>
                          Nominal Uang Diterima (Rp)
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Masukkan jumlah uang pelanggan..."
                          value={cashGiven}
                          onChange={(e) => setCashGiven(e.target.value)}
                          min={0}
                          style={{ fontSize: '16px', fontWeight: 700 }}
                        />
                      </div>

                      {/* Shortcut Pilihan Nominal */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '16px' }}
                          onClick={() => setCashGiven(String(cartTotal))}
                        >
                          Uang Pas ({formatRupiah(cartTotal)})
                        </button>
                        {[50000, 100000, 200000, 500000].map((amt) => {
                          if (amt < cartTotal && amt !== 50000) return null;
                          return (
                            <button
                              key={amt}
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '16px' }}
                              onClick={() => setCashGiven(String(amt))}
                            >
                              Rp {amt.toLocaleString('id-ID')}
                            </button>
                          );
                        })}
                      </div>

                      {/* Kalkulasi Kembalian */}
                      <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: Number(cashGiven) >= cartTotal ? '#dcfce7' : '#fee2e2', color: Number(cashGiven) >= cartTotal ? '#166534' : '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>
                          {Number(cashGiven) >= cartTotal ? 'Kembalian:' : 'Uang Kurang:'}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: 800 }}>
                          {Number(cashGiven) >= cartTotal 
                            ? formatRupiah(Math.max(0, (Number(cashGiven) || 0) - cartTotal))
                            : formatRupiah(cartTotal - (Number(cashGiven) || 0))}
                        </span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'QRIS' && (
                    <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', padding: '12px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)', marginBottom: '8px' }}>
                        <QrCode size={56} style={{ color: '#1e40af' }} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>
                        Scan QRIS Statis / Dinamis Kasir
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#3b82f6', marginTop: '2px' }}>
                        Mendukung GoPay, OVO, ShopeePay, Dana, LinkAja, dan BCA Mobile
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Debit' && (
                    <div style={{ background: 'var(--bg-hover)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Gesek atau masukkan kartu ke mesin EDC kasir, lalu klik Selesaikan Pembayaran setelah struk EDC keluar.
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Transfer Bank' && (
                    <div style={{ background: 'var(--bg-hover)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Pastikan bukti transfer telah dicek dan mutasi saldo masuk sebelum menyelesaikan transaksi.
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Batal / Kembali
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={paymentMethod === 'Tunai' && Number(cashGiven) < cartTotal}
                onClick={() => {
                  const cashNum = Number(cashGiven) || cartTotal;
                  const changeAmount = paymentMethod === 'Tunai' ? Math.max(0, cashNum - cartTotal) : 0;
                  checkoutCart({
                    paymentMethod,
                    cashReceived: paymentMethod === 'Tunai' ? cashNum : cartTotal,
                    change: changeAmount
                  });
                  setIsPaymentModalOpen(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={16} />
                Selesaikan Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Receipt Modal Popup */}
      {currentReceipt && (
        <div className="modal-overlay" onClick={() => setCurrentReceipt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Transaksi Berhasil!</h2>
              <button className="modal-close" onClick={() => setCurrentReceipt(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="receipt-wrapper">
                <div className="receipt-header">
                  <div className="receipt-logo" style={{ fontSize: '18px', fontWeight: 'bold' }}>🏪 TOKO MAJU JAYA</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>Kelompok 2 PBO - S1 Informatika</div>
                  <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>Tanggal: {currentReceipt.date}</div>
                  <div style={{ fontSize: '9px', color: '#666' }}>No: {currentReceipt.trxId}</div>
                </div>

                <div className="receipt-divider"></div>

                {currentReceipt.member && (
                  <div style={{ fontSize: '10px', marginBottom: '8px', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                    <strong>Pelanggan Member:</strong> {currentReceipt.member.name} ({currentReceipt.member.id})
                  </div>
                )}

                <div className="receipt-divider"></div>

                <div className="receipt-items">
                  {currentReceipt.items.map((item, idx) => (
                    <div key={idx} className="receipt-item-block" style={{ fontSize: '10px' }}>
                      <div className="receipt-row">
                        <strong>{item.name}</strong>
                      </div>
                      <div className="receipt-row" style={{ color: '#444', paddingLeft: '8px' }}>
                        <span>{item.quantity} x {formatRupiah(item.price)}</span>
                        <span>{formatRupiah(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-summary" style={{ fontSize: '10px' }}>
                  <div className="receipt-row">
                    <span>Subtotal</span>
                    <span>{formatRupiah(currentReceipt.subtotal)}</span>
                  </div>
                  {currentReceipt.discount > 0 && (
                    <div className="receipt-row" style={{ color: 'red' }}>
                      <span>Diskon Member (5%)</span>
                      <span>-{formatRupiah(currentReceipt.discount)}</span>
                    </div>
                  )}
                  <div className="receipt-row">
                    <span>PPN (1%)</span>
                    <span>{formatRupiah(currentReceipt.ppn)}</span>
                  </div>
                  <div className="receipt-divider"></div>
                  <div className="receipt-row" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    <span>TOTAL BAYAR</span>
                    <span>{formatRupiah(currentReceipt.total)}</span>
                  </div>
                  <div className="receipt-divider"></div>
                  <div className="receipt-row">
                    <span>Metode Bayar</span>
                    <span style={{ fontWeight: 600 }}>{currentReceipt.paymentMethod || 'Tunai'}</span>
                  </div>
                  {(currentReceipt.paymentMethod === 'Tunai' || !currentReceipt.paymentMethod) && (
                    <>
                      <div className="receipt-row">
                        <span>Tunai Diterima</span>
                        <span>{formatRupiah(currentReceipt.cashReceived || currentReceipt.total)}</span>
                      </div>
                      <div className="receipt-row">
                        <span>Kembalian</span>
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>{formatRupiah(currentReceipt.change || 0)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-footer">
                  <div>Terima Kasih Atas Kunjungan Anda!</div>
                  <div style={{ fontSize: '8px', color: '#666', marginTop: '4px' }}>Struk ini adalah bukti pembayaran sah.</div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-outline" 
                onClick={() => {
                  window.print();
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Printer size={16} />
                Cetak Struk
              </button>
              <button type="button" className="btn-primary" onClick={() => setCurrentReceipt(null)}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atur Stok Produk */}
      {adjustStockModalItem && (
        <div className="modal-backdrop" onClick={() => setAdjustStockModalItem(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Atur Stok Barang</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {adjustStockModalItem.name} ({adjustStockModalItem.id})
                </div>
              </div>
              <button onClick={() => setAdjustStockModalItem(null)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveAdjustStock} className="modal-form">
              <div style={{ padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Stok Saat Ini:</span>
                <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>{adjustStockModalItem.stock} Unit</strong>
              </div>

              <div className="form-group">
                <label className="form-label">Aksi Perubahan Stok</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    className={`subclass-btn ${adjustMode === 'add' ? 'active makanan' : ''}`}
                    onClick={() => setAdjustMode('add')}
                    style={{ padding: '8px', fontSize: '12px' }}
                  >
                    + Tambah
                  </button>
                  <button
                    type="button"
                    className={`subclass-btn ${adjustMode === 'subtract' ? 'active elektronik' : ''}`}
                    onClick={() => setAdjustMode('subtract')}
                    style={{ padding: '8px', fontSize: '12px' }}
                  >
                    - Kurang
                  </button>
                  <button
                    type="button"
                    className={`subclass-btn ${adjustMode === 'set' ? 'active' : ''}`}
                    onClick={() => setAdjustMode('set')}
                    style={{ padding: '8px', fontSize: '12px' }}
                  >
                    Set Baru
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {adjustMode === 'add' ? 'Jumlah Tambahan Unit' : adjustMode === 'subtract' ? 'Jumlah Pengurangan Unit' : 'Jumlah Stok Fisik Riil'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  placeholder="Contoh: 10"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                />
              </div>

              {/* Preview Kalkulasi Stok Baru */}
              <div style={{ padding: '10px 14px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: '10px', fontSize: '13px' }}>
                Kalkulasi Stok Baru: {' '}
                <strong style={{ color: '#2563eb' }}>
                  {adjustMode === 'add' 
                    ? `${adjustStockModalItem.stock} + ${Number(adjustQty) || 0} = ${adjustStockModalItem.stock + (Number(adjustQty) || 0)} Unit`
                    : adjustMode === 'subtract'
                      ? `${adjustStockModalItem.stock} - ${Number(adjustQty) || 0} = ${Math.max(0, adjustStockModalItem.stock - (Number(adjustQty) || 0))} Unit`
                      : `${Number(adjustQty) || 0} Unit`}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setAdjustStockModalItem(null)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan Perubahan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Produk */}
      {editProductModalItem && (
        <div className="modal-backdrop" onClick={() => setEditProductModalItem(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Edit Informasi Produk</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Kode Barang: <code>{editProductModalItem.id}</code>
                </div>
              </div>
              <button onClick={() => setEditProductModalItem(null)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="modal-form">
              <div className="form-group">
                <label className="form-label">Nama Produk *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subclass / Kategori Kelas</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ketik nama subclass (Elektronik, Makanan, Minuman, dll)"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Harga Satuan (Rp) *</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Keterangan / Garansi / Expired</label>
                <input
                  type="text"
                  className="form-input"
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setEditProductModalItem(null)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan Perubahan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;