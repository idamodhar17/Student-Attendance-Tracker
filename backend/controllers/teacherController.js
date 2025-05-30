const { query, queryOne } = require('../utils/dbUtils');
const AppError = require('../utils/appError');

exports.getAllTeachers = async (req, res, next) => {
  try {
    const teachers = await query(`
      SELECT t.*, u.name, u.email, u.role 
      FROM Teachers t
      JOIN Users u ON t.user_id = u.id
    `);
    
    res.status(200).json({
      status: 'success',
      results: teachers.length,
      data: {
        teachers
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getTeacher = async (req, res, next) => {
  try {
    const teacher = await queryOne(`
      SELECT t.*, u.name, u.email, u.role 
      FROM Teachers t
      JOIN Users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (!teacher) {
      return next(new AppError('No teacher found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        teacher
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createTeacher = async (req, res, next) => {
  try {
    const { user_id, designation } = req.body;
    
    // Check if user exists and is a teacher
    const user = await queryOne('SELECT id, role FROM Users WHERE id = ?', [user_id]);
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }
    if (user.role !== 'teacher') {
      return next(new AppError('User must have teacher role', 400));
    }
    
    // Check if teacher already exists for this user
    const existingTeacher = await queryOne('SELECT id FROM Teachers WHERE user_id = ?', [user_id]);
    if (existingTeacher) {
      return next(new AppError('Teacher already exists for this user', 400));
    }
    
    const result = await query(
      'INSERT INTO Teachers (user_id, designation) VALUES (?, ?)',
      [user_id, designation]
    );
    
    const newTeacher = await queryOne(`
      SELECT t.*, u.name, u.email, u.role 
      FROM Teachers t
      JOIN Users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [result.insertId]);

    res.status(201).json({
      status: 'success',
      data: {
        teacher: newTeacher
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const { designation } = req.body;
    
    const result = await query(
      'UPDATE Teachers SET designation = ? WHERE id = ?',
      [designation, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return next(new AppError('No teacher found with that ID', 404));
    }
    
    const updatedTeacher = await queryOne(`
      SELECT t.*, u.name, u.email, u.role 
      FROM Teachers t
      JOIN Users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [req.params.id]);

    res.status(200).json({
      status: 'success',
      data: {
        teacher: updatedTeacher
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTeacher = async (req, res, next) => {
  try {
    // Check if teacher has any assigned subjects
    const assignedSubjects = await query(
      'SELECT id FROM TeacherBatchSubjects WHERE teacher_id = ? LIMIT 1',
      [req.params.id]
    );
    
    if (assignedSubjects.length > 0) {
      return next(new AppError('Cannot delete teacher with assigned subjects', 400));
    }
    
    const result = await query('DELETE FROM Teachers WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return next(new AppError('No teacher found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.assignSubjectsToTeacher = async (req, res, next) => {
  try {
    const { teacher_id, batch_id, subject_ids } = req.body;
    
    // Check if teacher exists
    const teacher = await queryOne('SELECT id FROM Teachers WHERE id = ?', [teacher_id]);
    if (!teacher) {
      return next(new AppError('No teacher found with that ID', 404));
    }
    
    // Check if batch exists
    const batch = await queryOne('SELECT id FROM Batches WHERE id = ?', [batch_id]);
    if (!batch) {
      return next(new AppError('No batch found with that ID', 404));
    }
    
    // Validate all subjects exist
    for (const subject_id of subject_ids) {
      const subject = await queryOne('SELECT id FROM Subjects WHERE id = ?', [subject_id]);
      if (!subject) {
        return next(new AppError(`No subject found with ID ${subject_id}`, 404));
      }
      
      // Check if assignment already exists
      const existingAssignment = await queryOne(
        'SELECT id FROM TeacherBatchSubjects WHERE teacher_id = ? AND batch_id = ? AND subject_id = ?',
        [teacher_id, batch_id, subject_id]
      );
      
      if (existingAssignment) {
        return next(new AppError(`Subject ${subject_id} already assigned to this teacher for the batch`, 400));
      }
    }
    
    // Create assignments
    const assignments = [];
    for (const subject_id of subject_ids) {
      const result = await query(
        'INSERT INTO TeacherBatchSubjects (teacher_id, batch_id, subject_id) VALUES (?, ?, ?)',
        [teacher_id, batch_id, subject_id]
      );
      assignments.push(result.insertId);
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        assignments
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getTeacherSubjects = async (req, res, next) => {
  try {
    const subjects = await query(`
      SELECT s.*, b.batch_name, d.division_name, ay.year_name
      FROM TeacherBatchSubjects tbs
      JOIN Subjects s ON tbs.subject_id = s.id
      JOIN Batches b ON tbs.batch_id = b.id
      JOIN Divisions d ON b.division_id = d.id
      JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE tbs.teacher_id = ?
    `, [req.params.teacherId]);
    
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