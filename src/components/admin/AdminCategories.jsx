import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Tags, Plus, Edit, Trash2, X } from 'lucide-react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [defaultCategories, setDefaultCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = 'https://api-inventory.isavralabel.com/api/game-point-list';

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/games/categories`);
      setCategories(response.data?.category_items || []);
      setDefaultCategories(response.data?.default_categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setErrorMessage('Gagal memuat kategori game');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return categories;
    }
    return categories.filter((category) => category.name.toLowerCase().includes(keyword));
  }, [categories, searchTerm]);

  const resetModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setShowModal(true);
    setErrorMessage('');
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowModal(true);
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!categoryName.trim()) {
      setErrorMessage('Nama kategori wajib diisi');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      if (editingCategory) {
        await axios.put(`${API_BASE}/game-categories/${editingCategory.id}`, { name: categoryName }, config);
      } else {
        await axios.post(`${API_BASE}/game-categories`, { name: categoryName }, config);
      }

      resetModal();
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.error || 'Gagal menyimpan kategori';
      setErrorMessage(message);
    }
  };

  const handleDelete = async (category) => {
    const isConfirm = window.confirm(`Hapus kategori "${category.name}"?`);
    if (!isConfirm) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/game-categories/${category.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchCategories();
    } catch (error) {
      const message = error.response?.data?.error || 'Gagal menghapus kategori';
      setErrorMessage(message);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Tags className="w-6 h-6" />
          Kelola Kategori Game
        </h1>
        <button className="btn btn-primary flex items-center gap-2" onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            className="form-input md:max-w-md"
            placeholder="Cari kategori..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="text-sm text-gray-600">
            Total kategori: {categories.length}
          </div>
        </div>
        {defaultCategories.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Kategori default:</p>
            <div className="flex flex-wrap gap-2">
              {defaultCategories.map((category) => (
                <span key={category} className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
        {errorMessage && (
          <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Nama Kategori</th>
                <th className="w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" className="text-center py-8 text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center py-8 text-gray-500">Tidak ada kategori</td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="font-medium text-gray-900">{category.name}</td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-secondary py-2 px-3 text-xs flex items-center gap-1"
                          onClick={() => openEditModal(category)}
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          className="btn btn-danger py-2 px-3 text-xs flex items-center gap-1"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button
                className="text-2xl text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={resetModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Kategori</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Contoh: PS 2 MOD"
                  required
                />
                {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update' : 'Tambah'}
                </button>
                <button type="button" className="btn btn-outline" onClick={resetModal}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
