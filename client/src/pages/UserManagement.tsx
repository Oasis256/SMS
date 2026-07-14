import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { ROLE_LABELS } from "@shared/const";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useEffect } from "react";

export default function UserManagement() {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: users, refetch } = trpc.admin.userList.useQuery(undefined, { enabled: isAuthenticated });

  const updateRoleMutation = trpc.admin.updateRole.useMutation({
   onSuccess: () => { toast.success("Role updated"); refetch(); },
    onError: (e: any) => toast.error(e.message),
 });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Access Denied">
        <div className="text-center py-12 text-muted-foreground">You do not have permission to access this page.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="User Management">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>

        <Card>
          <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '-'}</TableCell>
                    <TableCell>{u.email || '-'}</TableCell>
                    <TableCell><Badge>{ROLE_LABELS[u.role] || u.role}</Badge></TableCell>
                    <TableCell>{u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => updateRoleMutation.mutate({ userId: u.id, role: v as any })}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="principal">Principal</SelectItem>
                          <SelectItem value="bursar">Bursar</SelectItem>
                          <SelectItem value="director_of_studies">Director of Studies</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="department_head">Department Head</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {(!users || users.length === 0) && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
