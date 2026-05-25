export const statsData = [
  { label: "Total Students", value: "2,450", change: "+12%", trend: "up", color: "blue" },
  { label: "Total Teachers", value: "185", change: "+4%", trend: "up", color: "purple" },
  { label: "Fees Pending", value: "$12,450", change: "-5%", trend: "down", color: "orange" },
  { label: "Avg Attendance", value: "94%", change: "+2%", trend: "up", color: "emerald" },
];

export const revenueData = [
  { name: "Jan", revenue: 45000, expenses: 32000 },
  { name: "Feb", revenue: 52000, expenses: 35000 },
  { name: "Mar", revenue: 48000, expenses: 33000 },
  { name: "Apr", revenue: 61000, expenses: 38000 },
  { name: "May", revenue: 55000, expenses: 36000 },
  { name: "Jun", revenue: 67000, expenses: 40000 },
];

export const studentDistribution = [
  { name: "Grade 1-5", value: 400 },
  { name: "Grade 6-8", value: 300 },
  { name: "Grade 9-10", value: 300 },
  { name: "Grade 11-12", value: 200 },
];

export const recentActivities = [
  { id: 1, type: "fee", user: "John Doe", action: "paid semester fees", time: "2 hours ago", status: "success" },
  { id: 2, type: "exam", user: "Physics Dept", action: "published Grade 10 results", time: "4 hours ago", status: "info" },
  { id: 3, type: "attendance", user: "System", action: "auto-marked teacher attendance", time: "6 hours ago", status: "warning" },
  { id: 4, type: "student", user: "Sarah Smith", action: "new student registered", time: "Yesterday", status: "success" },
];

export const aiInsights = [
  { id: 1, title: "Attendance Drop", description: "Grade 9 attendance dropped by 4% this week. Predicted reason: Upcoming sports meet.", impact: "medium" },
  { id: 2, title: "Revenue Forecast", description: "Projected 15% increase in fee collection for next month based on payment history.", impact: "high" },
  { id: 3, title: "Performance Alert", description: "3 students in Section B showing declining performance in Mathematics.", impact: "low" },
];
