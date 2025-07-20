import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminLogin from './components/AdminLogin';
import UserLogin from './components/UserLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminGames from './components/admin/AdminGames';
import AdminFlashdisks from './components/admin/AdminFlashdisks';
import AdminTransactions from './components/admin/AdminTransactions';
import UserDashboard from './components/UserDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Validate that the parsed user has the expected structure
        if (parsedUser && typeof parsedUser === 'object' && parsedUser.role) {
          setCurrentUser(parsedUser);
          setToken(savedToken);
        } else {
          throw new Error('Invalid user data structure');
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Clear invalid data from localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = (user, authToken) => {
    setCurrentUser(user);
    setToken(authToken);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', authToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes - accessible when not logged in */}
          {!currentUser || !token ? (
            <>
              <Route path="/" element={<UserLogin onLogin={handleLogin} />} />
              <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
              <Route path="/user/login" element={<UserLogin onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            /* Protected routes - accessible when logged in */
            <>
              {currentUser.role === 'admin' ? (
                <>
                  <Route path="/admin" element={<AdminLayout currentUser={currentUser} onLogout={handleLogout} />}>
                    <Route index element={<Navigate to="/admin/games" replace />} />
                    <Route path="games" element={<AdminGames />} />
                    <Route path="flashdisks" element={<AdminFlashdisks />} />
                    <Route path="transactions" element={<AdminTransactions />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </>
              ) : (
                <>
                  <Route path="/user" element={<UserDashboard currentUser={currentUser} onLogout={handleLogout} />} />
                  <Route path="*" element={<Navigate to="/user" replace />} />
                </>
              )}
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;