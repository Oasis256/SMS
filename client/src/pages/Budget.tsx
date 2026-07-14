import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { SCHOOLS } from "@shared/const";

export default function Budget() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const { selectedSchoolId } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: budgets, refetch } = trpc.finance.budgetList.useQuery({ schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });

  const createMutation = trpc.finance.createBudget.useMutation({
    onSuccess: () => { toast.success("Budget created"); refetch(); setShowCreate(false); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Budget">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Budget Management</h1>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Create Budget</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Budget Item</DialogTitle></DialogHeader>
              <BudgetForm onSubmit={(data) => createMutation.mutate(data)} loading={createMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Budget Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Term</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets?.map((budget: any) => {
                  const allocated = parseFloat(budget.allocatedAmount || '0');
                  const spent = parseFloat(budget.spentAmount || '0');
                  const pct = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium capitalize">{budget.category}</TableCell>
                      <TableCell>UGX {allocated.toLocaleString()}</TableCell>
                      <TableCell>UGX {spent.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="w-20" />
                          <span className={`text-sm ${pct > 90 ? 'text-red-600 font-bold' : ''}`}>{pct.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{budget.academicYear}</TableCell>
                      <TableCell className="capitalize">{budget.term?.replace('term', 'Term ') || '-'}</TableCell>
                    </TableRow>
                  );
                })}
                {(!budgets || budgets.length === 0) && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No budgets created</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function BudgetForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const { selectedSchoolId } = useSchool();
  const [form, setForm] = useState({ category: '', allocatedAmount: '', academicYear: new Date().getFullYear().toString(), term: '' as any, schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined as number | undefined });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><Label>Category *</Label><Input required value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Salaries, Supplies, Transport" /></div>
      <div><Label>Allocated Amount (UGX) *</Label><Input required type="number" value={form.allocatedAmount} onChange={(e) => setForm(f => ({ ...f, allocatedAmount: e.target.value }))} /></div>
      <div><Label>Academic Year *</Label><Input required value={form.academicYear} onChange={(e) => setForm(f => ({ ...f, academicYear: e.target.value }))} /></div>
      <div><Label>Term</Label>
        <Select value={form.term} onValueChange={(v) => setForm(f => ({ ...f, term: v }))}>
          <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="term1">Term 1</SelectItem>
            <SelectItem value="term2">Term 2</SelectItem>
            <SelectItem value="term3">Term 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>School</Label>
        <Select value={form.schoolId?.toString() || ''} onValueChange={(v) => setForm(f => ({ ...f, schoolId: parseInt(v) }))}>
          <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
          <SelectContent>
            {SCHOOLS.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.shortName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating...' : 'Create Budget'}</Button>
    </form>
  );
}
