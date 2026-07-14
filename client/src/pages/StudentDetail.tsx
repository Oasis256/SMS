import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, User, Phone, Mail, MapPin, BookOpen } from "lucide-react";
import { ATTENDANCE_STATUS_COLORS } from "@shared/const";
import { startLogin } from "@/const";
import { useEffect } from "react";

export default function StudentDetail() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const studentId = parseInt(params.id || '0');

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: student } = trpc.students.getById.useQuery({ id: studentId }, { enabled: isAuthenticated && studentId > 0 });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Student Profile">
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/students')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Students
        </Button>

        {student ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="lg:col-span-1">
              <CardContent className="pt-6 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{student.firstName} {student.lastName}</h2>
                <p className="text-sm text-muted-foreground font-mono">{student.studentId}</p>
                <Badge className="mt-2" variant={student.status === 'active' ? 'default' : 'secondary'}>{student.status}</Badge>
                <div className="mt-6 space-y-3 text-left">
                  <InfoRow icon={MapPin} label="Location" value={student.schoolLocation || 'N/A'} />
                  <InfoRow icon={BookOpen} label="Type" value={student.studentType || 'N/A'} />
                  <InfoRow icon={BookOpen} label="Fee Category" value={student.feeCategory || 'N/A'} />
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow icon={User} label="Parent/Guardian" value={student.parentName || 'N/A'} />
                  <InfoRow icon={Phone} label="Parent Phone" value={student.parentPhone || 'N/A'} />
                  <InfoRow icon={Mail} label="Parent Email" value={student.parentEmail || 'N/A'} />
                  <InfoRow icon={Phone} label="Emergency Contact" value={student.emergencyContact || 'N/A'} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Sponsor Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow icon={User} label="Sponsor Name" value={student.sponsorName || 'N/A'} />
                  <InfoRow icon={Phone} label="Sponsor Contact" value={student.sponsorContact || 'N/A'} />
                  <InfoRow icon={BookOpen} label="Sponsor Status" value={student.sponsorStatus || 'N/A'} />
                </CardContent>
              </Card>

              {student.hasSpecialNeeds && (
                <Card>
                  <CardHeader><CardTitle>Special Needs</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{student.specialNeedsNotes || 'No details provided'}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Student not found</div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}

