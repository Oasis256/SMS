import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ROLE_LABELS, ATTENDANCE_STATUS_COLORS } from "@shared/const";
import { Users, GraduationCap, BookOpen, AlertCircle, Clock, CheckCircle, XCircle, Coffee, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { startLogin } from "@/const";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useSchool } from "@/contexts/SchoolContext";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  useSessionTimeout();
  const { selectedSchoolId, selectedSchool, isAllSchools } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      startLogin();
    }
  }, [loading, isAuthenticated]);

  const { data: stats } = trpc.dashboard.stats.useQuery({ schoolId: selectedSchoolId }, { enabled: isAuthenticated });
  const { data: attendanceSummary } = trpc.dashboard.attendanceSummary.useQuery({ schoolId: selectedSchoolId }, { enabled: isAuthenticated });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  const navItems = getNavItems(user?.role || 'user');

  return (
    <DashboardLayout navItems={navItems} title="Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name || 'User'}</h1>
            <p className="text-muted-foreground">
              {ROLE_LABELS[user?.role || 'user']}
              {selectedSchool ? ` — ${selectedSchool.shortName}` : ' — All Schools'}
            </p>
          </div>
          {isAllSchools && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Building2 className="w-4 h-4" />
              Cross-School View
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={GraduationCap} title="Total Students" value={stats?.totalStudents || 0} color="text-primary" />
          <StatCard icon={Users} title="Total Staff" value={stats?.totalStaff || 0} color="text-blue-600" />
          <StatCard icon={BookOpen} title="Classes" value={stats?.totalClasses || 0} color="text-amber-600" />
          <StatCard icon={AlertCircle} title="Pending Expenses" value={stats?.pendingExpenses || 0} color="text-red-600" />
        </div>

        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <AttendanceBadge label="Present" count={attendanceSummary?.present || 0} color={ATTENDANCE_STATUS_COLORS.present} icon={CheckCircle} />
              <AttendanceBadge label="Late" count={attendanceSummary?.late || 0} color={ATTENDANCE_STATUS_COLORS.late} icon={Clock} />
              <AttendanceBadge label="Absent" count={attendanceSummary?.absent || 0} color={ATTENDANCE_STATUS_COLORS.absent} icon={XCircle} />
              <AttendanceBadge label="On Leave" count={attendanceSummary?.onLeave || 0} color={ATTENDANCE_STATUS_COLORS.on_leave} icon={Coffee} />
              <AttendanceBadge label="Off Campus" count={attendanceSummary?.offCampus || 0} color={ATTENDANCE_STATUS_COLORS.off_campus} icon={Users} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, title, value, color }: { icon: any; title: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-muted ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceBadge({ label, count, color, icon: Icon }: { label: string; count: number; color: string; icon: any }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold" style={{ color }}>{count}</p>
      </div>
    </div>
  );
}

export function getNavItems(role: string) {
  const allItems = [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Students", href: "/students", icon: "GraduationCap" },
    { label: "Attendance", href: "/attendance", icon: "Clock" },
    { label: "Finance", href: "/finance", icon: "DollarSign" },
    { label: "Expenses", href: "/finance/expenses", icon: "Receipt" },
    { label: "Budget", href: "/finance/budget", icon: "PieChart" },
    { label: "Payroll", href: "/finance/payroll", icon: "Wallet" },
    { label: "Academics", href: "/academics", icon: "BookOpen" },
    { label: "Human Resources", href: "/hr", icon: "Users" },
    { label: "Reports", href: "/reports", icon: "BarChart3" },
    { label: "User Management", href: "/users", icon: "Shield" },
    { label: "Audit Log", href: "/audit-log", icon: "FileText" },
  ];

  switch (role) {
    case 'admin':
    case 'principal':
      return allItems;
    case 'bursar':
      return allItems.filter(i => ['Dashboard', 'Finance', 'Expenses', 'Budget', 'Payroll', 'Students', 'Reports'].includes(i.label));
    case 'director_of_studies':
      return allItems.filter(i => ['Dashboard', 'Students', 'Attendance', 'Academics', 'Reports'].includes(i.label));
    case 'teacher':
      return allItems.filter(i => ['Dashboard', 'Students', 'Attendance', 'Academics'].includes(i.label));
    case 'department_head':
      return allItems.filter(i => ['Dashboard', 'Students', 'Attendance', 'Academics', 'Reports'].includes(i.label));
    default:
      return allItems.filter(i => ['Dashboard'].includes(i.label));
  }
}
