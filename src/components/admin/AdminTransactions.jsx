import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ShoppingCart, 
  Trash2,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gamepad2
} from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Game list modal states
  const [showGameModal, setShowGameModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionGames, setTransactionGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Debounced search term (500ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const API_BASE = 'https://api-inventory.isavralabel.com/api/game-point-list';

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, debouncedSearchTerm]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    if (debouncedSearchTerm !== searchTerm) {
      setSearchLoading(true);
    }
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm
      });
      
      const response = await axios.get(`${API_BASE}/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
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

  const handleClearTransactions = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua transaksi?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE}/transactions/clear`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchTransactions();
      } catch (error) {
        console.error('Error clearing transactions:', error);
      }
    }
  };

  const handleViewGames = async (transaction) => {
    setSelectedTransaction(transaction);
    setShowGameModal(true);
    setLoadingGames(true);
    
    try {
      const response = await axios.get(`${API_BASE}/transactions/${transaction.transaction_id}`);
      setTransactionGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching transaction games:', error);
      setTransactionGames([]);
    } finally {
      setLoadingGames(false);
    }
  };

  const closeGameModal = () => {
    setShowGameModal(false);
    setSelectedTransaction(null);
    setTransactionGames([]);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />
          Transaksi User
        </h1>
        <button className="btn btn-danger flex items-center gap-2 w-full sm:w-auto" onClick={handleClearTransactions}>
          <Trash2 className="w-4 h-4" />
          Clear Semua Transaksi
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan nama user, ID transaksi, flashdisk, atau game..."
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
                <th className="w-20 lg:w-24">ID Transaksi</th>
                <th>Nama User</th>
                <th className="hidden lg:table-cell">Alamat</th>
                <th className="hidden md:table-cell">Flashdisk</th>
                {/* <th className="hidden sm:table-cell">Real Kapasitas</th> */}
                <th className="hidden sm:table-cell">Total Size</th>
                <th className="hidden md:table-cell">Game</th>
                <th className="hidden sm:table-cell">Tanggal</th>
                <th className="w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading || searchLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    Tidak ada transaksi yang ditemukan
                  </td>
                </tr>
              ) : (
                transactions.map(transaction => (
                  <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                    <td className="font-mono text-xs lg:text-sm text-gray-600">
                      {transaction.transaction_id}
                    </td>
                    <td className="font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span>{transaction.user_name}</span>
                        <span className="text-xs text-gray-500 lg:hidden">
                          {transaction.user_address && transaction.user_address.length > 30 
                            ? `${transaction.user_address.substring(0, 30)}...` 
                            : transaction.user_address}
                        </span>
                      </div>
                    </td>
                    <td className="text-gray-600 hidden lg:table-cell max-w-xs truncate">
                      {transaction.user_address}
                    </td>
                    <td className="text-gray-600 hidden md:table-cell">{transaction.flashdisk_name}</td>
                    {/* <td className="text-gray-600 hidden sm:table-cell">{transaction.real_capacity_gb} GB</td> */}
                    <td className="text-gray-600 hidden sm:table-cell">{transaction.total_size_gb} GB</td>
                    <td className="text-gray-600 hidden md:table-cell max-w-xs truncate">{transaction.game_names}</td>
                    <td className="text-gray-600 hidden sm:table-cell">{new Date(transaction.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleViewGames(transaction)}
                        className="btn btn-primary py-1 px-2 text-xs flex items-center gap-1"
                        title="Lihat daftar game"
                      >
                        <Eye className="w-3 h-3" />
                        Lihat
                      </button>
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
              Menampilkan {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari {pagination.totalItems} transaksi
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

      {/* Game List Modal */}
      {showGameModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Daftar Game - {selectedTransaction?.transaction_id}
              </h2>
              <button 
                className="text-2xl text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={closeGameModal}
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>User:</strong> {selectedTransaction?.user_name} | 
                <strong> Flashdisk:</strong> {selectedTransaction?.flashdisk_name} | 
                <strong> Total Size:</strong> {selectedTransaction?.total_size_gb} GB
              </p>
            </div>
            
            {loadingGames ? (
              <div className="text-center py-8 text-gray-500">
                Memuat daftar game...
              </div>
            ) : transactionGames.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada game yang ditemukan
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="w-16">Gambar</th>
                      <th>Nama Game</th>
                      <th>Kategori</th>
                      <th>Ukuran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionGames.map(game => (
                      <tr key={game.id} className="hover:bg-gray-50">
                        <td>
                          <img 
                            src={game.image_url} 
                            alt={game.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        </td>
                        <td>
                          <p className="font-semibold text-gray-900">{game.name}</p>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {game.category}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-600">{game.size_gb} GB</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6">
              <button className="btn btn-primary" onClick={closeGameModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions; 