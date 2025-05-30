const { query, queryOne } = require('../utils/dbUtils');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await query('SELECT id, name, email, role, created_at FROM Users');
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await queryOne('SELECT id, name, email, role, created_at FROM Users WHERE id = ?', [req.params.id]);
    
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // 1) Check if email already exists
    const existingUser = await queryOne('SELECT id FROM Users WHERE email = ?', [email]);
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
    
    // 2) Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 3) Create user
    const result = await query(
      'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    
    // 4) Get the newly created user (without password)
    const newUser = await queryOne(
      'SELECT id, name, email, role, created_at FROM Users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    const userId = req.params.id;

    // Fetch existing user
    const existingUser = await queryOne('SELECT * FROM Users WHERE id = ?', [userId]);
    if (!existingUser) {
      return next(new AppError('No user found with that ID', 404));
    }

    // Check if the new email is already in use by another user
    if (email && email !== existingUser.email) {
      const userWithEmail = await queryOne(
        'SELECT id FROM Users WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (userWithEmail) {
        return next(new AppError('Email already in use', 400));
      }
    }

    // Merge updates with existing data
    const updatedFields = {
      name: name !== undefined ? name : existingUser.name,
      email: email !== undefined ? email : existingUser.email,
      role: role !== undefined ? role : existingUser.role,
    };

    // Update user
    await query(
      'UPDATE Users SET name = ?, email = ?, role = ? WHERE id = ?',
      [updatedFields.name, updatedFields.email, updatedFields.role, userId]
    );

    // Fetch updated user
    const updatedUser = await queryOne(
      'SELECT id, name, email, role, created_at FROM Users WHERE id = ?',
      [userId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    next(err);
  }
};


exports.deleteUser = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM Users WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};