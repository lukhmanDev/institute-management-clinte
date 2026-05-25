import React from "react";
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  User, 
  Sparkles,
  Command,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../ui/Button";
import { getUser } from "../../lib/auth";
import { useLogout } from "../../hooks/useLogout";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const user = getUser();
  const handleLogout = useLogout();

  return (
    <header className="fixed top-0 right-0 z-30 h-16 glass border-b transition-all duration-300" 
      style={{ left: "var(--sidebar-width, 260px)" }}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Search Bar */}
        <div className="hidden md:flex items-center w-full max-w-md relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Search anything... (Ctrl + K)"
            className="w-full bg-secondary/50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border bg-background text-[10px] text-muted-foreground">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" className="relative text-primary animate-pulse-slow">
            <Sparkles size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
          </Button>

          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-[10px] text-white flex items-center justify-center rounded-full">3</span>
            </Button>
          </Link>

          <div className="w-px h-6 bg-border mx-1"></div>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            onClick={handleLogout}
            title="Log out"
          >
            <LogOut size={18} />
            <span className="hidden md:inline text-sm">Log out</span>
          </Button>

          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-semibold">{user?.name || "User"}</span>
              <span className="text-[10px] text-muted-foreground">{user?.role || "Guest"}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-600 p-0.5">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <User size={20} className="text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
