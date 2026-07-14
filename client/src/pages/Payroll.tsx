import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { useState } from "react";
import { Plus, Calculator } from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { SCHOOLS } from "@shared/const";

export default function Payroll() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showGenerate, setShowGenerate] = useState(false);
  const { selectedSchoolId } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const [queryMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data: payrolls, refetch } = trpc.finance.payrollList.useQuery({ month: queryMonth, schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });

  const generateMutation = trpc.finance.generatePayroll.useMutation({
    onSuccess: () => { toast.success("Payroll generated based on attendance data"); refetch(); setShowGenerate(false); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Payroll">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
            <DialogTrigger asChild>
              <Button><Calculator className="w-4 h-4 mr-2" />Generate Payroll</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Generate Payroll (Linked to Attendance)</DialogTitle></DialogHeader>
              <PayrollForm onSubmit={(data) => generateMutation.mutate(data)} loading={generateMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-800"><strong>Note:</strong> Payroll calculations are directly tied to biometric attendance data. Deductions are automatically calculated based on absences recorded in the attendance system.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payroll Records</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Month/Year</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Days Present</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls?.map((payroll: any) => (
                  <TableRow key={payroll.id}>
                    <TableCell>{payroll.staffId}</TableCell>
                    <TableCell>{payroll.month}/{payroll.year}</TableCell>
                    <TableCell>UGX {parseFloat(payroll.baseSalary || '0').toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">-UGX {parseFloat(payroll.deductions || '0').toLocaleString()}</TableCell>
                    <TableCell className="font-bold">UGX {parseFloat(payroll.netPay || '0').toLocaleString()}</TableCell>
                    <TableCell>{payroll.daysPresent || 0}/{payroll.totalWorkingDays || 0}</TableCell>
                    <TableCell><Badge variant={payroll.status === 'paid' ? 'default' : 'secondary'}>{payroll.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {(!payrolls || payrolls.length === 0) && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payroll records</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function PayrollForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const { selectedSchoolId } = useSchool();
  const [form, setForm] = useState({ month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear().toString(), schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined as number | undefined });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ month: parseInt(form.month), year: parseInt(form.year), schoolId: form.schoolId }); }} className="space-y-4">
      <div><Label>Month *</Label>
        <Select value={form.month} onValueChange={(v) => setForm(f => ({ ...f, month: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i+1} value={(i+1).toString()}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Year *</Label><Input required value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} /></div>
      <div><Label>School</Label>
        <Select value={form.schoolId?.toString() || ''} onValueChange={(v) => setForm(f => ({ ...f, schoolId: v ? parseInt(v) : undefined }))}>
          <SelectTrigger><SelectValue placeholder="All Schools" /></SelectTrigger>
          <SelectContent>
            {SCHOOLS.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.shortName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">This will calculate payroll for all staff based on their attendance records for the selected month.</p>
      <Button type="submit" disabled={loading} className="w-full">{loading ? 'Generating...' : 'Generate Payroll from Attendance'}</Button>
    </form>
  );
}
