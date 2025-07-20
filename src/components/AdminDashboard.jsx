import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { 
  Gamepad2, 
  HardDrive, 
  ShoppingCart, 
  Plus, 
  Edit, 
  Trash2, 
  LogOut,
  User,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Menu
} from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import AdminTransactions from './admin/AdminTransactions';

const AdminDashboard = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('games');
  const [games, setGames] = useState([]);
  const [flashdisks, setFlashdisks] = useState([]);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showFlashdiskModal, setShowFlashdiskModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [editingFlashdisk, setEditingFlashdisk] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start with sidebar closed
  
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
  
  const [flashdiskForm, setFlashdiskForm] = useState({
    name: '',
    capacity_gb: '',
    price: ''
  });

  const API_BASE = 'https://api-inventory.isavralabel.com/api/game-point-list';

  useEffect(() => {
    fetchGames();
    fetchFlashdisks();
  }, [currentPage, debouncedSearchTerm]);

  // Ensure sidebar starts closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Close sidebar when switching to desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        const toggleButton = document.getElementById('sidebar-toggle');
        if (sidebar && !sidebar.contains(event.target) && !toggleButton?.contains(event.target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

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

  const fetchFlashdisks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/flashdisks`);
      setFlashdisks(response.data);
    } catch (error) {
      console.error('Error fetching flashdisks:', error);
    }
  };

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
        price: ''
      });
      fetchFlashdisks();
    } catch (error) {
      console.error('Error saving flashdisk:', error);
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

  const editFlashdisk = (flashdisk) => {
    setEditingFlashdisk(flashdisk);
    setFlashdiskForm({
      name: flashdisk.name,
      capacity_gb: flashdisk.capacity_gb,
      price: flashdisk.price
    });
    setShowFlashdiskModal(true);
  };

  const toggleSidebar = () => {
    console.log('Toggle clicked, current state:', sidebarOpen, 'new state:', !sidebarOpen);
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    closeSidebar();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        id="sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:shadow-lg
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                <p className="text-xs text-gray-400">Dashboard</p>
              </div>
            </div>
            <button 
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
              onClick={closeSidebar}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{currentUser.username}</p>
                <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'games' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => handleTabChange('games')}
            >
              <Gamepad2 className="w-5 h-5" />
              <span className="font-medium">Kelola Game</span>
            </button>
            
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'flashdisks' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => handleTabChange('flashdisks')}
            >
              <HardDrive className="w-5 h-5" />
              <span className="font-medium">Kelola Flashdisk</span>
            </button>
            
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'transactions' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => handleTabChange('transactions')}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Transaksi</span>
            </button>
          </nav>
          
          {/* Logout Button */}
          <div className="p-4 border-t border-gray-700">
            <button 
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200"
              onClick={onLogout}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden relative z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              id="sidebar-toggle"
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
              onClick={toggleSidebar}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Admin Panel
              <span className="text-xs text-red-500 ml-2">({sidebarOpen ? 'Open' : 'Closed'})</span>
            </h1>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'games' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
                  Kelola Game
                </h1>
                <button className="btn btn-primary flex items-center gap-2 w-full sm:w-auto" onClick={() => setShowGameModal(true)}>
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
                        <th className="w-16 lg:w-20">Gambar</th>
                        <th>Nama Game</th>
                        <th className="hidden md:table-cell">Kategori</th>
                        <th className="hidden sm:table-cell">Ukuran (GB)</th>
                        <th className="hidden sm:table-cell">Status</th>
                        <th className="w-24 lg:w-32">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading || searchLoading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              Memuat data...
                            </div>
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
                          <tr key={game.id} className="hover:bg-gray-50 transition-colors">
                            <td>
                              <img src={game.image_url} alt={game.name} className="w-10 h-10 lg:w-12 lg:h-12 object-cover rounded-lg" />
                            </td>
                            <td className="font-medium text-gray-900">
                              <div className="flex flex-col">
                                <span>{game.name}</span>
                                <span className="text-xs text-gray-500 md:hidden">{game.category}</span>
                                <span className="text-xs text-gray-500 sm:hidden">{game.size_gb} GB</span>
                              </div>
                            </td>
                            <td className="text-gray-600 hidden md:table-cell">{game.category}</td>
                            <td className="text-gray-600 hidden sm:table-cell">{game.size_gb} GB</td>
                            <td className="hidden sm:table-cell">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                game.status === 'available' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {game.status}
                              </span>
                            </td>
                            <td>
                              <div className="flex flex-col sm:flex-row gap-1">
                                <button 
                                  className="btn btn-secondary py-1 px-2 text-xs flex items-center gap-1"
                                  onClick={() => editGame(game)}
                                >
                                  <Edit className="w-3 h-3" />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button 
                                  className="btn btn-danger py-1 px-2 text-xs flex items-center gap-1"
                                  onClick={() => handleDeleteGame(game.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span className="hidden sm:inline">Hapus</span>
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
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                    <div className="text-sm text-gray-600 text-center sm:text-left">
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
            </div>
          )}

          {activeTab === 'flashdisks' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
                  Kelola Flashdisk
                </h1>
                <button className="btn btn-primary w-full sm:w-auto" onClick={() => setShowFlashdiskModal(true)}>
                  Tambah Flashdisk
                </button>
              </div>
              
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th className="hidden sm:table-cell">Kapasitas (GB)</th>
                        <th className="hidden md:table-cell">Harga</th>
                        <th className="hidden sm:table-cell">Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flashdisks.map(flashdisk => (
                        <tr key={flashdisk.id} className="hover:bg-gray-50 transition-colors">
                          <td className="font-medium text-gray-900">
                            <div className="flex flex-col">
                              <span>{flashdisk.name}</span>
                              <span className="text-xs text-gray-500 sm:hidden">{flashdisk.capacity_gb} GB</span>
                            </div>
                          </td>
                          <td className="text-gray-600 hidden sm:table-cell">{flashdisk.capacity_gb} GB</td>
                          <td className="text-gray-600 hidden md:table-cell">Rp {flashdisk.price.toLocaleString()}</td>
                          <td className="hidden sm:table-cell">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              flashdisk.is_active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {flashdisk.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td>
                            <div className="flex flex-col sm:flex-row gap-1">
                              <button className="btn btn-secondary py-1 px-2 text-xs" onClick={() => editFlashdisk(flashdisk)}>
                                Edit
                              </button>
                              <button className="btn btn-danger py-1 px-2 text-xs" onClick={() => handleDeleteFlashdisk(flashdisk.id)}>
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
            </div>
          )}

          {activeTab === 'transactions' && <AdminTransactions />}
        </main>
      </div>

      {/* Game Modal */}
      {showGameModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md mx-4">
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

      {/* Flashdisk Modal */}
      {showFlashdiskModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md mx-4">
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
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Harga</label>
                <input
                  type="number"
                  className="form-input"
                  value={flashdiskForm.price}
                  onChange={(e) => setFlashdiskForm({...flashdiskForm, price: e.target.value})}
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

AdminDashboard.propTypes = {
  currentUser: PropTypes.shape({
    username: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired
  }).isRequired,
  onLogout: PropTypes.func.isRequired
};

export default AdminDashboard;