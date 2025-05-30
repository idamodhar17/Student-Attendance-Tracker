const app = require('./app');
const pool = require('./config/db');

const port = process.env.PORT || 5000;

// Test database connection and start server
pool.getConnection()
  .then(connection => {
    console.log('Database connected');
    connection.release();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });