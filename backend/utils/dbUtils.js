const pool = require('../config/db');

// Helper function for executing queries
exports.query = async (sql, params) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Helper function for executing a single row query
exports.queryOne = async (sql, params) => {
  const [rows] = await pool.query(sql, params);
  return rows[0];
};