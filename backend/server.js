import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import process from 'process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'game_request_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Authentication Controllers
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;
    
    // Check if username already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// User Management Controllers
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, username, role, is_active, created_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let params = [];
    let countParams = [];
    
    // Add search filter
    if (search) {
      query += ' AND username LIKE ?';
      countQuery += ' AND username LIKE ?';
      const searchParam = `%${search}%`;
      params.push(searchParam);
      countParams.push(searchParam);
    }
    
    // Add role filter
    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
      countParams.push(role);
    }
    
    // Add ordering and pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // Execute both queries
    const [users] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.execute(
      'SELECT id, username, role, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Validate role
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or user' });
    }
    
    // Check if username already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    
    res.status(201).json({ 
      message: 'User created successfully', 
      userId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, is_active } = req.body;
    
    // Validate role if provided
    if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or user' });
    }
    
    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent admin from deactivating themselves
    if (req.user.id == id && is_active === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    // Check if username already exists for other users
    if (username) {
      const [duplicateUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );
      
      if (duplicateUsers.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }
    
    // Build update query dynamically
    let updateFields = [];
    let updateParams = [];
    
    if (username) {
      updateFields.push('username = ?');
      updateParams.push(username);
    }
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateParams.push(hashedPassword);
    }
    
    if (role) {
      updateFields.push('role = ?');
      updateParams.push(role);
    }
    
    if (typeof is_active !== 'undefined') {
      updateFields.push('is_active = ?');
      updateParams.push(is_active);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateParams.push(id);
    
    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user.id == id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Soft delete by setting is_active to false
    await pool.execute(
      'UPDATE users SET is_active = FALSE WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const permanentDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user.id == id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Permanently delete the user
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'User permanently deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Game Controllers
const getAllGames = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM games WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM games WHERE 1=1';
    let params = [];
    let countParams = [];
    
    // Add search filter
    if (search) {
      query += ' AND (name LIKE ? OR category LIKE ?)';
      countQuery += ' AND (name LIKE ? OR category LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }
    
    // Add status filter
    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }
    
    // Add ordering and pagination
    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // Execute both queries
    const [games] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      games,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createGame = async (req, res) => {
  try {
    const { name, category, image_url, size_gb, status } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO games (name, category, image_url, size_gb, status) VALUES (?, ?, ?, ?, ?)',
      [name, category, image_url, size_gb, status || 'available']
    );
    
    res.status(201).json({ 
      message: 'Game created successfully', 
      gameId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, image_url, size_gb, status } = req.body;
    
    await pool.execute(
      'UPDATE games SET name = ?, category = ?, image_url = ?, size_gb = ?, status = ? WHERE id = ?',
      [name, category, image_url, size_gb, status, id]
    );
    
    res.json({ message: 'Game updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM games WHERE id = ?', [id]);
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Flashdisk Controllers
const getAllFlashdisks = async (req, res) => {
  try {
    const [flashdisks] = await pool.execute('SELECT * FROM flashdisks WHERE is_active = TRUE ORDER BY capacity_gb');
    res.json(flashdisks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createFlashdisk = async (req, res) => {
  try {
    const { name, capacity_gb, real_capacity_gb, price } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO flashdisks (name, capacity_gb, real_capacity_gb, price) VALUES (?, ?, ?, ?)',
      [name, capacity_gb, real_capacity_gb, price || 0]
    );
    
    res.status(201).json({ 
      message: 'Flashdisk created successfully', 
      flashdiskId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateFlashdisk = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity_gb, real_capacity_gb, price, is_active } = req.body;
    
    // Build update query dynamically based on provided fields
    let updateFields = [];
    let updateParams = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(name);
    }
    
    if (capacity_gb !== undefined) {
      updateFields.push('capacity_gb = ?');
      updateParams.push(capacity_gb);
    }
    
    if (real_capacity_gb !== undefined) {
      updateFields.push('real_capacity_gb = ?');
      updateParams.push(real_capacity_gb);
    }
    
    if (price !== undefined) {
      updateFields.push('price = ?');
      updateParams.push(price);
    }
    
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateParams.push(is_active);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateParams.push(id);
    
    await pool.execute(
      `UPDATE flashdisks SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    res.json({ message: 'Flashdisk updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFlashdisk = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE flashdisks SET is_active = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Flashdisk deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Transaction Controllers
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        t.*, 
        f.name as flashdisk_name, 
        f.real_capacity_gb,
        GROUP_CONCAT(g.name SEPARATOR ', ') as game_names
      FROM transactions t
      LEFT JOIN flashdisks f ON t.flashdisk_id = f.id
      LEFT JOIN transaction_games tg ON t.transaction_id = tg.transaction_id
      LEFT JOIN games g ON tg.game_id = g.id
      WHERE 1=1
    `;
    
    let countQuery = `
      SELECT COUNT(DISTINCT t.transaction_id) as total
      FROM transactions t
      LEFT JOIN flashdisks f ON t.flashdisk_id = f.id
      LEFT JOIN transaction_games tg ON t.transaction_id = tg.transaction_id
      LEFT JOIN games g ON tg.game_id = g.id
      WHERE 1=1
    `;
    
    let params = [];
    let countParams = [];
    
    // Add search filter
    if (search) {
      query += ' AND (t.user_name LIKE ? OR t.transaction_id LIKE ? OR f.name LIKE ? OR g.name LIKE ?)';
      countQuery += ' AND (t.user_name LIKE ? OR t.transaction_id LIKE ? OR f.name LIKE ? OR g.name LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    // Add grouping and ordering
    query += ' GROUP BY t.transaction_id ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // Execute both queries
    const [transactions] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { user_name, user_address, flashdisk_id, games, total_size_gb } = req.body;
    
    // Check if total size exceeds real capacity
    const [flashdisks] = await pool.execute(
      'SELECT real_capacity_gb FROM flashdisks WHERE id = ?',
      [flashdisk_id]
    );
    
    if (flashdisks.length === 0) {
      return res.status(400).json({ error: 'Flashdisk not found' });
    }
    
    if (total_size_gb > flashdisks[0].real_capacity_gb) {
      return res.status(400).json({ 
        error: `Total size (${total_size_gb} GB) exceeds real capacity (${flashdisks[0].real_capacity_gb} GB)` 
      });
    }
    
    // Generate unique transaction ID
    const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert transaction
    await pool.execute(
      'INSERT INTO transactions (transaction_id, user_name, user_address, flashdisk_id, total_size_gb) VALUES (?, ?, ?, ?, ?)',
      [transaction_id, user_name, user_address, flashdisk_id, total_size_gb]
    );
    
    // Insert transaction games
    for (const game of games) {
      await pool.execute(
        'INSERT INTO transaction_games (transaction_id, game_id) VALUES (?, ?)',
        [transaction_id, game.id]
      );
    }
    
    res.status(201).json({ 
      message: 'Transaction created successfully', 
      transaction_id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const clearTransactions = async (req, res) => {
  try {
    await pool.execute('DELETE FROM transaction_games');
    await pool.execute('DELETE FROM transactions');
    res.json({ message: 'All transactions cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { transaction_id } = req.params;
    
    const [transactions] = await pool.execute(`
      SELECT 
        t.*, 
        f.name as flashdisk_name, 
        f.real_capacity_gb,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', g.id,
            'name', g.name,
            'category', g.category,
            'size_gb', g.size_gb,
            'image_url', g.image_url
          )
        ) as games
      FROM transactions t
      LEFT JOIN flashdisks f ON t.flashdisk_id = f.id
      LEFT JOIN transaction_games tg ON t.transaction_id = tg.transaction_id
      LEFT JOIN games g ON tg.game_id = g.id
      WHERE t.transaction_id = ?
      GROUP BY t.transaction_id
    `, [transaction_id]);
    
    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transactions[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Routes
// Authentication routes
app.post('/auth/login', login);
app.post('/auth/register', register);

// User Management routes
app.get('/users', authenticateToken, requireAdmin, getAllUsers);
app.post('/users', authenticateToken, requireAdmin, createUser);
app.get('/users/:id', authenticateToken, requireAdmin, getUserById);
app.put('/users/:id', authenticateToken, requireAdmin, updateUser);
app.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);
app.delete('/users/:id/permanent', authenticateToken, requireAdmin, permanentDeleteUser);

// Game routes
app.get('/games', getAllGames);
app.post('/games', authenticateToken, requireAdmin, createGame);
app.put('/games/:id', authenticateToken, requireAdmin, updateGame);
app.delete('/games/:id', authenticateToken, requireAdmin, deleteGame);

// Flashdisk routes
app.get('/flashdisks', getAllFlashdisks);
app.post('/flashdisks', authenticateToken, requireAdmin, createFlashdisk);
app.put('/flashdisks/:id', authenticateToken, requireAdmin, updateFlashdisk);
app.delete('/flashdisks/:id', authenticateToken, requireAdmin, deleteFlashdisk);

// Transaction routes
app.get('/transactions', authenticateToken, requireAdmin, getAllTransactions);
app.post('/transactions', createTransaction);
app.delete('/transactions/clear', authenticateToken, requireAdmin, clearTransactions);
app.get('/transactions/:transaction_id', getTransactionById);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Game Request API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});