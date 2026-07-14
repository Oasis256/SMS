import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { useState } from "react";
import { ATTENDANCE_STATUS_COLORS } from "@shared/const";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";

export default function Attendance() {
  const { user, isAuthenticated, loading } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personType, setPersonType] = useState<string>("");
  const { selectedSchoolId } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: records } = trpc.attendance.getByDate.useQuery({ date, personType: personType || undefined, schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });
  const { data: summary } = trpc.attendance.summary.useQuery({ schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  const statusColors: Record<string, string> = ATTENDANCE_STATUS_COLORS;

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Attendance">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Biometric Attendance</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Present', count: summary?.present || 0, color: statusColors.present },
            { label: 'Late', count: summary?.late || 0, color: statusColors.late },
            { label: 'Absent', count: summary?.absent || 0, color: statusColors.absent },
            { label: 'On Leave', count: summary?.onLeave || 0, color: statusColors.on_leave },
            { label: 'Off Campus', count: summary?.offCampus || 0, color: statusColors.off_campus },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: item.color }} />
                <p className="text-2xl font-bold" style={{ color: item.color }}>{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[180px]" />
              <Select value={personType} onValueChange={setPersonType}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader><CardTitle>Attendance Records</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Person ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Biometric</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records?.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell className="capitalize">{record.personType}</TableCell>
                    <TableCell>{record.personId}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: statusColors[record.status] || '#888', color: '#fff' }}>
                        {record.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell className="capitalize">{record.location?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell>{record.biometricVerified ? '✓' : '-'}</TableCell>
                  </TableRow>
                ))}
                {(!records || records.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No records for this date</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
