// config/database.js
// This file sets up the MySQL database connection pool

const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'neuromind_db',
  waitForConnections: true,
  connectionLimit: 10,   // Max 10 simultaneous connections
  queueLimit: 0          // Unlimited queue
});

// Convert pool to use Promises (so we can use async/await)
const promisePool = pool.promise();

// Test the connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ MySQL Database connected successfully!');
    connection.release(); // Release connection back to pool
  }
});

module.exports = promisePool;