-- Add dynamic game categories and play platform support
USE game_request_db;

CREATE TABLE IF NOT EXISTS game_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO game_categories (name) VALUES
('PSP'),
('PS 1'),
('PS 2'),
('PS 2 RIP Version'),
('PS 2 MOD');

ALTER TABLE games
  MODIFY COLUMN category TEXT NOT NULL;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS user_address TEXT AFTER user_name;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS play_on_platform VARCHAR(50) AFTER total_size_gb;
