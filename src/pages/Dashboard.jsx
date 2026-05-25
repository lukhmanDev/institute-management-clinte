import { Navigate } from "react-router-dom";
import { getUser, getDashboardPath, isAuthenticated } from "../lib/auth";

/** Redirect /dashboard to the correct role dashboard */
const Dashboard = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  const user = getUser();
  return <Navigate to={getDashboardPath(user?.role)} replace />;
};

export default Dashboard;
