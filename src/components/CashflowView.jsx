import React, { useState, useEffect, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  ArrowLeftRight, 
  ArrowDownRight, 
  ArrowUpRight, 
  Wallet, 
  Plus, 
  Calendar, 
  Filter, 
  FileSpreadsheet, 
  Trash2,
  X,
  TrendingUp,
  Receipt
} from 'lucide-react';

const defaultCashflowEntries = [
  {
    id: 'CF-001',
    date: '2026-11-01',
    type: 'inflow',
    category: 'Modal Awal',
    description: 'Setoran modal kas awal toko',
    amount: 25000000,
  },
  {
    id: 'CF-002',
    date: '2026-11-05',
    type: 'outflow',
    category: 'Restock Produk',
    description: 'Pembelian stok awal kulkas dan bahan makanan',
    amount: 11800000,
  },
  {
    id: 'CF-003',
    date: '2026-11-10',
    type: 'outflow',
    category: 'Operasional',
    description: 'Pembayaran listrik, internet, dan utilitas toko',
    amount: 1450000,
  },
  {
    id: 'CF-004',
    date: '2026-11-15',
    type: 'outflow',
    category: 'Sewa & Cloud',
    description: 'Langganan server cloud AWS dan sewa tempat',
    amount: 850000,
  },
];

export default function CashflowView({ formatRupiah }) {
  const { salesHistory } = useContext(AppContext);

  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_cashflow_entries');
      return saved ? JSON.parse(saved) : defaultCashflowEntries;
    } catch {
      return defaultCashflowEntries;
    }
  });

  const [filterType, setFilterType] = useState('all'); // all, inflow, outflow
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState('inflow');
  const [entryCategory, setEntryCategory] = useState('Operasional');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryAmount, setEntryAmount] = useState('');

  // Simpan ke localStorage saat entries berubah
  useEffect(() => {
    try {
      localStorage.setItem('pos_cashflow_entries', JSON.stringify(entries));
    } catch (e) {
      console.error(e);
    }
  }, [entries]);

  // Total pemasukan kasir real-time dari riwayat penjualan POS
  const totalSalesRevenue = useMemo(() => {
    return salesHistory.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [salesHistory]);

  // Gabungkan transaksi manual + omzet otomatis kasir
  const allInflows = useMemo(() => {
    const manualInflow = entries
      .filter((e) => e.type === 'inflow')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return manualInflow + totalSalesRevenue;
  }, [entries, totalSalesRevenue]);

  const allOutflows = useMemo(() => {
    return entries
      .filter((e) => e.type === 'outflow')
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [entries]);

  const netCashflow = allInflows - allOutflows;

  // Filter tabel
  const filteredEntries = useMemo(() => {
    if (filterType === 'all') return entries;
    return entries.filter((e) => e.type === filterType);
  }, [entries, filterType]);

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!entryAmount || Number(entryAmount) <= 0) {
      alert('Nominal harus lebih dari 0!');
      return;
    }

    const newId = `CF-${String(entries.length + 1).padStart(3, '0')}`;
    const newEntry = {
      id: newId,
      date: entryDate,
      type: entryType,
      category: entryCategory,
      description: entryDesc || '-',
      amount: Number(entryAmount),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setIsModalOpen(false);
    setEntryAmount('');
    setEntryDesc('');
  };

  const handleDeleteEntry = (id) => {
    if (confirm('Hapus pencatatan kas ini?')) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleExportCSV = () => {
    let csv = 'ID,Tanggal,Tipe,Kategori,Keterangan,Nominal\n';
    entries.forEach((e) => {
      csv += `"${e.id}","${e.date}","${e.type === 'inflow' ? 'Kas Masuk' : 'Kas Keluar'}","${e.category}","${e.description}",${e.amount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cashflow_Toko_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="tab-pane-container">
      {/* Header Halaman */}
      <div className="pane-header-row">
        <div>
          <h2 className="pane-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeftRight className="text-primary" /> Cashflow Bisnis & Arus Kas
          </h2>
          <p className="pane-subtitle">
            Pantau perputaran likuiditas kas masuk, pengeluaran operasional, dan saldo kas bersih toko.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleExportCSV}>
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Catat Arus Kas
          </button>
        </div>
      </div>

      {/* Ringkasan Kartu Metrik Cashflow */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="card-label">Total Arus Kas Masuk (Inflow)</span>
            <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <ArrowDownRight size={22} />
            </div>
          </div>
          <span className="card-value" style={{ color: '#16a34a' }}>{formatRupiah(allInflows)}</span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Termasuk omzet POS: <strong>{formatRupiah(totalSalesRevenue)}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="card-label">Total Arus Kas Keluar (Outflow)</span>
            <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <ArrowUpRight size={22} />
            </div>
          </div>
          <span className="card-value" style={{ color: '#dc2626' }}>{formatRupiah(allOutflows)}</span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Biaya kulakan, operasional, & utilitas
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="card-label">Saldo Kas Bersih (Net Cash)</span>
            <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <Wallet size={22} />
            </div>
          </div>
          <span className="card-value" style={{ color: netCashflow >= 0 ? '#2563eb' : '#dc2626' }}>
            {formatRupiah(netCashflow)}
          </span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {netCashflow >= 0 ? 'Surplus Likuiditas Toko' : 'Defisit Kas Toko'}
          </div>
        </div>
      </div>

      {/* Filter & Kontrol Tabel */}
      <div className="filter-controls-card">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Filter Tipe:</span>
          <button 
            className={`filter-pill-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Semua ({entries.length})
          </button>
          <button 
            className={`filter-pill-btn ${filterType === 'inflow' ? 'active' : ''}`}
            onClick={() => setFilterType('inflow')}
          >
            Kas Masuk
          </button>
          <button 
            className={`filter-pill-btn ${filterType === 'outflow' ? 'active' : ''}`}
            onClick={() => setFilterType('outflow')}
          >
            Kas Keluar
          </button>
        </div>
      </div>

      {/* Tabel Mutasi Kas */}
      <div className="table-responsive-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID Mutasi</th>
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th>Keterangan</th>
              <th style={{ textAlign: 'right' }}>Nominal</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {/* Baris Khusus: Real-time POS Inflow */}
            <tr style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
              <td><span className="badge badge-info">POS-AUTO</span></td>
              <td>Hari ini</td>
              <td><span className="badge badge-success">Kas Masuk</span></td>
              <td><strong>Penjualan Kasir (POS)</strong></td>
              <td>Akumulasi transaksi penjualan kasir langsung</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                +{formatRupiah(totalSalesRevenue)}
              </td>
              <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>Otomatis</td>
            </tr>

            {filteredEntries.map((e) => (
              <tr key={e.id}>
                <td><code>{e.id}</code></td>
                <td>{e.date}</td>
                <td>
                  <span className={`badge ${e.type === 'inflow' ? 'badge-success' : 'badge-danger'}`}>
                    {e.type === 'inflow' ? 'Kas Masuk' : 'Kas Keluar'}
                  </span>
                </td>
                <td><strong>{e.category}</strong></td>
                <td>{e.description}</td>
                <td style={{ 
                  textAlign: 'right', 
                  fontWeight: 700, 
                  color: e.type === 'inflow' ? '#16a34a' : '#dc2626' 
                }}>
                  {e.type === 'inflow' ? '+' : '-'}{formatRupiah(e.amount)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    className="btn-icon-danger" 
                    onClick={() => handleDeleteEntry(e.id)}
                    title="Hapus pencatatan"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Catatan Arus Kas */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Catat Transaksi Arus Kas</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEntry} className="modal-form">
              <div className="form-group">
                <label className="form-label">Tanggal Transaksi</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={entryDate} 
                  onChange={(e) => setEntryDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipe Arus Kas</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className={`subclass-btn ${entryType === 'inflow' ? 'active makanan' : ''}`}
                    onClick={() => setEntryType('inflow')}
                  >
                    Kas Masuk (+)
                  </button>
                  <button
                    type="button"
                    className={`subclass-btn ${entryType === 'outflow' ? 'active elektronik' : ''}`}
                    onClick={() => setEntryType('outflow')}
                  >
                    Kas Keluar (-)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select 
                  className="form-input" 
                  value={entryCategory} 
                  onChange={(e) => setEntryCategory(e.target.value)}
                >
                  <option value="Operasional">Operasional & Utilitas</option>
                  <option value="Restock Produk">Pengadaan Stok Barang</option>
                  <option value="Gaji Karyawan">Gaji Karyawan / Kasir</option>
                  <option value="Sewa & Cloud">Sewa Tempat & Server Cloud</option>
                  <option value="Modal Awal">Setoran Modal Usaha</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nominal (Rp)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Contoh: 500000"
                  value={entryAmount} 
                  onChange={(e) => setEntryAmount(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Keterangan / Catatan</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: Pembelian galon & sabun cuci"
                  value={entryDesc} 
                  onChange={(e) => setEntryDesc(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
