const { query, queryOne } = require('../utils/dbUtils');
const { generateDefaulterLetter } = require('../utils/pdfGenerator');
const AppError = require('../utils/appError');

exports.generateDefaulterLetters = async (req, res, next) => {
  try {
    const { month, year, threshold = 75 } = req.body;
    
    // Get students with attendance below threshold
    const defaulters = await query(`
      SELECT s.id, s.prn, s.name, sub.id as subject_id, sub.name as subject_name, sub.code as subject_code,
             a.attended_lectures, a.total_lectures,
             ROUND((a.attended_lectures / a.total_lectures) * 100, 2) as attendance_percentage
      FROM Attendance a
      JOIN Students s ON a.student_id = s.id
      JOIN Subjects sub ON a.subject_id = sub.id
      WHERE a.month = ? AND a.year = ? 
      HAVING attendance_percentage < ?
    `, [month, year, threshold]);
    
    if (defaulters.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No defaulters found for the given criteria'
      });
    }
    
    // Generate letters for each defaulter
    const generatedLetters = [];
    
    for (const defaulter of defaulters) {
      const filePath = await generateDefaulterLetter(
        { name: defaulter.name, prn: defaulter.prn },
        { name: defaulter.subject_name, code: defaulter.subject_code },
        month,
        year,
        defaulter.attendance_percentage
      );
      
      // Save to database
      await query(
        'INSERT INTO DefaulterLetters (student_id, subject_id, month, year, generated_by, file_path) VALUES (?, ?, ?, ?, ?, ?)',
        [defaulter.id, defaulter.subject_id, month, year, req.user.id, filePath]
      );
      
      generatedLetters.push({
        studentId: defaulter.id,
        studentName: defaulter.name,
        subject: defaulter.subject_name,
        attendancePercentage: defaulter.attendance_percentage,
        letterPath: filePath
      });
    }
    
    res.status(200).json({
      status: 'success',
      results: generatedLetters.length,
      data: {
        letters: generatedLetters
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getDefaulterLetters = async (req, res, next) => {
  try {
    const { studentId, subjectId, month, year } = req.query;
    
    let sql = `
      SELECT dl.*, s.name as student_name, s.prn, sub.name as subject_name, sub.code as subject_code,
             u.name as generated_by_name
      FROM DefaulterLetters dl
      JOIN Students s ON dl.student_id = s.id
      JOIN Subjects sub ON dl.subject_id = sub.id
      JOIN Users u ON dl.generated_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (studentId) {
      sql += ' AND dl.student_id = ?';
      params.push(studentId);
    }
    
    if (subjectId) {
      sql += ' AND dl.subject_id = ?';
      params.push(subjectId);
    }
    
    if (month) {
      sql += ' AND dl.month = ?';
      params.push(month);
    }
    
    if (year) {
      sql += ' AND dl.year = ?';
      params.push(year);
    }
    
    const letters = await query(sql, params);
    
    res.status(200).json({
      status: 'success',
      results: letters.length,
      data: {
        letters
      }
    });
  } catch (err) {
    next(err);
  }
};