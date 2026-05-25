import { useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";

export function useLogout() {
  const navigate = useNavigate();

  return () => {
    logout();
    navigate("/", { replace: true });
  };
}
