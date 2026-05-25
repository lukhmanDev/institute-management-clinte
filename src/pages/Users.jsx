import React, { useState, useEffect } from "react";
import { Users as UsersIcon, Shield, Mail, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { api, parseList } from "../lib/api";
import { cn } from "../lib/utils";

const roleColors = {
  Admin: "bg-red-500/10 text-red-600",
  Staff: "bg-blue-500/10 text-blue-600",
  Teacher: "bg-purple-500/10 text-purple-600",
  Student: "bg-emerald-500/10 text-emerald-600",
  Librarian: "bg-orange-500/10 text-orange-600",
  Parent: "bg-gray-500/10 text-gray-600",
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getUsers([]);
        setUsers(parseList(data));
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.name?.toLowerCase().includes(term) ||
      u.first_name?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UsersIcon className="text-primary" />
          Auth Users
        </h1>
        <p className="text-muted-foreground">
          System login accounts (custom user table). Same data as Django admin → API → Auth users.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>User accounts</CardTitle>
            <CardDescription>
              Database table: <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">auth_users</code>
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search email, name, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading users...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No users found. Run <code className="bg-secondary px-1 rounded">python manage.py seed_data</code> on the backend.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground text-xs uppercase">
                    <th className="pb-3 pr-4">ID</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Staff</th>
                    <th className="pb-3">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-secondary/30">
                      <td className="py-3 pr-4 font-mono text-muted-foreground">{u.id}</td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Mail size={14} className="text-muted-foreground" />
                          {u.email}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim()}</td>
                      <td className="py-3 pr-4">
                        <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded", roleColors[u.role] || roleColors.Staff)}>
                          <Shield size={10} className="inline mr-1" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{u.is_staff ? "Yes" : "No"}</td>
                      <td className="py-3">{u.is_active !== false ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
