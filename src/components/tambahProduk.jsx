import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { X, Sparkles, Tag, PlusCircle } from 'lucide-react';

const AddProductDrawer = ({ isOpen, onClose }) => {
  const { addProduct } = useContext(AppContext);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Elektronik');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [details, setDetails] = useState('24 Bulan Garansi');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !price || !stock) {
      alert('Mohon lengkapi nama produk, harga, dan stok awal!');
      return;
    }

    const finalCategory = category.trim() || 'Umum';

    addProduct({
      name: name.trim(),
      category: finalCategory,
      price: Number(price),
      stock: Number(stock),
      details: details.trim() || '-'
    });

    // Reset Form
    setName('');
    setCategory('Elektronik');
    setPrice('');
    setStock('');
    setDetails('24 Bulan Garansi');
    onClose();
  };

  const quickCategories = ['Elektronik', 'Makanan', 'Minuman', 'Pakaian', 'Aksesoris'];

  const handleSelectQuickCategory = (cat) => {
    setCategory(cat);
    if (cat === 'Elektronik') setDetails('24 Bulan Garansi');
    else if (cat === 'Makanan') setDetails('Kedaluwarsa: Des 2026 / Halal ID');
    else if (cat === 'Minuman') setDetails('Kedaluwarsa: Nov 2026 / 350ml');
    else if (cat === 'Pakaian') setDetails('Ukuran: L / Katun Combed');
    else if (cat === 'Aksesoris') setDetails('Material Berkualitas');
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Drawer */}
        <div className="drawer-header" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '24px',
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={22} style={{ color: '#3b82f6' }} /> Tambah Barang Baru
            </h2>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                border: 'none', 
                color: '#ffffff', 
                cursor: 'pointer', 
                padding: '6px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
            >
              <X size={18} />
            </button>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Input Data Polimorfisme Kelas & Pewarisan Objek Produk
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="drawer-form">
          {/* Nama Produk */}
          <div className="form-group">
            <label className="form-label">Nama Produk *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Kulkas Showcase LG Smart"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Subclass Category (Input Form Ketik Bebas) */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={13} style={{ color: '#3b82f6' }} /> Subclass Kelas *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ketik nama subclass barang (Contoh: Elektronik, Makanan, Minuman, Pakaian, dll)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            {/* Quick Suggestion Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {quickCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectQuickCategory(cat)}
                  style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    border: category.toLowerCase() === cat.toLowerCase() ? '1px solid #2563eb' : '1px solid var(--border-color)',
                    background: category.toLowerCase() === cat.toLowerCase() ? '#dbeafe' : 'var(--bg-hover)',
                    color: category.toLowerCase() === cat.toLowerCase() ? '#1d4ed8' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  +{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Special Attribute (Polymorphic Field) */}
          <div className="dynamic-attribute-box" style={{ borderRadius: '12px', padding: '14px', border: '1px solid #e0e7ff', background: 'rgba(99, 102, 241, 0.04)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5' }}>
                <Sparkles size={14} />
                Atribut Khusus {category ? `(${category})` : 'Produk'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  category.toLowerCase() === 'elektronik'
                    ? 'Contoh: 24 Bulan Garansi Resmi'
                    : category.toLowerCase() === 'makanan'
                    ? 'Contoh: Kedaluwarsa: Des 2026 / Sertifikasi Halal'
                    : 'Contoh: Garansi, Kadaluwarsa, Ukuran, atau Spesifikasi Khusus'
                }
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Atribut spesifik polimorfik untuk kelas turunan produk.
              </span>
            </div>
          </div>

          {/* Harga Satuan */}
          <div className="form-group">
            <label className="form-label">Harga Satuan (Rp) *</label>
            <input
              type="number"
              className="form-input"
              placeholder="Contoh: 7500000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
            />
          </div>

          {/* Stok */}
          <div className="form-group">
            <label className="form-label">Stok Awal *</label>
            <input
              type="number"
              className="form-input"
              placeholder="Contoh: 18"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              min="0"
            />
          </div>

          {/* Buttons Footer */}
          <div className="drawer-footer" style={{ margin: 'auto -24px -24px', borderBottomLeftRadius: '0', borderBottomRightRadius: '0' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-submit">
              Simpan Objek
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductDrawer;
