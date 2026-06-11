import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { LayoutDashboard, ShoppingCart, Users, TrendingUp, Package } from 'lucide-react';

const Sidebar = ({ role }) => {
  const { activeTab, setActiveTab } = useContext(AppContext);

  const menuItems = role === 'pemilik' ? [
    { id: 'dashboard', label: 'Dashboard Penjualan', icon: LayoutDashboard },
    { id: 'reports', label: 'Laporan Aset Toko', icon: TrendingUp }
  ] : role === 'admin' ? [
    { id: 'dashboard', label: 'Input Barang', icon: Package }
  ] : [
    { id: 'cashier', label: 'Transaksi Kasir', icon: ShoppingCart }
  ];

  return (
    <aside className="sidebar">
      <div>
        {/* Header Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">MJ</div>
          <h1 className="sidebar-title">Toko Maju Jaya</h1>
        </div>

        {/* Menu Navigation */}
        <div className="sidebar-section-title">Menu Utama</div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                id={`nav-${item.id}`}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Group Info */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-logo">K2</div>
        <div className="sidebar-footer-text">
          <span className="sidebar-footer-title">Kelompok 2 PBO</span>
          <span className="sidebar-footer-sub">S1 Informatika 2026</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
