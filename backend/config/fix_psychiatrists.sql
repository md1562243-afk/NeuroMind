-- Fix psychiatrists table
USE neuromind_db;

-- Drop and recreate psychiatrists table with correct columns
DROP TABLE IF EXISTS psychiatrists;

CREATE TABLE psychiatrists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  clinic_name VARCHAR(150),
  address TEXT,
  specialization VARCHAR(100) DEFAULT 'ADHD & Cognitive Disorders'
);

-- Insert sample psychiatrist data
INSERT INTO psychiatrists (name, phone, email, clinic_name, address) VALUES
('Dr. Farhan Ahmed', '+880-1711-234567', 'dr.farhan@neuroclinic.com.bd', 'NeuroMind Clinic Dhaka', 'House 12, Road 5, Dhanmondi, Dhaka-1205'),
('Dr. Nusrat Jahan', '+880-1812-345678', 'dr.nusrat@mindhealth.com.bd', 'Mind Health Center', 'Plot 7, Block C, Banani, Dhaka-1213'),
('Dr. Karim Hossain', '+880-1913-456789', 'dr.karim@adhd-bd.com', 'ADHD Specialists BD', 'Level 3, Gulshan Avenue, Gulshan-1, Dhaka-1212');

-- Also fix the indexes (drop first in case they already exist)
DROP INDEX IF EXISTS idx_users_email ON users;
DROP INDEX IF EXISTS idx_assessments_user ON assessments;
DROP INDEX IF EXISTS idx_assessments_type ON assessments;
DROP INDEX IF EXISTS idx_adhd_reports_user ON adhd_reports;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_adhd_reports_user ON adhd_reports(user_id);

SELECT 'Fix complete! psychiatrists table ready.' AS status;
SELECT * FROM psychiatrists;
