const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against XSS
// app.use(xss());

// Prevent parameter pollution
// app.use(hpp());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
app.get('/test', (req, res) => {
  res.send('Server is alive!');
});
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
// app.use('/api/v1/students', require('./routes/studentRoutes'));
app.use('/api/v1/subjects', require('./routes/subjectRoutes'));
app.use('/api/v1/academic-years', require('./routes/academicYearRoutes'));
app.use('/api/v1/batches', require('./routes/batchRoutes'));
app.use('/api/v1/divisions', require('./routes/divisionRoutes'));
// app.use('/api/v1/teachers', require('./routes/teacherRoutes'));
// app.use('/api/v1/attendance', require('./routes/attendanceRoutes'));
// app.use('/api/v1/defaulter-letters', require('./routes/defaulterLetterRoutes'));

// Error handling middleware
app.use(require('./middlewares/errorHandler'));

module.exports = app;