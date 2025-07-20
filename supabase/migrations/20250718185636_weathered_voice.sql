-- Database schema untuk aplikasi game request
-- Buat database baru
CREATE DATABASE IF NOT EXISTS game_request_db;
USE game_request_db;

-- Tabel untuk menyimpan data user/admin
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan data game
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    size_gb DECIMAL(5,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan data flashdisk
CREATE TABLE IF NOT EXISTS flashdisks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity_gb DECIMAL(5,2) NOT NULL,
    real_capacity_gb DECIMAL(5,2) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan data user/transaksi
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_address TEXT,
    flashdisk_id INT,
    total_size_gb DECIMAL(5,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flashdisk_id) REFERENCES flashdisks(id)
);

-- Tabel untuk menyimpan detail game dalam transaksi
CREATE TABLE IF NOT EXISTS transaction_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL,
    game_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Insert sample data untuk users (password: admin123)
INSERT INTO users (username, password, role) VALUES
('admin', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'admin'),
('user1', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'user'),
('user2', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'user');

-- Insert sample data untuk games
INSERT INTO games (name, category, image_url, size_gb, status) VALUES
('Grand Theft Auto V', 'Action', 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=500', 95.0, 'available'),
('Red Dead Redemption 2', 'Action', 'https://images.pexels.com/photos/1174746/pexels-photo-1174746.jpeg?auto=compress&cs=tinysrgb&w=500', 120.0, 'available'),
('Cyberpunk 2077', 'RPG', 'https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=500', 70.0, 'available'),
('The Witcher 3', 'RPG', 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=500', 50.0, 'available'),
('FIFA 24', 'Sports', 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=500', 35.0, 'available'),
('Call of Duty: Modern Warfare', 'FPS', 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=500', 85.0, 'available');

-- Insert sample data untuk flashdisks dengan real capacity
INSERT INTO flashdisks (name, capacity_gb, real_capacity_gb, price, is_active) VALUES
('Flashdisk 8GB', 8.0, 7.4, 25000, TRUE),
('Flashdisk 16GB', 16.0, 14.8, 35000, TRUE),
('Flashdisk 32GB', 32.0, 29.8, 55000, TRUE),
('Flashdisk 64GB', 64.0, 59.6, 85000, TRUE),
('Flashdisk 128GB', 128.0, 119.2, 150000, TRUE),
('Flashdisk 256GB', 256.0, 238.4, 275000, TRUE);