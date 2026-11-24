import React, { useState, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  TrendingUp, 
  Scale, 
  Landmark, 
  FileSpreadsheet, 
  Download, 
  DollarSign, 
  Receipt,
  PieChart,
  CheckCircle2
} from 'lucide-react';

export default function FinancialReportsView({ formatRupiah }) {
  const { products, salesHistory } = useContext(AppContext);

  const [activeSubTab, setActiveSubTab] = useState('laba-rugi'); // laba-rugi, neraca, pajak

  // Hitung Nilai Aset Persediaan Produk
  const inventoryAsset = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);
  }, [products]);

  // Hitung Total Penjualan POS
  const totalRevenue = useMemo(() => {
    return salesHistory.reduce((sum, trx) => sum + (Number(trx.subtotal || trx.total || 0)), 0);
  }, [salesHistory]);

  // Total Diskon Member yang Diberikan
  const totalDiscounts = useMemo(() => {
    return salesHistory.reduce((sum, trx) => sum + (Number(trx.discount || 0)), 0);
  }, [salesHistory]);

  // Total PPN 11% yang Terhimpun
  const totalPajakPPN = useMemo(() => {
    return salesHistory.reduce((sum, trx) => sum + (Number(trx.ppn || 0)), 0);
  }, [salesHistory]);

  // Estimasi HPP (Harga Pokok Penjualan) ~ 62% dari total omzet
  const hppEstimate = Math.round(totalRevenue * 0.62);
  const grossProfit = totalRevenue - hppEstimate;

  // Beban Operasional Standar Toko
  const operatingExpenses = 2300000;
  const netIncome = grossProfit - operatingExpenses;

  // Saldo Kas Toko dari localStorage cashflow
  const cashBalance = useMemo(() => {
    try {
      const saved = localStorage.getItem('pos_cashflow_entries');
      if (saved) {
        const entries = JSON.parse(saved);
        const inflow = entries.filter(e => e.type === 'inflow').reduce((s, e) => s + Number(e.amount), 0) + totalRevenue;
        const outflow = entries.filter(e => e.type === 'outflow').reduce((s, e) => s + Number(e.amount), 0);
        return inflow - outflow;
      }
    } catch {}
    return 10900000 + totalRevenue;
  }, [totalRevenue]);

  const totalCurrentAssets = cashBalance + inventoryAsset;
  const totalLiabilities = 1500000;
  const totalEquity = totalCurrentAssets - totalLiabilities;

  return (
    <div className="tab-pane-container">
      {/* Header Halaman */}
      <div className="pane-header-row">
        <div>
          <h2 className="pane-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp className="text-primary" /> Laporan Keuangan Toko
          </h2>
          <p className="pane-subtitle">
            Standar pelaporan keuangan akuntansi UMKM meliputi Laba Rugi, Posisi Neraca, dan Pajak Transaksi.
          </p>
        </div>

        {/* Sub-tab Navigasi Laporan Keuangan */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button 
            className={`subclass-btn ${activeSubTab === 'laba-rugi' ? 'active makanan' : ''}`}
            onClick={() => setActiveSubTab('laba-rugi')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Laba Rugi
          </button>
          <button 
            className={`subclass-btn ${activeSubTab === 'neraca' ? 'active elektronik' : ''}`}
            onClick={() => setActiveSubTab('neraca')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Neraca Aset
          </button>
          <button 
            className={`subclass-btn ${activeSubTab === 'pajak' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('pajak')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Pajak (PPN)
          </button>
        </div>
      </div>

      {/* 1. TAB LABA RUGI */}
      {activeSubTab === 'laba-rugi' && (
        <div>
          {/* KPI Laba Rugi */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <span className="card-label">Pendapatan Kotor</span>
              <span className="card-value" style={{ color: '#2563eb' }}>{formatRupiah(totalRevenue)}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dari {salesHistory.length} transaksi kasir</span>
            </div>
            <div className="stat-card">
              <span className="card-label">Laba Kotor (Gross Profit)</span>
              <span className="card-value" style={{ color: '#16a34a' }}>{formatRupiah(grossProfit)}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Margin ~ 38% setelah HPP</span>
            </div>
            <div className="stat-card">
              <span className="card-label">Laba Bersih Usaha (Net Profit)</span>
              <span className="card-value" style={{ color: netIncome >= 0 ? '#16a34a' : '#dc2626' }}>
                {formatRupiah(netIncome)}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Setelah beban operasional usaha</span>
            </div>
          </div>

          {/* Rincian Laporan Laba Rugi */}
          <div className="table-responsive-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', padding: '16px 20px 0' }}>
              Laporan Laba Rugi Komprehensif (Periode Berjalan)
            </h3>
            <table className="modern-table">
              <tbody>
                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                  <td colSpan="2">I. PENDAPATAN OPERASIONAL</td>
                  <td style={{ textAlign: 'right' }}>Nominal</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Penjualan Produk Kasir POS</td>
                  <td>Penjualan kotor</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(totalRevenue)}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Potongan Diskon Member Loyalty</td>
                  <td>Diskon khusus keanggotaan</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>-{formatRupiah(totalDiscounts)}</td>
                </tr>
                <tr style={{ fontWeight: 700, borderBottom: '2px solid var(--border-color)' }}>
                  <td>TOTAL PENDAPATAN BERSIH</td>
                  <td></td>
                  <td style={{ textAlign: 'right', color: '#2563eb' }}>{formatRupiah(totalRevenue - totalDiscounts)}</td>
                </tr>

                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                  <td colSpan="2">II. BEBAN POKOK PENJUALAN (HPP)</td>
                  <td style={{ textAlign: 'right' }}></td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Harga Pokok Penjualan (HPP) Produk</td>
                  <td>Biaya bahan / kulakan stok</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>-{formatRupiah(hppEstimate)}</td>
                </tr>
                <tr style={{ fontWeight: 700, background: 'rgba(37, 99, 235, 0.05)' }}>
                  <td>LABA KOTOR (GROSS PROFIT)</td>
                  <td></td>
                  <td style={{ textAlign: 'right', color: '#16a34a' }}>{formatRupiah(grossProfit)}</td>
                </tr>

                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                  <td colSpan="2">III. BEBAN OPERASIONAL TOKO</td>
                  <td style={{ textAlign: 'right' }}></td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Beban Utilitas & Listrik Toko</td>
                  <td>Operasional bulanan</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>-Rp 1.450.000</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Beban Sewa & Infrastruktur Cloud</td>
                  <td>Hosting & Domain</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>-Rp 850.000</td>
                </tr>
                <tr style={{ fontWeight: 800, fontSize: '15px', background: netIncome >= 0 ? '#dcfce7' : '#fee2e2' }}>
                  <td>LABA BERSIH PERIODE BERJALAN</td>
                  <td></td>
                  <td style={{ textAlign: 'right', color: netIncome >= 0 ? '#16a34a' : '#dc2626' }}>
                    {formatRupiah(netIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TAB NERACA */}
      {activeSubTab === 'neraca' && (
        <div>
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <span className="card-label">Total Aset Toko</span>
              <span className="card-value" style={{ color: '#2563eb' }}>{formatRupiah(totalCurrentAssets)}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kas + Nilai Stok Fisik</span>
            </div>
            <div className="stat-card">
              <span className="card-label">Total Kewajiban (Hutang)</span>
              <span className="card-value" style={{ color: '#d97706' }}>{formatRupiah(totalLiabilities)}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hutang operasional jangka pendek</span>
            </div>
            <div className="stat-card">
              <span className="card-label">Ekuitas Bersih Pemilik</span>
              <span className="card-value" style={{ color: '#16a34a' }}>{formatRupiah(totalEquity)}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nilai modal bersih toko</span>
            </div>
          </div>

          <div className="table-responsive-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', padding: '16px 20px 0' }}>
              Posisi Keuangan & Neraca Saldo (Balance Sheet)
            </h3>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Kategori Akun</th>
                  <th>Keterangan Komponen</th>
                  <th style={{ textAlign: 'right' }}>Nilai Aset</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                  <td colSpan="3">A. ASET LANCAR (CURRENT ASSETS)</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Kas & Saldo Kasir</td>
                  <td>Kas tunai likuid</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(cashBalance)}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Persediaan Barang Dagang</td>
                  <td>Total stok barang ({products.length} jenis)</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(inventoryAsset)}</td>
                </tr>
                <tr style={{ fontWeight: 700, borderBottom: '2px solid var(--border-color)' }}>
                  <td>JUMLAH ASET LANCAR</td>
                  <td></td>
                  <td style={{ textAlign: 'right', color: '#2563eb' }}>{formatRupiah(totalCurrentAssets)}</td>
                </tr>

                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                  <td colSpan="3">B. KEWAJIBAN & EKUITAS (LIABILITIES & EQUITY)</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Kewajiban Jangka Pendek</td>
                  <td>Hutang usaha & tagihan utilitas</td>
                  <td style={{ textAlign: 'right' }}>{formatRupiah(totalLiabilities)}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Modal Awal Pemilik Toko</td>
                  <td>Modal disetor</td>
                  <td style={{ textAlign: 'right' }}>Rp 25.000.000</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: '32px' }}>Saldo Laba Ditahan</td>
                  <td>Akumulasi laba operasional</td>
                  <td style={{ textAlign: 'right' }}>{formatRupiah(totalEquity - 25000000)}</td>
                </tr>
                <tr style={{ fontWeight: 800, background: '#dbeafe', color: '#1e40af' }}>
                  <td>TOTAL KEWAJIBAN & EKUITAS</td>
                  <td>Status: Balanced (Seimbang)</td>
                  <td style={{ textAlign: 'right' }}>{formatRupiah(totalCurrentAssets)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TAB PAJAK PPN */}
      {activeSubTab === 'pajak' && (
        <div>
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <span className="card-label">Total PPN 1% Terhimpun</span>
              <span className="card-value" style={{ color: '#2563eb' }}>{formatRupiah(totalPajakPPN)}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pajak Pertambahan Nilai transaksi</span>
            </div>
            <div className="stat-card">
              <span className="card-label">Dasar Pengenaan Pajak (DPP)</span>
              <span className="card-value">{formatRupiah(totalRevenue - totalDiscounts)}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nilai transaksi kena pajak</span>
            </div>
            <div className="stat-card">
              <span className="card-label">Status Kepatuhan Pajak</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, fontSize: '18px', marginTop: '6px' }}>
                <CheckCircle2 size={20} /> Taat Pajak UMKM
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tarif PPN Toko (1%)</span>
            </div>
          </div>

          <div className="table-responsive-card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', padding: '16px 20px 0' }}>
              Log Rekapitulasi Pajak PPN Transaksi Kasir
            </h3>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>No. Struk</th>
                  <th>Tanggal</th>
                  <th>Pembeli</th>
                  <th style={{ textAlign: 'right' }}>DPP (Subtotal)</th>
                  <th style={{ textAlign: 'right' }}>PPN 1%</th>
                  <th style={{ textAlign: 'right' }}>Total Tagihan</th>
                </tr>
              </thead>
              <tbody>
                {salesHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Belum ada transaksi kasir yang tercatat.
                    </td>
                  </tr>
                ) : (
                  salesHistory.map((trx) => (
                    <tr key={trx.trxId || trx.id}>
                      <td><code>{trx.trxId || trx.id}</code></td>
                      <td>{trx.date}</td>
                      <td>{trx.member ? trx.member.name : 'Non-Member (Umum)'}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(trx.subtotal)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                        {formatRupiah(trx.ppn)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(trx.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
