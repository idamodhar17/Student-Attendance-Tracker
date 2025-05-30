const { query, queryOne } = require('../utils/dbUtils');
const AppError = require('../utils/appError');

exports.getAllAcademicYears = async (req, res, next) => {
  try {
    const years = await query('SELECT * FROM AcademicYears ORDER BY year_name');
    res.status(200).json({
      status: 'success',
      results: years.length,
      data: {
        years
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getAcademicYear = async (req, res, next) => {
  try {
    const year = await queryOne('SELECT * FROM AcademicYears WHERE id = ?', [req.params.id]);
    
    if (!year) {
      return next(new AppError('No academic year found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        year
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createAcademicYear = async (req, res, next) => {
  try {
    const { year_name } = req.body;
    
    // Validate input
    if (!year_name || year_name.length < 2) {
      return next(new AppError('Please provide a valid year name (e.g., FY, SY, TY)', 400));
    }
    
    // Check if year already exists
    const existingYear = await queryOne('SELECT id FROM AcademicYears WHERE year_name = ?', [year_name]);
    if (existingYear) {
      return next(new AppError('Academic year already exists', 400));
    }
    
    const result = await query('INSERT INTO AcademicYears (year_name) VALUES (?)', [year_name]);
    const newYear = await queryOne('SELECT * FROM AcademicYears WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      status: 'success',
      data: {
        year: newYear
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAcademicYear = async (req, res, next) => {
  try {
    const { year_name } = req.body;
    
    // Check if year exists
    const existingYear = await queryOne('SELECT id FROM AcademicYears WHERE id = ?', [req.params.id]);
    if (!existingYear) {
      return next(new AppError('No academic year found with that ID', 404));
    }
    
    // Check if new name already exists
    if (year_name) {
      const yearWithName = await queryOne(
        'SELECT id FROM AcademicYears WHERE year_name = ? AND id != ?',
        [year_name, req.params.id]
      );
      if (yearWithName) {
        return next(new AppError('Academic year with this name already exists', 400));
      }
    }
    
    await query('UPDATE AcademicYears SET year_name = ? WHERE id = ?', [year_name, req.params.id]);
    const updatedYear = await queryOne('SELECT * FROM AcademicYears WHERE id = ?', [req.params.id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        year: updatedYear
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteAcademicYear = async (req, res, next) => {
  try {
    // Check if year has divisions
    const divisions = await query('SELECT id FROM Divisions WHERE academic_year_id = ? LIMIT 1', [req.params.id]);
    if (divisions.length > 0) {
      return next(new AppError('Cannot delete academic year with existing divisions', 400));
    }
    
    const result = await query('DELETE FROM AcademicYears WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return next(new AppError('No academic year found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};