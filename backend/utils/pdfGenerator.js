const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

exports.generateDefaulterLetter = async (student, subject, month, year, attendancePercentage) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([550, 750]);
  
  const { width, height } = page.getSize();
  
  // Add content to the PDF
  page.drawText('DEFUALTER NOTICE', {
    x: 50,
    y: height - 50,
    size: 20,
    color: rgb(0, 0, 0),
    bold: true
  });
  
  page.drawText(`Name: ${student.name}`, {
    x: 50,
    y: height - 100,
    size: 12,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(`PRN: ${student.prn}`, {
    x: 50,
    y: height - 120,
    size: 12,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(`Subject: ${subject.name} (${subject.code})`, {
    x: 50,
    y: height - 140,
    size: 12,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(`Month: ${month}/${year}`, {
    x: 50,
    y: height - 160,
    size: 12,
    color: rgb(0, 0, 0)
  });
  
  page.drawText(`Attendance Percentage: ${attendancePercentage}%`, {
    x: 50,
    y: height - 180,
    size: 12,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('This is to inform you that your attendance is below the required threshold.', {
    x: 50,
    y: height - 220,
    size: 12,
    color: rgb(0, 0, 0)
  });
  
  // Save the PDF to a file
  const pdfBytes = await pdfDoc.save();
  
  const fileName = `defaulter_${student.prn}_${subject.code}_${month}_${year}.pdf`;
  const filePath = path.join(__dirname, '../public/letters', fileName);
  
  fs.writeFileSync(filePath, pdfBytes);
  
  return `/letters/${fileName}`;
};