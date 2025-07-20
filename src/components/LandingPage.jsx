import { Link } from 'react-router-dom';
import { Shield, User } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Game Request System</h1>
          <p className="text-gray-600">Pilih tipe login untuk melanjutkan</p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/admin/login"
            className="block w-full p-4 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all flex items-center gap-3"
          >
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Admin Login</h3>
              <p className="text-sm text-gray-600">Akses panel administrator</p>
            </div>
          </Link>
          
          <Link
            to="/user/login"
            className="block w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center gap-3"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">User Login</h3>
              <p className="text-sm text-gray-600">Akses dashboard user</p>
            </div>
          </Link>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Pilih tipe login sesuai kebutuhan Anda</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 