import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { startLogin } from "@/const";
import { useEffect, useState } from "react";
import { BarChart3, DollarSign, Users, Clock } from "lucide-react";
import { useSchool } from "@/contexts/SchoolContext";

export default function Reports() {
  const { user, isAuthenticated, loading } = useAuth();
  const { selectedSchoolId } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: financeSummary } = trpc.reports.financeSummary.useQuery({ schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });
  const [reportDates] = useState({ startDate: new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] });
  const { data: attendanceReport } = trpc.reports.attendanceReport.useQuery({ ...reportDates, schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Reports">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>

        <Tabs defaultValue="finance">
          <TabsList>
            <TabsTrigger value="finance">Financial</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="finance" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-xl font-bold">UGX {(financeSummary?.totalIncome || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-xl font-bold">UGX {(financeSummary?.totalExpenses || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Net Balance</p>
                      <p className="text-xl font-bold">UGX {(financeSummary?.balance || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Automated reports are generated and delivered to the Principal, Bursar, and Director of Studies on a recurring schedule:</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Daily Cash Summary — delivered every evening</li>
                  <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Weekly Attendance Report — delivered every Monday</li>
                  <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Monthly Financial Statement — delivered 1st of each month</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="mt-4">
            {(() => {
              const records = attendanceReport || [];
              const total = records.length;
              const present = records.filter((r: any) => r.status === 'present').length;
              const late = records.filter((r: any) => r.status === 'late').length;
              const absent = records.filter((r: any) => r.status === 'absent').length;
              const presentRate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
              const lateRate = total > 0 ? ((late / total) * 100).toFixed(1) : '0';
              const absentRate = total > 0 ? ((absent / total) * 100).toFixed(1) : '0';
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-600">{presentRate}%</p><p className="text-sm text-muted-foreground">Present Rate</p></CardContent></Card>
                  <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-yellow-600">{lateRate}%</p><p className="text-sm text-muted-foreground">Late Rate</p></CardContent></Card>
                  <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-red-600">{absentRate}%</p><p className="text-sm text-muted-foreground">Absent Rate</p></CardContent></Card>
                  <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-foreground">{total}</p><p className="text-sm text-muted-foreground">Total Records</p></CardContent></Card>
                </div>
              );
            })()}
         </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
