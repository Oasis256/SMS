import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { SCHOOLS } from "@shared/const";

export default function HumanResources() {
  const { user, isAuthenticated, loading } = useAuth();
  const { selectedSchoolId } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: staffList } = trpc.hr.staffList.useQuery({ schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });
  const { data: leaveRequests, refetch: refetchLeave } = trpc.hr.leaveRequests.list.useQuery(undefined, { enabled: isAuthenticated });

  const approveLeaveMutation = trpc.hr.leaveRequests.approve.useMutation({
    onSuccess: () => { toast.success("Leave request updated"); refetchLeave(); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Human Resources">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Human Resources</h1>

        <Tabs defaultValue="staff">
          <TabsList>
            <TabsTrigger value="staff">Staff Records</TabsTrigger>
            <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Staff Records</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList?.map((staff: any) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-mono text-sm">{staff.employeeId}</TableCell>
                        <TableCell className="font-medium">{staff.userName || '-'}</TableCell>
                        <TableCell>{staff.position || '-'}</TableCell>
                        <TableCell>{staff.department || '-'}</TableCell>
                        <TableCell className="capitalize">{staff.contractType || '-'}</TableCell>
                        <TableCell className="capitalize">{SCHOOLS.find(s => s.id === staff.schoolId)?.shortName || '-'}</TableCell>
                        <TableCell><Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>{staff.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {(!staffList || staffList.length === 0) && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No staff records</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Leave Requests</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests?.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.staffId}</TableCell>
                        <TableCell className="capitalize">{req.leaveType?.replace('_', ' ')}</TableCell>
                        <TableCell>{req.startDate ? new Date(req.startDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{req.endDate ? new Date(req.endDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{req.reason || '-'}</TableCell>
                        <TableCell><Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>{req.status}</Badge></TableCell>
                        <TableCell>
                          {req.status === 'pending' && (user?.role === 'admin' || user?.role === 'principal') && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => approveLeaveMutation.mutate({ id: req.id, approved: true })}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => approveLeaveMutation.mutate({ id: req.id, approved: false })}>Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!leaveRequests || leaveRequests.length === 0) && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leave requests</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
