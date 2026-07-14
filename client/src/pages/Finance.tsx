import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { useState } from "react";
import { Plus, DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { SCHOOLS } from "@shared/const";

export default function Finance() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showRecordIncome, setShowRecordIncome] = useState(false);
  const { selectedSchoolId } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: summary } = trpc.reports.financeSummary.useQuery({ schoolId: selectedSchoolId }, { enabled: isAuthenticated });
  const { data: incomeList, refetch } = trpc.finance.incomeList.useQuery({ schoolId: selectedSchoolId }, { enabled: isAuthenticated });

  const recordIncomeMutation = trpc.finance.recordIncome.useMutation({
    onSuccess: (data) => { toast.success(`Income recorded. Receipt: ${data.receiptNumber}`); refetch(); setShowRecordIncome(false); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout navItems={getNavItems(user?.role || 'user')} title="Finance">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Finance Management</h1>
          <Dialog open={showRecordIncome} onOpenChange={setShowRecordIncome}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Record Income</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Record Income</DialogTitle></DialogHeader>
              <IncomeForm onSubmit={(data) => recordIncomeMutation.mutate(data)} loading={recordIncomeMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 text-green-700"><TrendingUp className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-700">UGX {(summary?.totalIncome || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-100 text-red-700"><TrendingDown className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-700">UGX {(summary?.totalExpenses || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-700"><Wallet className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-2xl font-bold text-blue-700">UGX {(summary?.balance || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Income Records */}
        <Card>
          <CardHeader><CardTitle>Income Records</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeList?.map((income: any) => (
                  <TableRow key={income.id}>
                    <TableCell className="font-mono text-sm">{income.receiptNumber}</TableCell>
                    <TableCell className="capitalize">{income.category?.replace('_', ' ')}</TableCell>
                    <TableCell className="font-medium">UGX {parseFloat(income.amount || '0').toLocaleString()}</TableCell>
                    <TableCell>{income.payerName || '-'}</TableCell>
                    <TableCell className="capitalize">{income.paymentMethod?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell>{income.paymentDate ? new Date(income.paymentDate).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {(!incomeList || incomeList.length === 0) && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No income records</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function IncomeForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const { selectedSchoolId, isAllSchools } = useSchool();
  const [form, setForm] = useState({
    category: '' as any,
    amount: '',
    payerName: '',
    payerContact: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '' as any,
    schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined as number | undefined,
    description: '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sponsorship">Sponsorship</SelectItem>
              <SelectItem value="student_fees">Student Fees</SelectItem>
              <SelectItem value="facility_rental">Facility Rental</SelectItem>
              <SelectItem value="meal_sales">Meal Sales</SelectItem>
              <SelectItem value="training_fees">Training Fees</SelectItem>
              <SelectItem value="agricultural_sales">Agricultural Sales</SelectItem>
              <SelectItem value="donations">Donations</SelectItem>
              <SelectItem value="grants">Grants</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Amount (UGX) *</Label><Input required type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
        <div><Label>Payment Date *</Label><Input required type="date" value={form.paymentDate} onChange={(e) => setForm(f => ({ ...f, paymentDate: e.target.value }))} /></div>
        <div><Label>Payer Name</Label><Input value={form.payerName} onChange={(e) => setForm(f => ({ ...f, payerName: e.target.value }))} /></div>
        <div><Label>Payer Contact</Label><Input value={form.payerContact} onChange={(e) => setForm(f => ({ ...f, payerContact: e.target.value }))} /></div>
        <div><Label>Payment Method</Label>
          <Select value={form.paymentMethod} onValueChange={(v) => setForm(f => ({ ...f, paymentMethod: v }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>School</Label>
          <Select value={form.schoolId?.toString() || ''} onValueChange={(v) => setForm(f => ({ ...f, schoolId: parseInt(v) }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {SCHOOLS.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.shortName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? 'Recording...' : 'Record Income'}</Button>
    </form>
  );
}
