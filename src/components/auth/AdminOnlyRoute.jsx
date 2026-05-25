import { Navigate } from "react-router-dom";
import { getUser, getDashboardPath } from "../../lib/auth";

/** Only Admin role can access wrapped routes (e.g. Settings). */
const AdminOnlyRoute = ({ children }) => {
  const user = getUser();

  if (user?.role !== "Admin") {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return children;
};

export default AdminOnlyRoute;
