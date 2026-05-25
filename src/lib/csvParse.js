/** Parse simple CSV text into row objects using header keys. */
function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(c => {
    let cleaned = c;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    return cleaned.trim();
  });
}

export function parseCsv(text, columnMap = {}) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const idx = (name) => header.indexOf(name);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.every((c) => !c)) continue;

    const get = (key, alt) => {
      const aliases = columnMap[key] || [key];
      if (alt) aliases.push(alt);
      for (const alias of aliases) {
        const j = idx(alias);
        if (j >= 0 && cols[j] !== undefined) return cols[j];
      }
      return "";
    };

    rows.push({ get, cols, _rowIndex: i + 1 });
  }
  return rows;
}

export function parseStudentCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const idx = (name) => header.indexOf(name);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.every((c) => !c)) continue;
    const get = (key, alt) => {
      const j = idx(key);
      if (j >= 0 && cols[j] !== undefined) return cols[j];
      if (alt) {
        const k = idx(alt);
        if (k >= 0) return cols[k];
      }
      return "";
    };
    rows.push({
      student_id: get("student_id", "id"),
      name: get("name"),
      grade: get("grade", "class"),
      roll_no: get("roll_no"),
      email: get("email"),
      phone: get("phone"),
      parent_name: get("parent_name", "parent"),
      password: get("password"),
      status: get("status") || "Active",
    });
  }
  return rows;
}

export function parseTeacherCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const idx = (name) => header.indexOf(name);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.every((c) => !c)) continue;
    const get = (key, alt) => {
      const j = idx(key);
      if (j >= 0 && cols[j] !== undefined) return cols[j];
      if (alt) {
        const k = idx(alt);
        if (k >= 0) return cols[k];
      }
      return "";
    };
    rows.push({
      teacher_id: get("teacher_id", "id"),
      name: get("name"),
      subject: get("subject"),
      experience: get("experience", "exp"),
      qualification: get("qualification"),
      email: get("email"),
      phone: get("phone"),
      password: get("password"),
      status: get("status") || "Available",
    });
  }
  return rows;
}

export const STUDENT_CSV_TEMPLATE = `student_id,name,grade,roll_no,email,phone,parent_name,password,status
,John Doe,10-A,15,john.doe@eduhub.com,+1234567890,Jane Doe,,Active
,Emily Clark,9-B,8,,+1234567891,Robert Clark,password123,Active`;

export const TEACHER_CSV_TEMPLATE = `teacher_id,name,subject,experience,qualification,email,phone,password,status
,Jane Smith,Chemistry,5 years,MSc Chemistry,jane.smith@eduhub.com,+1555000101,,Available
,Mike Ross,Mathematics,8 years,MSc Math,,+1555000102,password123,Available`;

export function downloadCsvTemplate(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
