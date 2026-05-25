export function getUser() {
  try {
    const raw = localStorage.getItem("userProfile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem("userToken");
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userProfile");
}

export function getDashboardPath(role) {
  switch (role) {
    case "Student":
      return "/dashboard/student";
    case "Teacher":
      return "/dashboard/teacher";
    case "Librarian":
      return "/dashboard/library";
    case "Admin":
    case "Staff":
    case "Parent":
    default:
      return "/dashboard/admin";
  }
}

export function getRoleHomePath(role) {
  return getDashboardPath(role);
}
