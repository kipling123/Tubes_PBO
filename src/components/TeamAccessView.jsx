import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Trash2, 
  CheckCircle, 
  X,
  KeyRound,
  Shield
} from 'lucide-react';

const defaultBuiltInAccounts = [
  {
    username: 'pemilik_toko',
    email: 'owner@toko.com',
    role: 'pemilik',
    status: 'Aktif',
    accessLabel: 'Akses Penuh (Cashflow, Laporan Keuangan, Manajemen Akses)',
  },
  {
    username: 'admin_store',
    email: 'admin@toko.com',
    role: 'admin',
    status: 'Aktif',
    accessLabel: 'Akses Manajerial (Cashflow, Laporan Keuangan, Manajemen Akses)',
  },
  {
    username: 'kasir_utama',
    email: 'kasir@toko.com',
    role: 'kasir',
    status: 'Aktif',
    accessLabel: 'Akses Kasir (POS, Rekap Penjualan, Stok, Member)',
  },
];

export default function TeamAccessView({ registeredUsers, onAddUser, onDeleteUser }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('kasir');
  const [newPassword, setNewPassword] = useState('');

  // Gabungkan akun default + akun terdaftar
  const allUsers = [
    ...defaultBuiltInAccounts,
    ...registeredUsers.map((u) => ({
      username: u.username,
      email: u.email,
      role: u.role,
      status: 'Aktif',
      accessLabel: u.role === 'kasir' 
        ? 'Akses Kasir (POS, Rekap Penjualan, Stok, Member)'
        : 'Akses Penuh (Cashflow, Laporan Keuangan, Manajemen Akses)',
      isCustom: true,
    })),
  ];

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPassword) {
      alert('Semua field wajib diisi!');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter!');
      return;
    }

    onAddUser({
      username: newUsername.trim(),
      email: newEmail.trim(),
      role: newRole,
      password: newPassword,
    });

    setIsModalOpen(false);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('kasir');
  };

  return (
    <div className="tab-pane-container">
      {/* Header Halaman */}
      <div className="pane-header-row">
        <div>
          <h2 className="pane-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck className="text-primary" /> Manajemen Akses & Anggota Tim
          </h2>
          <p className="pane-subtitle">
            Atur hak akses staf toko, batasi wewenang operasional kasir, dan kelola akun administratif.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={16} /> Tambah Staf Baru
        </button>
      </div>

      {/* Ringkasan Metrik Pengguna */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="card-label">Total Akun Terdaftar</span>
          <span className="card-value" style={{ color: '#2563eb' }}>{allUsers.length} Pengguna</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Seluruh peran sistem</span>
        </div>
        <div className="stat-card">
          <span className="card-label">Akun Kasir (POS)</span>
          <span className="card-value" style={{ color: '#16a34a' }}>
            {allUsers.filter((u) => u.role === 'kasir').length} Staf
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Akses kasir & transaksi</span>
        </div>
        <div className="stat-card">
          <span className="card-label">Akun Admin & Pemilik</span>
          <span className="card-value" style={{ color: '#d97706' }}>
            {allUsers.filter((u) => u.role === 'admin' || u.role === 'pemilik').length} Pengelola
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Akses finansial & manajerial</span>
        </div>
      </div>

      {/* Tabel Pengguna & Hak Akses */}
      <div className="table-responsive-card" style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', padding: '16px 20px 0' }}>
          Daftar Pengguna & Hak Akses Aktif
        </h3>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Nama / Username</th>
              <th>Email Akun</th>
              <th>Peran (Role)</th>
              <th>Cakupan Hak Akses</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u, idx) => (
              <tr key={idx}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <div className="sidebar-logo" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    {u.username}
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${
                    u.role === 'pemilik' 
                      ? 'badge-danger' 
                      : u.role === 'admin' 
                        ? 'badge-warning' 
                        : 'badge-success'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontSize: '13px' }}>{u.accessLabel}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '12px', fontWeight: 600 }}>
                    <CheckCircle size={14} /> {u.status}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {u.isCustom ? (
                    <button 
                      className="btn-icon-danger" 
                      onClick={() => onDeleteUser(u.email)}
                      title="Hapus akun staf"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bawaan</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Matriks Hak Akses (Role-Based Access Control) */}
      <div className="table-responsive-card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', padding: '16px 20px 0' }}>
          Matriks Hak Akses Sistem (Access Control Policy)
        </h3>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Fitur & Modul Aplikasi</th>
              <th style={{ textAlign: 'center' }}>Peran: Kasir</th>
              <th style={{ textAlign: 'center' }}>Peran: Admin</th>
              <th style={{ textAlign: 'center' }}>Peran: Pemilik Toko</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Aplikasi Kasir (POS & Transaksi)</strong></td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
              <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
              <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
            </tr>
            <tr>
              <td><strong>Rekap Riwayat Penjualan</strong></td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
              <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
              <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
            </tr>
            <tr>
              <td><strong>Manajemen Stok & Katalog Barang</strong></td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
              <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
              <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
            </tr>
            <tr>
              <td><strong>Manajemen Member Pelanggan</strong></td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
              <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
              <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
            </tr>
            <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
              <td><strong>Cashflow Bisnis & Arus Kas</strong></td>
              <td style={{ textAlign: 'center', color: '#dc2626' }}>✖ Terkunci</td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
            </tr>
            <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
              <td><strong>Laporan Keuangan (Laba Rugi, Neraca, Pajak)</strong></td>
              <td style={{ textAlign: 'center', color: '#dc2626' }}>✖ Terkunci</td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
            </tr>
            <tr style={{ background: 'rgba(37, 99, 235, 0.04)' }}>
              <td><strong>Manajemen Akses & Tambah Staf</strong></td>
              <td style={{ textAlign: 'center', color: '#dc2626' }}>✖ Terkunci</td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>✔ Akses Penuh</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Pengguna Baru */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Akun Staf Baru</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group">
                <label className="form-label">Peran Pengguna</label>
                <select 
                  className="form-input" 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="kasir">Kasir (Akses POS, Stok, Member)</option>
                  <option value="admin">Admin (Akses Cashflow & Laporan)</option>
                  <option value="pemilik">Pemilik Toko (Akses Finansial Penuh)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Username Staf</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: andi_kasir"
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Staf</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Contoh: andi@toko.com"
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password Awal</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Minimal 6 karakter"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Daftarkan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
