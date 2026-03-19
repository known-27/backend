const ExcelJS = require('exceljs');

/**
 * Generates an Excel workbook buffer from an array of registration records.
 * Columns match the actual ASICS registration form fields.
 * @param {Array} registrations - Array of registration documents
 * @returns {Promise<Buffer>}
 */
const generateExcel = async (registrations) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ASICS Registration System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Registrations', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // ─── Column Definitions ───────────────────────────────────────────────────
  sheet.columns = [
    { header: 'No.',                      key: 'no',                   width: 6  },
    { header: 'First Name',               key: 'firstName',            width: 18 },
    { header: 'Last Name',                key: 'lastName',             width: 18 },
    { header: 'Gender',                   key: 'gender',               width: 10 },
    { header: 'Date of Birth',            key: 'dob',                  width: 14 },
    { header: 'Phone No.',                key: 'phone',                width: 18 },
    { header: 'E-Mail ID',               key: 'email',                width: 30 },
    { header: 'Current Running Brand',    key: 'currentRunningBrand',  width: 22 },
    { header: 'Submitted At',             key: 'submittedAt',          width: 22 },
  ];

  // ─── Style Header Row ─────────────────────────────────────────────────────
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF005BAC' }, // ASICS brand blue
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FFBDBDBD' } },
      left:   { style: 'thin', color: { argb: 'FFBDBDBD' } },
      bottom: { style: 'thin', color: { argb: 'FFBDBDBD' } },
      right:  { style: 'thin', color: { argb: 'FFBDBDBD' } },
    };
  });
  headerRow.height = 24;

  // ─── Populate Data Rows ───────────────────────────────────────────────────
  registrations.forEach((reg, index) => {
    const row = sheet.addRow({
      no:                   index + 1,
      firstName:            reg.firstName            || '',
      lastName:             reg.lastName             || '',
      gender:               reg.gender               || '',
      dob:                  reg.dob                  || '',
      phone:                reg.phone                || '',
      email:                reg.email                || '',
      currentRunningBrand:  reg.currentRunningBrand  || '',
      submittedAt: reg.submittedAt
        ? new Date(reg.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : '',
    });

    const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFE8F0FB';
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFEEEEEE' } },
        left:   { style: 'thin', color: { argb: 'FFEEEEEE' } },
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        right:  { style: 'thin', color: { argb: 'FFEEEEEE' } },
      };
    });
    row.height = 20;
  });

  // ─── Auto-fit Column Widths ───────────────────────────────────────────────
  sheet.columns.forEach((col) => {
    let maxLen = col.header ? col.header.length : 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value ? String(cell.value) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(Math.max(maxLen + 4, 10), 60);
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = { generateExcel };
