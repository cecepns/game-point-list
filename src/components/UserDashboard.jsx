import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import {
  Search,
  Plus,
  Trash2,
  ShoppingCart,
  HardDrive,
  Gamepad2,
  Package,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  MessageCircle,
  Store,
} from "lucide-react";
import Toast from "./Toast";

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const UserDashboard = ({ currentUser, onLogout }) => {
  const [games, setGames] = useState([]);
  const [flashdisks, setFlashdisks] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedFlashdisk, setSelectedFlashdisk] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [toast, setToast] = useState(null);

  // User info form for order
  const [userInfo, setUserInfo] = useState({
    user_name: "",
    user_address: "",
  });

  // Order data for modal
  const [orderData, setOrderData] = useState({
    flashdisk: null,
    games: [],
    totalSize: 0,
    totalPrice: 0,
    user_name: "",
    user_address: "",
  });

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search term (500ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const API_BASE = "https://api-inventory.isavralabel.com/api/game-point-list";

  useEffect(() => {
    fetchGames();
    fetchFlashdisks();
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
        search: debouncedSearchTerm,
        status: "available",
      });

      const response = await axios.get(`${API_BASE}/games?${params}`);
      setGames(response.data.games);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching games:", error);
      setToast({ message: "Gagal memuat data game", type: "error" });
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
      console.error("Error fetching flashdisks:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const addToCart = (game) => {
    const existingItem = cart.find((item) => item.id === game.id);
    if (existingItem) {
      setToast({ message: "Game sudah ada di keranjang!", type: "error" });
      return;
    }

    setCart([...cart, game]);
    setToast({
      message: "Game berhasil ditambahkan ke keranjang!",
      type: "success",
    });
  };

  const removeFromCart = (gameId) => {
    setCart(cart.filter((item) => item.id !== gameId));
  };

  const getTotalSize = () => {
    return cart.reduce((total, game) => total + parseFloat(game.size_gb), 0);
  };

  const handleFlashdiskSelect = (flashdisk) => {
    setSelectedFlashdisk(flashdisk);
  };

  const handleCreateOrder = () => {
    if (cart.length === 0) {
      setToast({ message: "Keranjang masih kosong!", type: "error" });
      return;
    }

    if (!selectedFlashdisk) {
      setToast({ message: "Pilih flashdisk terlebih dahulu!", type: "error" });
      return;
    }

    const totalSize = getTotalSize();
    if (totalSize > selectedFlashdisk.real_capacity_gb) {
      setToast({
        message: `Total ukuran game (${totalSize.toFixed(
          1
        )} GB) melebihi real kapasitas flashdisk (${
          selectedFlashdisk.real_capacity_gb
        } GB)!`,
        type: "error",
      });
      return;
    }

    // Pre-fill user info with current user data
    // setUserInfo({
    //   user_name: currentUser.username,
    //   user_address: ''
    // });
    setShowUserInfoModal(true);
  };

  const createOrder = async () => {
    if (!userInfo.user_name.trim() || !userInfo.user_address.trim()) {
      setToast({ message: "Nama dan alamat harus diisi!", type: "error" });
      return;
    }

    try {
      const totalSize = getTotalSize();
      const orderData = {
        user_name: userInfo.user_name,
        user_address: userInfo.user_address,
        flashdisk_id: selectedFlashdisk.id,
        games: cart,
        total_size_gb: totalSize,
      };

      const response = await axios.post(`${API_BASE}/transactions`, orderData);
      setTransactionId(response.data.transaction_id);

      // Save order data for modal before resetting
      setOrderData({
        flashdisk: selectedFlashdisk,
        games: [...cart],
        totalSize: totalSize,
        totalPrice: selectedFlashdisk.price,
        user_name: userInfo.user_name,
        user_address: userInfo.user_address,
      });

      setShowUserInfoModal(false);
      setShowOrderModal(true);
      setToast({ message: "Pesanan berhasil dibuat!", type: "success" });

      // Reset cart and selection
      setCart([]);
      setSelectedFlashdisk(null);
      setUserInfo({ user_name: "", user_address: "" });
    } catch (error) {
      console.error("Error creating order:", error);
      setToast({
        message: "Gagal membuat pesanan. Silakan coba lagi.",
        type: "error",
      });
    }
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setTransactionId("");
    setOrderData({
      flashdisk: null,
      games: [],
      totalSize: 0,
      totalPrice: 0,
      user_name: "",
      user_address: "",
    });
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case "action":
        return "⚔️";
      case "adventure":
        return "🗺️";
      case "rpg":
        return "⚔️";
      case "strategy":
        return "🎯";
      case "sports":
        return "⚽";
      case "racing":
        return "🏎️";
      case "puzzle":
        return "🧩";
      default:
        return "🎮";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Game Request</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <User className="w-4 h-4" />
              Halo, {currentUser.username}!
            </p>
          </div>
        </div>
        <button
          className="btn btn-outline flex items-center gap-2"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </header>

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Games Table */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Daftar Game
                </h2>
                <div className="text-sm text-gray-500">
                  Total: {pagination.totalItems} game
                </div>
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
                    {searchLoading
                      ? "Mencari..."
                      : "Mencari secara otomatis dalam 0.5 detik..."}
                  </div>
                )}
              </div>

              {/* Games Table */}
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="w-16">Gambar</th>
                      <th>Nama Game</th>
                      <th>Kategori</th>
                      <th>Ukuran</th>
                      <th className="w-32">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-8 text-gray-500"
                        >
                          Memuat data...
                        </td>
                      </tr>
                    ) : games.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-8 text-gray-500"
                        >
                          Tidak ada game yang ditemukan
                        </td>
                      </tr>
                    ) : (
                      games
                        .filter(
                          (game) =>
                            !cart.find((cartItem) => cartItem.id === game.id)
                        )
                        .map((game) => (
                          <tr key={game.id} className="hover:bg-gray-50">
                            <td>
                              <img
                                src={game.image_url}
                                alt={game.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            </td>
                            <td>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {game.name}
                                </p>
                              </div>
                            </td>
                            <td>
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                <span>{getCategoryIcon(game.category)}</span>
                                {game.category}
                              </span>
                            </td>
                            <td>
                              <span className="text-sm text-gray-600">
                                {game.size_gb} GB
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-primary py-2 px-3 text-xs flex items-center gap-1"
                                onClick={() => addToCart(game)}
                              >
                                <Plus className="w-3 h-3" />
                                Tambah
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
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    Menampilkan{" "}
                    {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
                    -{" "}
                    {Math.min(
                      pagination.currentPage * pagination.itemsPerPage,
                      pagination.totalItems
                    )}{" "}
                    dari {pagination.totalItems} game
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
                      Halaman {pagination.currentPage} dari{" "}
                      {pagination.totalPages}
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

          {/* Cart and Order */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Keranjang
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Keranjang masih kosong</p>
              </div>
            ) : (
              <>
                <div className="mb-4 space-y-2">
                  {cart.map((game) => (
                    <div
                      key={game.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={game.image_url}
                          alt={game.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {game.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {game.size_gb} GB
                          </p>
                        </div>
                      </div>
                      <button
                        className="btn btn-danger p-1 text-xs"
                        onClick={() => removeFromCart(game.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="font-semibold text-gray-900 text-sm">
                    Total: {getTotalSize().toFixed(1)} GB
                  </p>
                </div>
              </>
            )}

            <h3 className="text-lg font-semibold mb-3 text-gray-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Pilih Flashdisk
            </h3>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {flashdisks.map((flashdisk) => (
                <div
                  key={flashdisk.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedFlashdisk?.id === flashdisk.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleFlashdiskSelect(flashdisk)}
                >
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {flashdisk.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {flashdisk.capacity_gb} GB
                      </p>
                      <p className="text-xs text-gray-500">
                        Rp {flashdisk.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              onClick={handleCreateOrder}
              disabled={cart.length === 0 || !selectedFlashdisk}
            >
              <Package className="w-4 h-4" />
              Buat Pesanan
            </button>
          </div>
        </div>
      </div>

      {/* User Info Modal */}
      {showUserInfoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informasi Pengguna
              </h2>
              <button
                className="text-2xl text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowUserInfoModal(false)}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOrder();
              }}
            >
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-input"
                  value={userInfo.user_name}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, user_name: e.target.value })
                  }
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Lengkap</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={userInfo.user_address}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, user_address: e.target.value })
                  }
                  placeholder="Masukkan alamat lengkap"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => setShowUserInfoModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Buat Pesanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Pesanan Berhasil Dibuat!
              </h2>
              <button
                className="text-2xl text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={closeOrderModal}
              >
                ×
              </button>
            </div>

            <div>
              <p className="mb-4 text-gray-700">
                Screenshot halaman ini dan kirim ke admin:
              </p>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="mb-2">
                  <strong>ID Transaksi:</strong> {transactionId}
                </p>
                <p className="mb-2">
                  <strong>Nama:</strong> {orderData.user_name}
                </p>
                <p className="mb-2">
                  <strong>Alamat:</strong> {orderData.user_address}
                </p>
                <p className="mb-2">
                  <strong>Flashdisk:</strong> {orderData.flashdisk?.name} (
                  {orderData.flashdisk?.capacity_gb} GB)
                </p>
                <p className="mb-2">
                  <strong>Total Size:</strong> {orderData.totalSize.toFixed(1)}{" "}
                  GB
                </p>
                <p className="mb-2">
                  <strong>Total Harga:</strong> Rp{" "}
                  {orderData.totalPrice.toLocaleString()}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-gray-900">
                  Game yang Dipilih:
                </h4>
                <ul className="space-y-2">
                  {orderData.games.map((game) => (
                    <li
                      key={game.id}
                      className="py-2 border-b border-gray-200 last:border-b-0"
                    >
                      {game.name} - {game.size_gb} GB
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <button className="btn btn-primary" onClick={closeOrderModal}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Floating Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* WhatsApp Button */}
        <a
          href="https://wa.me/62882007903929"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          title="Hubungi kami via WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      </div>

      <div className="gap-3 fixed bottom-24 right-6 z-50">
        {/* Toko Admin Button */}
        <a
          href="https://s.shopee.co.id/2B43wqJZ1E"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          title="Kunjungi Toko Admin di Shopee"
        >
          <Store className="w-6 h-6" />
          Shopee
        </a>
      </div>
    </div>
  );
};

UserDashboard.propTypes = {
  currentUser: PropTypes.shape({
    username: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default UserDashboard;
