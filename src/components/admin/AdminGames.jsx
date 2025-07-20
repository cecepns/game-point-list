import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Gamepad2, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

const AdminGames = () => {
  const [games, setGames] = useState([]);
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search term (500ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const [gameForm, setGameForm] = useState({
    name: '',
    category: '',
    image_url: '',
    size_gb: '',
    status: 'available'
  });

  const API_BASE = 'https://api-inventory.isavralabel.com/api/game-point-list';

  useEffect(() => {
    fetchGames();
  }, [currentPage, debouncedSearchTerm]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    if (debouncedSearchTerm !== searchTerm) {
      setSearchLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm
      });
      
      const response = await axios.get(`${API_BASE}/games?${params}`);
      setGames(response.data.games);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleGameSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      if (editingGame) {
        await axios.put(`${API_BASE}/games/${editingGame.id}`, gameForm, { headers });
      } else {
        await axios.post(`${API_BASE}/games`, gameForm, { headers });
      }
      
      setShowGameModal(false);
      setEditingGame(null);
      setGameForm({
        name: '',
        category: '',
        image_url: '',
        size_gb: '',
        status: 'available'
      });
      fetchGames();
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const handleDeleteGame = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus game ini?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE}/games/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchGames();
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  const editGame = (game) => {
    setEditingGame(game);
    setGameForm({
      name: game.name,
      category: game.category,
      image_url: game.image_url,
      size_gb: game.size_gb,
      status: game.status
    });
    setShowGameModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gamepad2 className="w-6 h-6" />
          Kelola Game
        </h1>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowGameModal(true)}>
          <Plus className="w-4 h-4" />
          Tambah Game
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari game berdasarkan nama atau kategori..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="p-1 text-gray-400">
              <Filter className="w-4 h-4" />
            </div>
          </div>
        </div>
        {searchTerm && (
          <div className="mt-2 text-xs text-gray-500">
            {searchLoading ? 'Mencari...' : 'Mencari secara otomatis dalam 0.5 detik...'}
          </div>
        )}
      </div>
      
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-20">Gambar</th>
                <th>Nama Game</th>
                <th>Kategori</th>
                <th>Ukuran (GB)</th>
                <th>Status</th>
                <th className="w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading || searchLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : games.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Tidak ada game yang ditemukan
                  </td>
                </tr>
              ) : (
                games.map(game => (
                  <tr key={game.id} className="hover:bg-gray-50">
                    <td>
                      <img src={game.image_url} alt={game.name} className="w-12 h-12 object-cover rounded-lg" />
                    </td>
                    <td className="font-medium text-gray-900">{game.name}</td>
                    <td className="text-gray-600">{game.category}</td>
                    <td className="text-gray-600">{game.size_gb} GB</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        game.status === 'available' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {game.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button 
                          className="btn btn-secondary py-2 px-3 text-xs flex items-center gap-1"
                          onClick={() => editGame(game)}
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger py-2 px-3 text-xs flex items-center gap-1"
                          onClick={() => handleDeleteGame(game.id)}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Menampilkan {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari {pagination.totalItems} game
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="btn btn-outline py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="flex items-center px-3 py-2 text-sm">
                Halaman {pagination.currentPage} dari {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="btn btn-outline py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Game Modal */}
      {showGameModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingGame ? 'Edit Game' : 'Tambah Game'}
              </h2>
              <button 
                className="text-2xl text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowGameModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleGameSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Game</label>
                <input
                  type="text"
                  className="form-input"
                  value={gameForm.name}
                  onChange={(e) => setGameForm({...gameForm, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <input
                  type="text"
                  className="form-input"
                  value={gameForm.category}
                  onChange={(e) => setGameForm({...gameForm, category: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">URL Gambar</label>
                <input
                  type="url"
                  className="form-input"
                  value={gameForm.image_url}
                  onChange={(e) => setGameForm({...gameForm, image_url: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Ukuran (GB)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={gameForm.size_gb}
                  onChange={(e) => setGameForm({...gameForm, size_gb: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input cursor-pointer"
                  value={gameForm.status}
                  onChange={(e) => setGameForm({...gameForm, status: e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              
              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary">
                  {editingGame ? 'Update' : 'Tambah'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowGameModal(false)}>
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

export default AdminGames; 