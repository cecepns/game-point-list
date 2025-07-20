import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'game_request_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    console.log('Connected to MySQL server');

    // Create database if not exists
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`Database ${dbConfig.database} created or already exists`);

    // Use the database
    await connection.query(`USE ${dbConfig.database}`);

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created or already exists');

    // Create games table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url TEXT,
        size_gb DECIMAL(5,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Games table created or already exists');

    // Create flashdisks table with real_capacity_gb
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS flashdisks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        capacity_gb DECIMAL(5,2) NOT NULL,
        real_capacity_gb DECIMAL(5,2) NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Flashdisks table created or already exists');

    // Check if real_capacity_gb column exists, if not add it
    try {
      await connection.execute('SELECT real_capacity_gb FROM flashdisks LIMIT 1');
      console.log('real_capacity_gb column already exists');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        await connection.execute('ALTER TABLE flashdisks ADD COLUMN real_capacity_gb DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER capacity_gb');
        console.log('Added real_capacity_gb column to flashdisks table');
      }
    }

    // Create transactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(50) UNIQUE NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        flashdisk_id INT,
        total_size_gb DECIMAL(5,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flashdisk_id) REFERENCES flashdisks(id)
      )
    `);
    console.log('Transactions table created or already exists');

    // Create transaction_games table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transaction_games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(50) NOT NULL,
        game_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id)
      )
    `);
    console.log('Transaction_games table created or already exists');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    // Insert sample users
    await connection.execute(`
      INSERT IGNORE INTO users (username, password, role) VALUES 
      ('admin', ?, 'admin'),
      ('user1', ?, 'user'),
      ('user2', ?, 'user')
    `, [adminPassword, userPassword, userPassword]);
    console.log('Sample users created');

    // Insert sample games
    await connection.execute(`
      INSERT IGNORE INTO games (name, category, image_url, size_gb, status) VALUES
      ('Grand Theft Auto V', 'Action', 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=500', 95.0, 'available'),
      ('Red Dead Redemption 2', 'Action', 'https://images.pexels.com/photos/1174746/pexels-photo-1174746.jpeg?auto=compress&cs=tinysrgb&w=500', 120.0, 'available'),
      ('Cyberpunk 2077', 'RPG', 'https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=500', 70.0, 'available'),
      ('The Witcher 3', 'RPG', 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=500', 50.0, 'available'),
      ('FIFA 24', 'Sports', 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=500', 35.0, 'available'),
      ('Call of Duty: Modern Warfare', 'FPS', 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=500', 85.0, 'available')
    `);
    console.log('Sample games created');

    // Insert sample flashdisks with real capacity
    await connection.execute(`
      INSERT IGNORE INTO flashdisks (name, capacity_gb, real_capacity_gb, price, is_active) VALUES
      ('Flashdisk 8GB', 8.0, 7.4, 25000, TRUE),
      ('Flashdisk 16GB', 16.0, 14.8, 35000, TRUE),
      ('Flashdisk 32GB', 32.0, 29.8, 55000, TRUE),
      ('Flashdisk 64GB', 64.0, 59.6, 85000, TRUE),
      ('Flashdisk 128GB', 128.0, 119.2, 150000, TRUE),
      ('Flashdisk 256GB', 256.0, 238.4, 275000, TRUE)
    `);
    console.log('Sample flashdisks created');

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin / admin123');
    console.log('User: user1 / user123');
    console.log('User: user2 / user123');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

setupDatabase(); 