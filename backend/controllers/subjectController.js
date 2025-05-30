const { query, queryOne } = require('../utils/dbUtils');
const AppError = require('../utils/appError');

exports.getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await query('SELECT * FROM Subjects');
    res.status(200).json({
      status: 'success',
      results: subjects.length,
      data: {
        subjects
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getSubject = async (req, res, next) => {
  try {
    const subject = await queryOne('SELECT * FROM Subjects WHERE id = ?', [req.params.id]);
    
    if (!subject) {
      return next(new AppError('No subject found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        subject
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createSubject = async (req, res, next) => {
  try {
    const { name, code, is_practical } = req.body;
    
    // Check if subject code already exists
    const existingSubject = await queryOne('SELECT id FROM Subjects WHERE code = ?', [code]);
    if (existingSubject) {
      return next(new AppError('Subject code already in use', 400));
    }
    
    const result = await query(
      'INSERT INTO Subjects (name, code, is_practical) VALUES (?, ?, ?)',
      [name, code, is_practical || false]
    );
    
    const newSubject = await queryOne('SELECT * FROM Subjects WHERE id = ?', [result.insertId]);

    res.status(201).json({
      status: 'success',
      data: {
        subject: newSubject
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const { name, code, is_practical } = req.body;
    
    // Check if subject exists
    const existingSubject = await queryOne('SELECT id FROM Subjects WHERE id = ?', [req.params.id]);
    if (!existingSubject) {
      return next(new AppError('No subject found with that ID', 404));
    }
    
    // Check if code is being changed to one that already exists
    if (code) {
      const subjectWithCode = await queryOne(
        'SELECT id FROM Subjects WHERE code = ? AND id != ?',
        [code, req.params.id]
      );
      if (subjectWithCode) {
        return next(new AppError('Subject code already in use', 400));
      }
    }
    
    await query(
      'UPDATE Subjects SET name = ?, code = ?, is_practical = ? WHERE id = ?',
      [name, code, is_practical, req.params.id]
    );
    
    const updatedSubject = await queryOne('SELECT * FROM Subjects WHERE id = ?', [req.params.id]);

    res.status(200).json({
      status: 'success',
      data: {
        subject: updatedSubject
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    // Check if subject is assigned to any class or teacher
    const classSubjects = await query(
      'SELECT id FROM ClassSubjects WHERE subject_id = ? LIMIT 1',
      [req.params.id]
    );
    
    const teacherSubjects = await query(
      'SELECT id FROM TeacherBatchSubjects WHERE subject_id = ? LIMIT 1',
      [req.params.id]
    );
    
    if (classSubjects.length > 0 || teacherSubjects.length > 0) {
      return next(new AppError('Cannot delete subject assigned to classes or teachers', 400));
    }
    
    const result = await query('DELETE FROM Subjects WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return next(new AppError('No subject found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getSubjectsByClass = async (req, res, next) => {
  try {
    const subjects = await query(`
      SELECT s.* FROM Subjects s
      JOIN ClassSubjects cs ON s.id = cs.subject_id
      WHERE cs.class_group_id = ?
    `, [req.params.classId]);
    
    res.status(200).json({
      status: 'success',
      results: subjects.length,
      data: {
        subjects
      }
    });
  } catch (err) {
    next(err);
  }
};