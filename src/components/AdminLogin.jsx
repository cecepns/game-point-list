import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

const AdminLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://api-inventory.isavralabel.com/api/game-point-list/auth/login', formData);
      
      if (response.data.user.role === 'admin') {
        onLogin(response.data.user, response.data.token);
      } else {
        setError('Access denied. Admin privileges required.');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-600 p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Admin Login</h1>
          <p className="text-gray-600">Masuk sebagai administrator</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <User className="w-4 h-4" />
              Username
            </label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="Masukkan username"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input pr-10"
                value={formData.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-3">
          <div className="text-sm text-gray-600">
            <p>Demo: admin / admin123</p>
          </div>
          
          <div className="border-t pt-4">
            <Link 
              to="/user/login"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Login sebagai User
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

AdminLogin.propTypes = {
  onLogin: PropTypes.func.isRequired
};

export default AdminLogin; 