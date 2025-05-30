const { query, queryOne } = require('../utils/dbUtils');
const AppError = require('../utils/appError');

exports.getAllBatches = async (req, res, next) => {
  try {
    const batches = await query(`
      SELECT b.*, d.division_name, ay.year_name
      FROM Batches b
      JOIN Divisions d ON b.division_id = d.id
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      ORDER BY ay.year_name, d.division_name, b.batch_name
    `);
    
    res.status(200).json({
      status: 'success',
      results: batches.length,
      data: {
        batches
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getBatch = async (req, res, next) => {
  try {
    const batch = await queryOne(`
      SELECT b.*, d.division_name, ay.year_name
      FROM Batches b
      JOIN Divisions d ON b.division_id = d.id
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE b.id = ?
    `, [req.params.id]);
    
    if (!batch) {
      return next(new AppError('No batch found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        batch
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createBatch = async (req, res, next) => {
  try {
    const { division_id, batch_name } = req.body;
    
    // Validate input
    if (!division_id || !batch_name) {
      return next(new AppError('Please provide division ID and batch name', 400));
    }
    
    // Check if division exists
    const division = await queryOne('SELECT id FROM Divisions WHERE id = ?', [division_id]);
    if (!division) {
      return next(new AppError('No division found with that ID', 404));
    }
    
    // Check if batch already exists in this division
    const existingBatch = await queryOne(
      'SELECT id FROM Batches WHERE division_id = ? AND batch_name = ?',
      [division_id, batch_name]
    );
    if (existingBatch) {
      return next(new AppError('Batch already exists in this division', 400));
    }
    
    const result = await query(
      'INSERT INTO Batches (division_id, batch_name) VALUES (?, ?)',
      [division_id, batch_name]
    );
    
    const newBatch = await queryOne(`
      SELECT b.*, d.division_name, ay.year_name
      FROM Batches b
      JOIN Divisions d ON b.division_id = d.id
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE b.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      status: 'success',
      data: {
        batch: newBatch
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateBatch = async (req, res, next) => {
  try {
    const { division_id, batch_name } = req.body;
    
    // Check if batch exists
    const existingBatch = await queryOne('SELECT * FROM Batches WHERE id = ?', [req.params.id]);
    if (!existingBatch) {
      return next(new AppError('No batch found with that ID', 404));
    }
    
    // Check if division exists if provided
    if (division_id) {
      const division = await queryOne('SELECT id FROM Divisions WHERE id = ?', [division_id]);
      if (!division) {
        return next(new AppError('No division found with that ID', 404));
      }
    }
    
    // Check if batch name is being changed to one that already exists in the same division
    if (batch_name) {
      const batchWithName = await queryOne(
        `SELECT id FROM Batches 
         WHERE division_id = ? AND batch_name = ? AND id != ?`,
        [division_id || existingBatch.division_id, 
         batch_name, 
         req.params.id]
      );
      if (batchWithName) {
        return next(new AppError('Batch with this name already exists in the division', 400));
      }
    }
    
    await query(
      `UPDATE Batches 
       SET division_id = ?, batch_name = ? 
       WHERE id = ?`,
      [
        division_id || existingBatch.division_id,
        batch_name || existingBatch.batch_name,
        req.params.id
      ]
    );
    
    const updatedBatch = await queryOne(`
      SELECT b.*, d.division_name, ay.year_name
      FROM Batches b
      JOIN Divisions d ON b.division_id = d.id
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE b.id = ?
    `, [req.params.id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        batch: updatedBatch
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteBatch = async (req, res, next) => {
  try {
    // Check if batch has students
    const students = await query('SELECT id FROM Students WHERE batch_id = ? LIMIT 1', [req.params.id]);
    if (students.length > 0) {
      return next(new AppError('Cannot delete batch with existing students', 400));
    }
    
    const result = await query('DELETE FROM Batches WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return next(new AppError('No batch found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getBatchesByDivision = async (req, res, next) => {
  try {
    const batches = await query(`
      SELECT b.*, d.division_name, ay.year_name
      FROM Batches b
      JOIN Divisions d ON b.division_id = d.id
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE b.division_id = ?
      ORDER BY b.batch_name
    `, [req.params.divisionId]);
    
    res.status(200).json({
      status: 'success',
      results: batches.length,
      data: {
        batches
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getBatchStudents = async (req, res, next) => {
  try {
    const students = await query(`
      SELECT s.*, b.batch_name, d.division_name, ay.year_name
      FROM Students s
      JOIN Batches b ON s.batch_id = b.id
      JOIN Divisions d ON b.division_id = d.id
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE s.batch_id = ?
      ORDER BY s.name
    `, [req.params.batchId]);
    
    res.status(200).json({
      status: 'success',
      results: students.length,
      data: {
        students
      }
    });
  } catch (err) {
    next(err);
  }
};