import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HardDrive, 
  Plus, 
  Edit, 
  Trash2
} from 'lucide-react';

const AdminFlashdisks = () => {
  const [flashdisks, setFlashdisks] = useState([]);
  const [showFlashdiskModal, setShowFlashdiskModal] = useState(false);
  const [editingFlashdisk, setEditingFlashdisk] = useState(null);
  
  const [flashdiskForm, setFlashdiskForm] = useState({
    name: '',
    capacity_gb: '',
    real_capacity_gb: '',
    price: ''
  });

  const API_BASE = 'https://api-inventory.isavralabel.com/api/game-point-list';

  useEffect(() => {
    fetchFlashdisks();
  }, []);

  const fetchFlashdisks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/flashdisks`);
      setFlashdisks(response.data);
    } catch (error) {
      console.error('Error fetching flashdisks:', error);
    }
  };

  const handleFlashdiskSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      if (editingFlashdisk) {
        await axios.put(`${API_BASE}/flashdisks/${editingFlashdisk.id}`, flashdiskForm, { headers });
      } else {
        await axios.post(`${API_BASE}/flashdisks`, flashdiskForm, { headers });
      }
      
      setShowFlashdiskModal(false);
      setEditingFlashdisk(null);
      setFlashdiskForm({
        name: '',
        capacity_gb: '',
        real_capacity_gb: '',
        price: ''
      });
      fetchFlashdisks();
    } catch (error) {
      console.error('Error saving flashdisk:', error);
    }
  };

  const handleDeleteFlashdisk = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus flashdisk ini?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE}/flashdisks/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchFlashdisks();
      } catch (error) {
        console.error('Error deleting flashdisk:', error);
      }
    }
  };

  const editFlashdisk = (flashdisk) => {
    setEditingFlashdisk(flashdisk);
    setFlashdiskForm({
      name: flashdisk.name,
      capacity_gb: flashdisk.capacity_gb,
      real_capacity_gb: flashdisk.real_capacity_gb,
      price: flashdisk.price
    });
    setShowFlashdiskModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HardDrive className="w-6 h-6" />
          Kelola Flashdisk
        </h1>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowFlashdiskModal(true)}>
          <Plus className="w-4 h-4" />
          Tambah Flashdisk
        </button>
      </div>
      
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kapasitas (GB)</th>
                <th>Real Kapasitas (GB)</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {flashdisks.map(flashdisk => (
                <tr key={flashdisk.id} className="hover:bg-gray-50">
                  <td className="font-medium text-gray-900">{flashdisk.name}</td>
                  <td className="text-gray-600">{flashdisk.capacity_gb} GB</td>
                  <td className="text-gray-600">{flashdisk.real_capacity_gb} GB</td>
                  <td className="text-gray-600">Rp {flashdisk.price.toLocaleString()}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      flashdisk.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {flashdisk.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button 
                        className="btn btn-secondary py-2 px-3 text-xs flex items-center gap-1"
                        onClick={() => editFlashdisk(flashdisk)}
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger py-2 px-3 text-xs flex items-center gap-1"
                        onClick={() => handleDeleteFlashdisk(flashdisk.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flashdisk Modal */}
      {showFlashdiskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingFlashdisk ? 'Edit Flashdisk' : 'Tambah Flashdisk'}
              </h2>
              <button 
                className="text-2xl text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowFlashdiskModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleFlashdiskSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Flashdisk</label>
                <input
                  type="text"
                  className="form-input"
                  value={flashdiskForm.name}
                  onChange={(e) => setFlashdiskForm({...flashdiskForm, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Kapasitas (GB)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={flashdiskForm.capacity_gb}
                  onChange={(e) => setFlashdiskForm({...flashdiskForm, capacity_gb: e.target.value})}
                  placeholder="Contoh: 8.0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Kapasitas yang tertera di kemasan</p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Real Kapasitas (GB)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={flashdiskForm.real_capacity_gb}
                  onChange={(e) => setFlashdiskForm({...flashdiskForm, real_capacity_gb: e.target.value})}
                  placeholder="Contoh: 7.4"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Kapasitas yang sebenarnya tersedia</p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Harga</label>
                <input
                  type="number"
                  className="form-input"
                  value={flashdiskForm.price}
                  onChange={(e) => setFlashdiskForm({...flashdiskForm, price: e.target.value})}
                  placeholder="Contoh: 25000"
                  required
                />
              </div>
              
              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary">
                  {editingFlashdisk ? 'Update' : 'Tambah'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowFlashdiskModal(false)}>
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

export default AdminFlashdisks; 