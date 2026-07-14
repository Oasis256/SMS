import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { startLogin } from "@/const";
import { useEffect } from "react";

export default function AuditLog() {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: logs } = trpc.admin.auditLog.useQuery(undefined, { enabled: isAuthenticated });

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
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Audit Log">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Audit Log</h1>

        <Card>
          <CardHeader><CardTitle>All System Activities</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell className="capitalize">{log.action?.replace('_', ' ')}</TableCell>
                    <TableCell className="font-mono text-sm">{log.tableName || '-'}</TableCell>
                    <TableCell>{log.recordId || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{log.newValue || '-'}</TableCell>
                  </TableRow>
                ))}
                {(!logs || logs.length === 0) && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No audit log entries</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

