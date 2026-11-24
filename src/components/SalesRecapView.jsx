import React, { useState, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  ReceiptText, 
  Search, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  ShoppingCart,
  Eye,
  TrendingUp,
  Clock,
  User,
  ShoppingBag
} from 'lucide-react';

export default function SalesRecapView({ formatRupiah }) {
  const { salesHistory, setCurrentReceipt } = useContext(AppContext);
  const [searchTrx, setSearchTrx] = useState('');

  const totalOmzet = useMemo(() => {
    return salesHistory.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  }, [salesHistory]);

  const totalQtySold = useMemo(() => {
    return salesHistory.reduce((sum, t) => {
      const itemsCount = (t.items || []).reduce((s, it) => s + (Number(it.quantity) || 1), 0);
      return sum + itemsCount;
    }, 0);
  }, [salesHistory]);

  const avgTicket = salesHistory.length > 0 ? Math.round(totalOmzet / salesHistory.length) : 0;

  const filteredHistory = useMemo(() => {
    if (!searchTrx.trim()) return salesHistory;
    const q = searchTrx.toLowerCase();
    return salesHistory.filter((t) => {
      const idMatch = (t.trxId || t.id || '').toLowerCase().includes(q);
      const memberMatch = (t.member ? t.member.name : 'Umum').toLowerCase().includes(q);
      return idMatch || memberMatch;
    });
  }, [salesHistory, searchTrx]);

  const handleExportCSV = () => {
    let csv = 'ID Transaksi,Tanggal,Pelanggan,Subtotal,Diskon,PPN,Grand Total,Status\n';
    salesHistory.forEach((t) => {
      const mName = t.member ? t.member.name : 'Non-Member (Umum)';
      csv += `"${t.trxId || t.id}","${t.date}","${mName}",${t.subtotal},${t.discount},${t.ppn},${t.total},"SELESAI"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Penjualan_Kasir_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="tab-pane-container">
      {/* Header Halaman */}
      <div className="pane-header-row">
        <div>
          <h2 className="pane-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ReceiptText className="text-primary" size={26} /> Rekapitulasi Riwayat Penjualan Kasir
          </h2>
          <p className="pane-subtitle">
            Daftar lengkap invoice transaksi pembayaran kasir, pencetakan struk ulang, dan audit penjualan shift.
          </p>
        </div>
        <button className="btn-secondary" onClick={handleExportCSV}>
          <FileSpreadsheet size={16} /> Export Rekap CSV
        </button>
      </div>

      {/* Ringkasan Metrik Kasir (Stat Cards) */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="card-label">Total Penjualan Shift Ini</span>
            <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="card-value" style={{ color: '#16a34a' }}>{formatRupiah(totalOmzet)}</span>
          <span className="stat-subtext">Akumulasi omzet kasir</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="card-label">Total Struk Terbit</span>
            <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <ReceiptText size={20} />
            </div>
          </div>
          <span className="card-value" style={{ color: '#2563eb' }}>{salesHistory.length} Transaksi</span>
          <span className="stat-subtext">{totalQtySold} total barang terjual</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="card-label">Rata-rata Belanja / Struk</span>
            <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              <ShoppingCart size={20} />
            </div>
          </div>
          <span className="card-value" style={{ color: '#7c3aed' }}>{formatRupiah(avgTicket)}</span>
          <span className="stat-subtext">Ticket size per transaksi</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-controls-card">
        <div className="search-container" style={{ maxWidth: '380px', margin: 0 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari ID Struk (TRX-...) atau Nama Pelanggan"
            value={searchTrx}
            onChange={(e) => setSearchTrx(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
          Menampilkan {filteredHistory.length} dari {salesHistory.length} transaksi
        </div>
      </div>

      {/* Tabel Rekap Penjualan */}
      <div className="table-responsive-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>No. Struk</th>
              <th>Waktu Transaksi</th>
              <th>Pelanggan</th>
              <th>Item Belanja</th>
              <th style={{ textAlign: 'right' }}>Subtotal</th>
              <th style={{ textAlign: 'right' }}>Diskon</th>
              <th style={{ textAlign: 'right' }}>PPN 1%</th>
              <th style={{ textAlign: 'right' }}>Grand Total</th>
              <th style={{ textAlign: 'center' }}>Cetak Struk</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Belum ada riwayat transaksi penjualan kasir.
                </td>
              </tr>
            ) : (
              filteredHistory.map((t) => (
                <tr key={t.trxId || t.id}>
                  <td>
                    <code style={{ 
                      background: 'var(--bg-hover)', 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 700, 
                      color: '#2563eb' 
                    }}>
                      {t.trxId || t.id}
                    </code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{t.date}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge ${t.member ? 'badge-info' : 'badge-secondary'}`} style={{ fontSize: '11.5px' }}>
                        {t.member ? t.member.name : 'Non-Member (Umum)'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {(t.items || []).map((it, idx) => (
                        <div key={idx} style={{ color: 'var(--text-muted)' }}>
                          • {it.name} <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>x{it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(t.subtotal)}</td>
                  <td style={{ textAlign: 'right', color: t.discount > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: t.discount > 0 ? 700 : 400 }}>
                    {t.discount > 0 ? `-${formatRupiah(t.discount)}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>{formatRupiah(t.ppn)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: '14px' }}>
                    {formatRupiah(t.total)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => setCurrentReceipt(t)}
                    >
                      <Eye size={14} /> Lihat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
