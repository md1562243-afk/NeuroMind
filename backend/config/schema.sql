-- NeuroMind Complete Database Schema
-- Run this file in MySQL Workbench to set up the database

-- Create and select database
CREATE DATABASE IF NOT EXISTS neuromind_db;
USE neuromind_db;

-- Disable foreign key checks for clean setup
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables if they exist (clean slate)
DROP TABLE IF EXISTS story_answers;
DROP TABLE IF EXISTS story_results;
DROP TABLE IF EXISTS memory_game_results;
DROP TABLE IF EXISTS pattern_results;
DROP TABLE IF EXISTS reaction_results;
DROP TABLE IF EXISTS gonogo_results;
DROP TABLE IF EXISTS stroop_results;
DROP TABLE IF EXISTS sequence_results;
DROP TABLE IF EXISTS visual_search_results;
DROP TABLE IF EXISTS cpt_results;
DROP TABLE IF EXISTS adhd_reports;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS login_otps;
DROP TABLE IF EXISTS registration_otps;
DROP TABLE IF EXISTS psychiatrists;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- USERS
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- REGISTRATION OTPs
CREATE TABLE registration_otps (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  attempts INT DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LOGIN OTPs
CREATE TABLE login_otps (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  attempts INT DEFAULT 0,
  last_resend_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ASSESSMENTS (all test scores go here)
CREATE TABLE assessments (
  assessment_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  assessment_type VARCHAR(50) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) DEFAULT 100,
  completion_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- STORY RESULTS
CREATE TABLE story_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  attempt_no INT DEFAULT 1,
  score INT NOT NULL,
  level VARCHAR(30),
  completion_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- STORY ANSWERS
CREATE TABLE story_answers (
  answer_id INT AUTO_INCREMENT PRIMARY KEY,
  result_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_answer VARCHAR(255),
  correct_answer VARCHAR(255),
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent INT,
  FOREIGN KEY (result_id) REFERENCES story_results(result_id) ON DELETE CASCADE
);

-- MEMORY GAME RESULTS
CREATE TABLE memory_game_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  score INT NOT NULL,
  max_level_reached INT DEFAULT 1,
  completion_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- PATTERN RESULTS
CREATE TABLE pattern_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  score INT NOT NULL,
  pattern_used TEXT,
  total_questions INT DEFAULT 10,
  correct_answers INT DEFAULT 0,
  completion_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ADHD REPORTS
CREATE TABLE adhd_reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  final_score DECIMAL(5,2) NOT NULL,
  risk_level ENUM('Stable', 'Average', 'High Risk') NOT NULL,
  story_score DECIMAL(5,2),
  memory_score DECIMAL(5,2),
  pattern_score DECIMAL(5,2),
  reaction_score DECIMAL(5,2),
  gonogo_score DECIMAL(5,2),
  stroop_score DECIMAL(5,2),
  sequence_score DECIMAL(5,2),
  visual_search_score DECIMAL(5,2),
  cpt_score DECIMAL(5,2),
  psychiatrist_name VARCHAR(100),
  psychiatrist_phone VARCHAR(20),
  psychiatrist_email VARCHAR(150),
  clinic_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- REACTION RESULTS
CREATE TABLE reaction_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  avg_reaction_time DECIMAL(8,2),
  score INT NOT NULL,
  total_attempts INT DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- GO/NO-GO RESULTS
CREATE TABLE gonogo_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  correct_go INT DEFAULT 0,
  correct_nogo INT DEFAULT 0,
  false_alarms INT DEFAULT 0,
  misses INT DEFAULT 0,
  score INT NOT NULL,
  completion_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- STROOP RESULTS
CREATE TABLE stroop_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  correct_answers INT DEFAULT 0,
  total_questions INT DEFAULT 20,
  avg_response_time DECIMAL(8,2),
  score INT NOT NULL,
  completion_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- SEQUENCE RESULTS
CREATE TABLE sequence_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  max_sequence_length INT DEFAULT 0,
  score INT NOT NULL,
  completion_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- VISUAL SEARCH RESULTS
CREATE TABLE visual_search_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  correct_finds INT DEFAULT 0,
  total_targets INT DEFAULT 10,
  avg_search_time DECIMAL(8,2),
  score INT NOT NULL,
  completion_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- CPT RESULTS
CREATE TABLE cpt_results (
  result_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  hits INT DEFAULT 0,
  misses INT DEFAULT 0,
  false_alarms INT DEFAULT 0,
  hit_rate DECIMAL(5,2),
  score INT NOT NULL,
  completion_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- PSYCHIATRISTS
CREATE TABLE psychiatrists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  clinic_name VARCHAR(150),
  address TEXT,
  specialization VARCHAR(100) DEFAULT 'ADHD & Cognitive Disorders'
);

-- Sample psychiatrist data
INSERT INTO psychiatrists (name, phone, email, clinic_name, address) VALUES
('Dr. Farhan Ahmed', '+880-1711-234567', 'dr.farhan@neuroclinic.com.bd', 'NeuroMind Clinic Dhaka', 'House 12, Road 5, Dhanmondi, Dhaka-1205'),
('Dr. Sabrina Islam', '+880-1812-345678', 'dr.sabrina@mindhealth.com.bd', 'NeuroMind Mental Health Center', 'Plot 7, Block C, Banani, Dhaka-1213'),
('Dr. Karim Hossain', '+880-1913-456789', 'dr.karim@adhd-bd.com', 'NeuroMind Specialists BD', 'Level 3, Gulshan Avenue, Gulshan-1, Dhaka-1212');

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_adhd_reports_user ON adhd_reports(user_id);

SELECT 'NeuroMind database setup complete!' AS status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'neuromind_db' ORDER BY table_name;
