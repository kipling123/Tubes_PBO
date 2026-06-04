import React, { useState, useContext } from 'react';
import { AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import AddProductDrawer from './components/AddProductDrawer';
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
  Printer
} from 'lucide-react';

function App() {
  const {
    activeTab,
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
    setCurrentReceipt
  } = useContext(AppContext);

  // States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cashierSearchQuery, setCashierSearchQuery] = useState('');

  // Member Form States
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPoints, setMemberPoints] = useState('');

  // Helper: Format to IDR
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // Helper: Get Member Badge Level
  const getMemberLevel = (points) => {
    if (points >= 2000) return { label: 'Gold', class: 'gold' };
    if (points >= 1000) return { label: 'Silver', class: 'silver' };
    return { label: 'Bronze', class: 'bronze' };
  };

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
  const isMember = !!selectedMemberId;
  const cartDiscount = isMember ? Math.round(cartSubtotal * 0.05) : 0;
  const cartPpn = Math.round((cartSubtotal - cartDiscount) * 0.11);
  const cartTotal = cartSubtotal - cartDiscount + cartPpn;

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

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* VIEW: DASHBOARD / INVENTORY */}
        {activeTab === 'dashboard' && (
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
              <h1 className="page-title">Ringkasan Inventaris</h1>
              <p className="page-subtitle">Pantau stok, nilai aset, dan status barang toko Anda di sini.</p>
            </div>

            {/* Summary Grid Cards */}
            <div className="summary-grid">
              {/* Total Jenis */}
              <div className="summary-card">
                <div className="card-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <Package size={24} />
                </div>
                <div className="card-info">
                  <span className="card-label">Total Jenis Barang</span>
                  <div className="card-value-container">
                    <span className="card-value">{totalJenis} Jenis</span>
                  </div>
                </div>
              </div>

              {/* Total Aset */}
              <div className="summary-card">
                <div className="card-icon-wrapper" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                  <Coins size={24} />
                </div>
                <div className="card-info">
                  <span className="card-label">Total Aset Toko</span>
                  <div className="card-value-container">
                    <span className="card-value">{formatRupiah(totalAset)}</span>
                  </div>
                </div>
              </div>

              {/* Kategori */}
              <div className="summary-card">
                <div className="card-icon-wrapper" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
                  <Folder size={24} />
                </div>
                <div className="card-info">
                  <span className="card-label">Kategori Produk</span>
                  <div className="card-value-container">
                    <span className="card-value">{totalKategori} Kategori</span>
                  </div>
                </div>
              </div>

              {/* Stok Menipis */}
              <div className="summary-card">
                <div className="card-icon-wrapper" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                  <AlertTriangle size={24} />
                </div>
                <div className="card-info">
                  <span className="card-label">Barang Stok Menipis</span>
                  <div className="card-value-container">
                    <span className="card-value">{stokMenipisCount} Barang</span>
                    {stokMenipisCount > 0 && (
                      <span className="card-badge danger">{totalMenipisUnits} Unit</span>
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
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
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
              <h1 className="page-title">Terminal Transaksi Kasir</h1>
              <p className="page-subtitle">Kelola penjualan langsung ke pelanggan dan gunakan diskon loyalitas member.</p>
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
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: isOutOfStock ? 0.6 : 1,
                            backgroundColor: '#ffffff'
                          }} 
                          onClick={() => !isOutOfStock && addToCart(p.id)}
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
                    <span>PPN (11%)</span>
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
                  onClick={checkoutCart}
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

        {/* VIEW: LAPORAN ASET TOKO */}
        {activeTab === 'reports' && (
          <>
            {/* Page Title */}
            <div className="page-title-section">
              <h1 className="page-title">Laporan Keuangan & Estimasi Aset</h1>
              <p className="page-subtitle">Period: Juni 2026</p>
            </div>

            {/* Dark Theme Dashboard Container */}
            <div className="report-dark-bg">
              
              <div className="report-header-section">
                <div className="report-title-block">
                  <h2 className="report-title">
                    <Sparkles size={20} style={{ color: '#38bdf8' }} /> Estimasi Nilai Aset & Penjualan
                  </h2>
                  <p className="report-subtitle">Laporan otomatis berdasarkan inventaris dan transaksi terbaru</p>
                </div>
                <div className="report-period">
                  Period: 1 Jan - 3 Jun 2026
                </div>
              </div>

              <div className="report-cards-container">
                {/* Electronics Asset Card */}
                <div className="report-valuation-card">
                  <span className="report-card-label">Aset Kelas Elektronik</span>
                  <span className="report-card-value elektronik">{formatRupiah(electronicsAsset)}</span>
                  <div className="report-card-progress">
                    <div 
                      className="report-card-bar elektronik" 
                      style={{ width: `${elecPct}%` }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Kontribusi Porsi: {elecPct.toFixed(1)}% dari Total Aset Toko
                  </span>
                </div>

                {/* Food Asset Card */}
                <div className="report-valuation-card">
                  <span className="report-card-label">Aset Kelas Makanan</span>
                  <span className="report-card-value makanan">{formatRupiah(foodAsset)}</span>
                  <div className="report-card-progress">
                    <div 
                      className="report-card-bar makanan" 
                      style={{ width: `${foodPct}%` }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Kontribusi Porsi: {foodPct.toFixed(1)}% dari Total Aset Toko
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="report-action-buttons">
                <button className="btn-report-action pdf" onClick={handleExportPDF}>
                  <Download size={18} />
                  <span>Unduh PDF Laporan</span>
                </button>
                <button className="btn-report-action csv" onClick={handleExportCSV}>
                  <FileSpreadsheet size={18} />
                  <span>Ekspor CSV Data</span>
                </button>
              </div>

            </div>
          </>
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
                    <span>PPN (11%)</span>
                    <span>{formatRupiah(currentReceipt.ppn)}</span>
                  </div>
                  <div className="receipt-divider"></div>
                  <div className="receipt-row" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    <span>TOTAL BAYAR</span>
                    <span>{formatRupiah(currentReceipt.total)}</span>
                  </div>
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

    </div>
  );
}

export default App;
