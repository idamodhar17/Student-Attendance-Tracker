const { query, queryOne } = require('../utils/dbUtils');
const AppError = require('../utils/appError');

exports.getAttendance = async (req, res, next) => {
  try {
    const { studentId, subjectId, month, year } = req.query;
    
    let sql = 'SELECT * FROM Attendance WHERE 1=1';
    const params = [];
    
    if (studentId) {
      sql += ' AND student_id = ?';
      params.push(studentId);
    }
    
    if (subjectId) {
      sql += ' AND subject_id = ?';
      params.push(subjectId);
    }
    
    if (month) {
      sql += ' AND month = ?';
      params.push(month);
    }
    
    if (year) {
      sql += ' AND year = ?';
      params.push(year);
    }
    
    const attendance = await query(sql, params);
    
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

exports.createAttendance = async (req, res, next) => {
  try {
    const { student_id, subject_id, month, year, total_lectures, attended_lectures } = req.body;
    
    // Check if attendance record already exists
    const existingRecord = await queryOne(
      'SELECT * FROM Attendance WHERE student_id = ? AND subject_id = ? AND month = ? AND year = ?',
      [student_id, subject_id, month, year]
    );
    
    if (existingRecord) {
      return next(new AppError('Attendance record already exists for this student, subject, and month', 400));
    }
    
    // Create new attendance record
    const result = await query(
      'INSERT INTO Attendance (student_id, subject_id, month, year, total_lectures, attended_lectures) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, subject_id, month, year, total_lectures, attended_lectures]
    );
    
    const newAttendance = await queryOne(
      'SELECT * FROM Attendance WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        attendance: newAttendance
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAttendance = async (req, res, next) => {
  try {
    const { total_lectures, attended_lectures } = req.body;
    
    const result = await query(
      'UPDATE Attendance SET total_lectures = ?, attended_lectures = ? WHERE id = ?',
      [total_lectures, attended_lectures, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return next(new AppError('No attendance record found with that ID', 404));
    }
    
    const updatedAttendance = await queryOne(
      'SELECT * FROM Attendance WHERE id = ?',
      [req.params.id]
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        attendance: updatedAttendance
      }
    });
  } catch (err) {
    next(err);
  }
};