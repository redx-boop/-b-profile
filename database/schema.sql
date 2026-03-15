CREATE DATABASE IF NOT EXISTS camera_qr_auth;
USE camera_qr_auth;

CREATE TABLE IF NOT EXISTS users (
  user_id CHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  qr_token CHAR(36) NOT NULL,
  qr_image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
