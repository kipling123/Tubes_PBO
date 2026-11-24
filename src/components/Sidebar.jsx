import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  ShoppingCart, 
  ReceiptText, 
  Package, 
  Users, 
  ArrowLeftRight, 
  TrendingUp, 
  ShieldCheck, 
  LogOut,
  User
} from 'lucide-react';

const Sidebar = ({ role, onLogout }) => {
  const { activeTab, setActiveTab } = useContext(AppContext);

  // Akses menu sesuai instruksi:
  // Kasir: Aplikasi Kasir (POS), Rekap Penjualan, Manajemen Stok, Manajemen Member
  // Admin / Pemilik Toko: Cashflow Bisnis, Laporan Keuangan, Manajemen Akses
  const menuItems = role === 'kasir' ? [
    { id: 'cashier', label: 'Aplikasi Kasir (POS)', icon: ShoppingCart },
    { id: 'sales_recap', label: 'Rekap Penjualan', icon: ReceiptText },
    { id: 'inventory', label: 'Manajemen Stok', icon: Package },
    { id: 'members', label: 'Manajemen Member', icon: Users },
  ] : [
    { id: 'cashflow', label: 'Cashflow Bisnis', icon: ArrowLeftRight },
    { id: 'financial_reports', label: 'Laporan Keuangan', icon: TrendingUp },
    { id: 'team_access', label: 'Manajemen Akses', icon: ShieldCheck },
  ];

  const roleDisplay = role === 'pemilik' 
    ? 'Pemilik Toko' 
    : role === 'admin' 
      ? 'Administrator' 
      : 'Kasir Toko';

  return (
    <aside className="sidebar">
      <div>
        {/* Header Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">MJ</div>
          <div>
            <h1 className="sidebar-title">Maju POS</h1>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Manajemen Toko</div>
          </div>
        </div>

        {/* User Role Badge */}
        <div style={{
          padding: '10px 14px',
          margin: '0 0 16px 0',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: role === 'kasir' ? '#dcfce7' : '#dbeafe',
            color: role === 'kasir' ? '#16a34a' : '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={16} />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Peran Aktif
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              {roleDisplay}
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="sidebar-section-title">Navigasi Utama</div>
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
                <IconComponent size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {/* Tombol Logout */}
        {onLogout && (
          <button 
            onClick={onLogout} 
            className="sidebar-item" 
            style={{ width: '100%', marginBottom: '16px', color: 'var(--danger)' }}
          >
            <LogOut size={18} />
            <span>Keluar Akun</span>
          </button>
        )}

        {/* Footer Group Info (Sesuai Screenshot K2) */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-logo">K2</div>
          <div className="sidebar-footer-text">
            <span className="sidebar-footer-title">Kelompok 2 PBO</span>
            <span className="sidebar-footer-sub">S1 Informatika 2026</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
