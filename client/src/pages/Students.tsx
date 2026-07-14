import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { SCHOOLS } from "@shared/const";

export default function Students() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const { selectedSchoolId, isAllSchools } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: students, refetch } = trpc.students.list.useQuery({
    search: search || undefined,
    schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined,
    status: statusFilter || undefined,
  }, { enabled: isAuthenticated });

  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => { toast.success("Student enrolled successfully"); refetch(); setShowCreate(false); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Students">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Student Management</h1>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Enroll Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Enroll New Student</DialogTitle>
              </DialogHeader>
              <StudentForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Student Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => (
                  <TableRow key={student.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/students/${student.id}`)}>
                    <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                    <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                    <TableCell className="capitalize">{student.gender || '-'}</TableCell>
                    <TableCell className="text-sm">{SCHOOLS.find(s => s.id === student.schoolId)?.shortName || '-'}</TableCell>
                    <TableCell className="capitalize">{student.studentType || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>{student.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/students/${student.id}`); }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!students || students.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No students found</TableCell>
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

function StudentForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const { selectedSchoolId, isAllSchools } = useSchool();
  const [form, setForm] = useState({
    firstName: '', lastName: '', gender: '' as any, parentName: '', parentPhone: '', parentEmail: '',
    schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined as number | undefined,
    studentType: '' as any, feeCategory: '' as any,
    sponsorName: '', sponsorContact: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>First Name *</Label><Input required value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
        <div><Label>Last Name *</Label><Input required value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
        <div><Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => setForm(f => ({ ...f, gender: v as any }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>School *</Label>
          <Select value={form.schoolId?.toString() || ''} onValueChange={(v) => setForm(f => ({ ...f, schoolId: parseInt(v) }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {SCHOOLS.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.shortName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Student Type</Label>
          <Select value={form.studentType} onValueChange={(v) => setForm(f => ({ ...f, studentType: v as any }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent><SelectItem value="day">Day</SelectItem><SelectItem value="boarding">Boarding</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Fee Category</Label>
          <Select value={form.feeCategory} onValueChange={(v) => setForm(f => ({ ...f, feeCategory: v as any }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent><SelectItem value="primary">Primary</SelectItem><SelectItem value="secondary">Secondary</SelectItem><SelectItem value="olevel">O-Level</SelectItem><SelectItem value="alevel">A-Level</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Parent/Guardian Name</Label><Input value={form.parentName} onChange={(e) => setForm(f => ({ ...f, parentName: e.target.value }))} /></div>
        <div><Label>Parent Phone</Label><Input value={form.parentPhone} onChange={(e) => setForm(f => ({ ...f, parentPhone: e.target.value }))} /></div>
        <div><Label>Parent Email</Label><Input type="email" value={form.parentEmail} onChange={(e) => setForm(f => ({ ...f, parentEmail: e.target.value }))} /></div>
        <div><Label>Sponsor Name</Label><Input value={form.sponsorName} onChange={(e) => setForm(f => ({ ...f, sponsorName: e.target.value }))} /></div>
        <div><Label>Sponsor Contact</Label><Input value={form.sponsorContact} onChange={(e) => setForm(f => ({ ...f, sponsorContact: e.target.value }))} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? 'Enrolling...' : 'Enroll Student'}</Button>
    </form>
  );
}
