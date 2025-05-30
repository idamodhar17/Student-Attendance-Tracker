const { query, queryOne } = require('../utils/dbUtils');
const AppError = require('../utils/appError');

exports.getAllDivisions = async (req, res, next) => {
  try {
    const divisions = await query(`
      SELECT d.*, ay.year_name 
      FROM Divisions d
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      ORDER BY ay.year_name, d.division_name
    `);
    
    res.status(200).json({
      status: 'success',
      results: divisions.length,
      data: {
        divisions
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getDivision = async (req, res, next) => {
  try {
    const division = await queryOne(`
      SELECT d.*, ay.year_name 
      FROM Divisions d
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE d.id = ?
    `, [req.params.id]);
    
    if (!division) {
      return next(new AppError('No division found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        division
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createDivision = async (req, res, next) => {
  try {
    const { academic_year_id, division_name } = req.body;
    
    // Validate input
    if (!academic_year_id || !division_name) {
      return next(new AppError('Please provide academic year ID and division name', 400));
    }
    
    // Check if academic year exists
    const year = await queryOne('SELECT id FROM AcademicYears WHERE id = ?', [academic_year_id]);
    if (!year) {
      return next(new AppError('No academic year found with that ID', 404));
    }
    
    // Check if division already exists in this year
    const existingDivision = await queryOne(
      'SELECT id FROM Divisions WHERE academic_year_id = ? AND division_name = ?',
      [academic_year_id, division_name]
    );
    if (existingDivision) {
      return next(new AppError('Division already exists in this academic year', 400));
    }
    
    const result = await query(
      'INSERT INTO Divisions (academic_year_id, division_name) VALUES (?, ?)',
      [academic_year_id, division_name]
    );
    
    const newDivision = await queryOne(`
      SELECT d.*, ay.year_name 
      FROM Divisions d
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE d.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      status: 'success',
      data: {
        division: newDivision
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateDivision = async (req, res, next) => {
  try {
    const { academic_year_id, division_name } = req.body;
    
    // Check if division exists
    const existingDivision = await queryOne('SELECT id FROM Divisions WHERE id = ?', [req.params.id]);
    if (!existingDivision) {
      return next(new AppError('No division found with that ID', 404));
    }
    
    // Check if academic year exists if provided
    if (academic_year_id) {
      const year = await queryOne('SELECT id FROM AcademicYears WHERE id = ?', [academic_year_id]);
      if (!year) {
        return next(new AppError('No academic year found with that ID', 404));
      }
    }
    
    // Check if division name is being changed to one that already exists in the same year
    if (division_name) {
      const divisionWithName = await queryOne(
        `SELECT id FROM Divisions 
         WHERE academic_year_id = ? AND division_name = ? AND id != ?`,
        [academic_year_id || existingDivision.academic_year_id, 
         division_name, 
         req.params.id]
      );
      if (divisionWithName) {
        return next(new AppError('Division with this name already exists in the academic year', 400));
      }
    }
    
    await query(
      `UPDATE Divisions 
       SET academic_year_id = ?, division_name = ? 
       WHERE id = ?`,
      [
        academic_year_id || existingDivision.academic_year_id,
        division_name || existingDivision.division_name,
        req.params.id
      ]
    );
    
    const updatedDivision = await queryOne(`
      SELECT d.*, ay.year_name 
      FROM Divisions d
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE d.id = ?
    `, [req.params.id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        division: updatedDivision
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteDivision = async (req, res, next) => {
  try {
    // Check if division has batches
    const batches = await query('SELECT id FROM Batches WHERE division_id = ? LIMIT 1', [req.params.id]);
    if (batches.length > 0) {
      return next(new AppError('Cannot delete division with existing batches', 400));
    }
    
    const result = await query('DELETE FROM Divisions WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return next(new AppError('No division found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getDivisionsByYear = async (req, res, next) => {
  try {
    const divisions = await query(`
      SELECT d.*, ay.year_name 
      FROM Divisions d
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE d.academic_year_id = ?
      ORDER BY d.division_name
    `, [req.params.yearId]);
    
    res.status(200).json({
      status: 'success',
      results: divisions.length,
      data: {
        divisions
      }
    });
  } catch (err) {
    next(err);
  }
};