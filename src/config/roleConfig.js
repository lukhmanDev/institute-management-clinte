import {
  LayoutDashboard,
  Users,
  UserSquare2,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  MessageSquare,
  Users2,
  Bell,
  BarChart3,
  Settings,
  Library,
  ClipboardList,
  BookMarked,
  Plus,
  GraduationCap,
  UserCog,
} from "lucide-react";

const settingsNavItem = { icon: Settings, label: "Settings", path: "/settings" };

/** Shared admin/staff menu (no Settings). */
const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/admin" },
  { icon: UserCog, label: "Auth Users", path: "/users" },
  { icon: Users, label: "Students", path: "/students" },
  { icon: UserSquare2, label: "Teachers", path: "/teachers" },
  { icon: BookOpen, label: "Classes", path: "/classes" },
  { icon: BookMarked, label: "Subjects", path: "/subjects" },
  { icon: CalendarCheck, label: "Attendance", path: "/attendance" },
  { icon: CreditCard, label: "Fees Management", path: "/fees" },
  { icon: FileSpreadsheet, label: "Exams & Results", path: "/exams" },
  { icon: MessageSquare, label: "Student Remarks", path: "/remarks" },
  { icon: Users2, label: "Student Association", path: "/association" },
  { icon: Users2, label: "Council Directory", path: "/council" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

const studentNav = [
  { icon: LayoutDashboard, label: "My Dashboard", path: "/dashboard/student" },
  { icon: FileSpreadsheet, label: "Exams & Results", path: "/exams" },
  { icon: CreditCard, label: "My Fees", path: "/fees" },
  { icon: MessageSquare, label: "My Remarks", path: "/remarks" },
  { icon: BookMarked, label: "My Books", path: "/library" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Users2, label: "Council Directory", path: "/council" },
  { icon: Users2, label: "Association", path: "/association" },
];

const teacherNav = [
  { icon: LayoutDashboard, label: "My Dashboard", path: "/dashboard/teacher" },
  { icon: BookOpen, label: "My Classes", path: "/classes" },
  { icon: CalendarCheck, label: "Attendance", path: "/attendance" },
  { icon: FileSpreadsheet, label: "Exams & Results", path: "/exams" },
  { icon: MessageSquare, label: "Student Remarks", path: "/remarks" },
  { icon: Users, label: "Students", path: "/students" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
];

const libraryNav = [
  { icon: LayoutDashboard, label: "Library Dashboard", path: "/dashboard/library" },
  { icon: Plus, label: "Add Books", path: "/library" },
  { icon: Library, label: "Catalog", path: "/library" },
  { icon: ClipboardList, label: "Issue & Loans", path: "/library" },
  { icon: Users, label: "Members", path: "/students" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
];

export function getNavItems(role) {
  switch (role) {
    case "Student":
      return studentNav;
    case "Teacher":
      return teacherNav;
    case "Librarian":
      return libraryNav;
    case "Admin":
      return [...adminNavItems, settingsNavItem];
    case "Staff":
      return adminNavItems;
    default:
      return adminNavItems;
  }
}

export function getPortalTitle(role) {
  switch (role) {
    case "Student":
      return "Student Portal";
    case "Teacher":
      return "Teacher Portal";
    case "Librarian":
      return "Library Portal";
    default:
      return "Admin Panel";
  }
}

export function getInitials(name = "User") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
