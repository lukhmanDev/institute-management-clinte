// Central API Utility for Frontend-Backend Integration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
import { getToken } from "./auth";

/** DRF may return { results: [] }; frontend expects a plain array. */
export function parseList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return data ?? [];
}

async function request(endpoint, options = {}, fallback = null) {
  const url = `${API_BASE_URL}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
  try {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      if (errBody && typeof errBody === "object" && !errBody.message) {
        const fieldErrors = Object.entries(errBody)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`)
          .join(" | ");
        if (fieldErrors) {
          throw new Error(fieldErrors);
        }
      }
      throw new Error(errBody.message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.warn(`API Error on ${endpoint}:`, error.message, "| Using local mock data fallback.");
    if (fallback !== null) return fallback;
    throw error;
  }
}

async function requestList(endpoint, options = {}, fallback = null) {
  const data = await request(endpoint, options, fallback);
  return parseList(data);
}

export const api = {
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to log in.");
      return data;
    } catch (error) {
      console.warn("API login failed, falling back to mock authentication:", error.message);
      const demoUsers = {
        "admin@eduhub.com": { name: "Administrator", role: "Admin" },
        "staff@eduhub.com": { name: "Office Staff", role: "Staff" },
        "teacher@eduhub.com": { name: "Sarah Miller", role: "Teacher" },
        "student@eduhub.com": { name: "Alice Johnson", role: "Student" },
        "library@eduhub.com": { name: "Emma Watson", role: "Librarian" },
      };
      const key = email?.toLowerCase();
      if (password === "password123" && demoUsers[key]) {
        return {
          success: true,
          token: `mock-auth-token-${key}`,
          user: { email: key, ...demoUsers[key] },
        };
      }
      throw new Error("Invalid credentials. Use a demo email with password123");
    }
  },

  async getDashboard(fallbackData) {
    return request("dashboard/", { method: "GET" }, fallbackData);
  },

  async getStudentDashboard(email, fallbackData) {
    const endpoint = email
      ? `dashboard/student/?email=${encodeURIComponent(email)}`
      : "dashboard/student/";
    return request(endpoint, { method: "GET" }, fallbackData);
  },

  async getTeacherDashboard(email, fallbackData) {
    const endpoint = email
      ? `dashboard/teacher/?email=${encodeURIComponent(email)}`
      : "dashboard/teacher/";
    return request(endpoint, { method: "GET" }, fallbackData);
  },

  async getLibraryDashboard(fallbackData) {
    return request("dashboard/library/", { method: "GET" }, fallbackData);
  },

  async getUsers(fallbackData) {
    return requestList("users/", { method: "GET" }, fallbackData);
  },

  async getReports(fallbackData) {
    return request("reports/", { method: "GET" }, fallbackData);
  },

  async getStudents(fallbackData) {
    return requestList("students/", { method: "GET" }, fallbackData);
  },

  async getStudent(id, fallbackData) {
    return request(`students/${id}/`, { method: "GET" }, fallbackData);
  },

  async addStudent(studentData, requesterRole = "Admin") {
    return request("students/", {
      method: "POST",
      body: JSON.stringify({ ...studentData, requester_role: requesterRole }),
    });
  },

  async bulkUploadStudents(students, requesterRole = "Admin", defaultPassword = "") {
    return request("students/bulk_upload/", {
      method: "POST",
      body: JSON.stringify({
        students,
        requester_role: requesterRole,
        default_password: defaultPassword || undefined,
      }),
    });
  },

  async clearAllStudents(requesterRole = "Admin") {
    return request("students/clear_all/", {
      method: "POST",
      body: JSON.stringify({ confirm: true, requester_role: requesterRole }),
    });
  },

  async updateStudent(id, studentData) {
    return request(`students/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(studentData),
    });
  },

  async deleteStudent(id, requesterRole = "Admin") {
    return request(`students/${id}/?role=${encodeURIComponent(requesterRole)}`, {
      method: "DELETE",
    });
  },

  async assignStudentAssociation(studentId, associationId, role = "Member") {
    return request(`students/${studentId}/assign-association/`, {
      method: "POST",
      body: JSON.stringify({ association_id: associationId, role }),
    });
  },

  async getTeachers(fallbackData) {
    return requestList("teachers/", { method: "GET" }, fallbackData);
  },

  async addTeacher(teacherData, requesterRole = "Admin") {
    return request("teachers/", {
      method: "POST",
      body: JSON.stringify({ ...teacherData, requester_role: requesterRole }),
    });
  },

  async deleteTeacher(id, requesterRole = "Admin") {
    return request(`teachers/${id}/?role=${encodeURIComponent(requesterRole)}`, {
      method: "DELETE",
    });
  },

  async bulkUploadTeachers(teachers, requesterRole = "Admin", defaultPassword = "") {
    return request("teachers/bulk_upload/", {
      method: "POST",
      body: JSON.stringify({
        teachers,
        requester_role: requesterRole,
        default_password: defaultPassword || undefined,
      }),
    });
  },

  async getClasses(fallbackData) {
    return requestList("classes/", { method: "GET" }, fallbackData);
  },

  async addClass(classData, requesterRole = "Admin") {
    return request("classes/", {
      method: "POST",
      body: JSON.stringify({ ...classData, requester_role: requesterRole }),
    });
  },

  async deleteClass(id, requesterRole = "Admin") {
    return request(`classes/${id}/?role=${encodeURIComponent(requesterRole)}`, {
      method: "DELETE",
    });
  },

  async updateClass(id, classData, requesterRole = "Admin") {
    return request(`classes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ ...classData, requester_role: requesterRole }),
    });
  },

  async getSubjects(fallbackData) {
    return requestList("subjects/", { method: "GET" }, fallbackData);
  },

  async addSubject(subjectData) {
    return request("subjects/", {
      method: "POST",
      body: JSON.stringify(subjectData),
    });
  },

  async deleteSubject(id) {
    return request(`subjects/${id}/`, {
      method: "DELETE",
    });
  },

  async bulkImportMarks(marksData) {
    return request("marks/bulk-import/", {
      method: "POST",
      body: JSON.stringify({ marks: marksData }),
    });
  },

  async getMarks(studentId, subjectId, fallbackData) {
    const params = new URLSearchParams();
    if (studentId) params.set("student_id", studentId);
    if (subjectId) params.set("subject_id", subjectId);
    const q = params.toString() ? `?${params}` : "";
    return requestList(`marks/${q}`, { method: "GET" }, fallbackData);
  },

  async deleteMark(id) {
    return request(`marks/${id}/`, {
      method: "DELETE",
    });
  },

  async getMyMarks(fallbackData) {
    return request("marks/my-marks/", { method: "GET" }, fallbackData);
  },

  async getFees(fallbackData) {
    return requestList("fees/", { method: "GET" }, fallbackData);
  },

  async addFeeRecord(feeData) {
    return request("fees/", {
      method: "POST",
      body: JSON.stringify(feeData),
    });
  },

  async bulkGenerateFees(payload) {
    return request("fees/bulk-generate/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async sendFeeReminder(id) {
    return request(`fees/${id}/remind/`, { method: "POST" });
  },

  async createFeeOrder(feeRecordId) {
    return request("fees/create-order/", {
      method: "POST",
      body: JSON.stringify({ fee_record_id: feeRecordId }),
    });
  },

  async verifyFeePayment(payload) {
    return request("fees/verify-payment/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getExams(fallbackData) {
    return requestList("exams/", { method: "GET" }, fallbackData);
  },

  async publishResults() {
    return request("exams/publish-results/", { method: "POST" });
  },

  async getRemarks(fallbackData) {
    return requestList("remarks/", { method: "GET" }, fallbackData);
  },

  async addRemark(remarkData) {
    return request("remarks/", {
      method: "POST",
      body: JSON.stringify(remarkData),
    });
  },

  async getNotifications(role, fallbackData) {
    const q = role ? `?role=${encodeURIComponent(role)}` : "";
    return requestList(`notifications/${q}`, { method: "GET" }, fallbackData);
  },

  async createNotification(payload) {
    return request("notifications/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async deleteNotification(id, role = "Admin") {
    return request(`notifications/${id}/?role=${encodeURIComponent(role)}`, {
      method: "DELETE",
    });
  },

  async getAssociationMembers(fallbackData) {
    return requestList("association/members/", { method: "GET" }, fallbackData);
  },

  async getAssociationEvents(fallbackData) {
    return requestList("association/events/", { method: "GET" }, fallbackData);
  },

  async getBooks(fallbackData) {
    return requestList("books/", { method: "GET" }, fallbackData);
  },

  async addBook(bookData) {
    return request("books/", {
      method: "POST",
      body: JSON.stringify(bookData),
    });
  },

  async bulkUploadBooks(books, requesterRole = "Librarian") {
    return request("books/bulk_upload/", {
      method: "POST",
      body: JSON.stringify({ books, requester_role: requesterRole }),
    });
  },

  async getBookLoans({ role, studentEmail, studentId, status } = {}, fallbackData) {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (studentEmail) params.set("student_email", studentEmail);
    if (studentId) params.set("student_id", studentId);
    if (status) params.set("status", status);
    const q = params.toString() ? `?${params}` : "";
    return requestList(`book-loans/${q}`, { method: "GET" }, fallbackData);
  },

  async issueBookLoan(payload) {
    return request("book-loans/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async returnBookLoan(id, payload = {}) {
    return request(`book-loans/${id}/return_book/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getAttendance(classroom, date, fallbackData) {
    const params = new URLSearchParams();
    if (classroom) params.set("classroom", classroom);
    if (date) params.set("date", date);
    const q = params.toString() ? `?${params}` : "";
    return requestList(`attendance/${q}`, { method: "GET" }, fallbackData);
  },

  async bulkSaveAttendance(payload) {
    return request("attendance/bulk_save/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateStudentPhoto(id, imageUrl) {
    return request(`students/${id}/update-photo/`, {
      method: "POST",
      body: JSON.stringify({ image_url: imageUrl }),
    });
  },

  async updateTeacherPhoto(id, imageUrl) {
    return request(`teachers/${id}/update-photo/`, {
      method: "POST",
      body: JSON.stringify({ image_url: imageUrl }),
    });
  },

  async addAssociationEvent(payload) {
    return request("association/events/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async deleteAssociationEvent(id, requesterRole = "Student") {
    return request(`association/events/${id}/?role=${encodeURIComponent(requesterRole)}`, {
      method: "DELETE",
    });
  },

  async getMeetingReports(fallbackData) {
    return requestList("association/reports/", { method: "GET" }, fallbackData);
  },

  async addMeetingReport(payload) {
    return request("association/reports/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async deleteMeetingReport(id, requesterRole = "Student") {
    return request(`association/reports/${id}/?role=${encodeURIComponent(requesterRole)}`, {
      method: "DELETE",
    });
  },
};

