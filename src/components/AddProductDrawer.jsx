import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { X, Sparkles } from 'lucide-react';

const AddProductDrawer = ({ isOpen, onClose }) => {
  const { addProduct } = useContext(AppContext);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Elektronik');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price || !stock) {
      alert('Mohon isi semua field wajib!');
      return;
    }

    addProduct({
      name,
      category,
      price: Number(price),
      stock: Number(stock),
      details: details || '-'
    });

    // Reset Form
    setName('');
    setCategory('Elektronik');
    setPrice('');
    setStock('');
    setDetails('');
    onClose();
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="drawer-title">Tambah Barang Baru</h2>
            <button onClick={onClose} style={{ color: '#ffffff' }}>
              <X size={20} />
            </button>
          </div>
          <p className="drawer-desc">Input Data Polimorfisme Kelas</p>
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

          {/* Subclass Category */}
          <div className="form-group">
            <label className="form-label">Subclass Kelas *</label>
            <div className="subclass-selectors">
              <button
                type="button"
                className={`subclass-btn ${category === 'Elektronik' ? 'active elektronik' : ''}`}
                onClick={() => {
                  setCategory('Elektronik');
                  setDetails('24 Bulan Garansi'); // Default detail placeholder for Elektronik
                }}
              >
                Elektronik (Subclass)
              </button>
              <button
                type="button"
                className={`subclass-btn ${category === 'Makanan' ? 'active makanan' : ''}`}
                onClick={() => {
                  setCategory('Makanan');
                  setDetails('Kedaluwarsa: Des 2026'); // Default detail placeholder for Makanan
                }}
              >
                Makanan (Subclass)
              </button>
            </div>
          </div>

          {/* Special Attribute (Polymorphic Field) */}
          <div className={`dynamic-attribute-box ${category === 'Makanan' ? 'makanan' : ''}`}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: category === 'Elektronik' ? 'var(--subclass-elektronik-txt)' : 'var(--subclass-makanan-txt)' }}>
                <Sparkles size={12} />
                Atribut Khusus {category}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={category === 'Elektronik' ? 'Contoh: 24 Bulan Garansi' : 'Contoh: Kedaluwarsa: Des 2026 / Halal ID'}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
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
