const { query, queryOne } = require('../utils/dbUtils');
const AppError = require('../utils/appError');

exports.getAllStudents = async (req, res, next) => {
  try {
    let sql = `
      SELECT s.*, b.batch_name, d.division_name, ay.year_name
      FROM Students s
      LEFT JOIN Batches b ON s.batch_id = b.id
      LEFT JOIN Divisions d ON b.division_id = d.id
      LEFT JOIN AcademicYears ay ON d.academic_year_id = ay.id
    `;
    
    const params = [];
    
    // Filter by batch if provided
    if (req.query.batch_id) {
      sql += ' WHERE s.batch_id = ?';
      params.push(req.query.batch_id);
    }
    
    const students = await query(sql, params);
    
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

exports.getStudent = async (req, res, next) => {
  try {
    const student = await queryOne(`
      SELECT s.*, b.batch_name, d.division_name, ay.year_name
      FROM Students s
      LEFT JOIN Batches b ON s.batch_id = b.id
      LEFT JOIN Divisions d ON b.division_id = d.id
      LEFT JOIN AcademicYears ay ON d.academic_year_id = ay.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (!student) {
      return next(new AppError('No student found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        student
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const { prn, name, email, roll_number, batch_id } = req.body;
    
    // Check if PRN already exists
    const existingStudent = await queryOne('SELECT id FROM Students WHERE prn = ?', [prn]);
    if (existingStudent) {
      return next(new AppError('PRN already in use', 400));
    }
    
    // Check if batch exists if provided
    if (batch_id) {
      const batch = await queryOne('SELECT id FROM Batches WHERE id = ?', [batch_id]);
      if (!batch) {
        return next(new AppError('No batch found with that ID', 404));
      }
    }
    
    const result = await query(
      'INSERT INTO Students (prn, name, email, roll_number, batch_id) VALUES (?, ?, ?, ?, ?)',
      [prn, name, email, roll_number, batch_id || null]
    );
    
    const newStudent = await queryOne('SELECT * FROM Students WHERE id = ?', [result.insertId]);

    res.status(201).json({
      status: 'success',
      data: {
        student: newStudent
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const { prn, name, email, roll_number, batch_id } = req.body;
    
    // Check if student exists
    const existingStudent = await queryOne('SELECT id FROM Students WHERE id = ?', [req.params.id]);
    if (!existingStudent) {
      return next(new AppError('No student found with that ID', 404));
    }
    
    // Check if PRN is being changed to one that already exists
    if (prn) {
      const studentWithPRN = await queryOne(
        'SELECT id FROM Students WHERE prn = ? AND id != ?',
        [prn, req.params.id]
      );
      if (studentWithPRN) {
        return next(new AppError('PRN already in use', 400));
      }
    }
    
    // Check if batch exists if provided
    if (batch_id) {
      const batch = await queryOne('SELECT id FROM Batches WHERE id = ?', [batch_id]);
      if (!batch) {
        return next(new AppError('No batch found with that ID', 404));
      }
    }
    
    await query(
      'UPDATE Students SET prn = ?, name = ?, email = ?, roll_number = ?, batch_id = ? WHERE id = ?',
      [prn, name, email, roll_number, batch_id || null, req.params.id]
    );
    
    const updatedStudent = await queryOne('SELECT * FROM Students WHERE id = ?', [req.params.id]);

    res.status(200).json({
      status: 'success',
      data: {
        student: updatedStudent
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    // Check if student has any attendance records
    const attendanceRecords = await query(
      'SELECT id FROM Attendance WHERE student_id = ? LIMIT 1',
      [req.params.id]
    );
    
    if (attendanceRecords.length > 0) {
      return next(new AppError('Cannot delete student with attendance records', 400));
    }
    
    const result = await query('DELETE FROM Students WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return next(new AppError('No student found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getStudentAttendance = async (req, res, next) => {
  try {
    const attendance = await query(`
      SELECT a.*, s.name as subject_name, s.code as subject_code
      FROM Attendance a
      JOIN Subjects s ON a.subject_id = s.id
      WHERE a.student_id = ?
    `, [req.params.studentId]);
    
    res.status(200).json({
      status: 'success',
      results: attendance.length,
      data: {
        attendance
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.assignBatchToStudents = async (req, res, next) => {
  try {
    const { student_ids, batch_id } = req.body;
    
    // Check if batch exists
    const batch = await queryOne('SELECT id FROM Batches WHERE id = ?', [batch_id]);
    if (!batch) {
      return next(new AppError('No batch found with that ID', 404));
    }
    
    // Validate all students exist
    for (const student_id of student_ids) {
      const student = await queryOne('SELECT id FROM Students WHERE id = ?', [student_id]);
      if (!student) {
        return next(new AppError(`No student found with ID ${student_id}`, 404));
      }
    }
    
    // Update students' batch
    const updatedStudents = [];
    for (const student_id of student_ids) {
      await query(
        'UPDATE Students SET batch_id = ? WHERE id = ?',
        [batch_id, student_id]
      );
      const updatedStudent = await queryOne('SELECT * FROM Students WHERE id = ?', [student_id]);
      updatedStudents.push(updatedStudent);
    }
    
    res.status(200).json({
      status: 'success',
      results: updatedStudents.length,
      data: {
        students: updatedStudents
      }
    });
  } catch (err) {
    next(err);
  }
};