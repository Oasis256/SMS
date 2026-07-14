import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getNavItems } from "./Dashboard";
import { useState } from "react";
import { Plus, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { SCHOOLS } from "@shared/const";

const STATUS_BADGES: Record<string, { variant: any; label: string }> = {
  pending: { variant: 'outline', label: 'Pending' },
  finance_reviewed: { variant: 'secondary', label: 'Finance Reviewed' },
  principal_approved: { variant: 'default', label: 'Principal Approved' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  paid: { variant: 'default', label: 'Paid' },
};

export default function Expenses() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showSubmit, setShowSubmit] = useState(false);
  const [showApproval, setShowApproval] = useState<any>(null);
  const [pin, setPin] = useState('');
  const { selectedSchoolId } = useSchool();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const { data: expenses, refetch } = trpc.finance.expenseList.useQuery({ schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined }, { enabled: isAuthenticated });

  const submitMutation = trpc.finance.submitExpense.useMutation({
    onSuccess: () => { toast.success("Expense submitted for review"); refetch(); setShowSubmit(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const financeReviewMutation = trpc.finance.financeReview.useMutation({
    onSuccess: () => { toast.success("Finance review completed"); refetch(); setShowApproval(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const principalApproveMutation = trpc.finance.principalApprove.useMutation({
    onSuccess: () => { toast.success("Principal approval recorded"); refetch(); setShowApproval(null); setPin(''); },
    onError: (e: any) => toast.error(e.message),
  });

  const processPaymentMutation = trpc.finance.processPayment.useMutation({
    onSuccess: () => { toast.success("Payment processed"); refetch(); setShowApproval(null); },
    onError: (e: any) => toast.error(e.message),
  });

  if (loading) return <DashboardLayoutSkeleton />;
  if (!isAuthenticated) return null;

  const role = user?.role || 'user';

  return (
    <DashboardLayout navItems={getNavItems(role)} title="Expenses">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Expense Management</h1>
          <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Submit Expense</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Submit Expense Request</DialogTitle></DialogHeader>
              <ExpenseForm onSubmit={(data) => submitMutation.mutate(data)} loading={submitMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Workflow Info */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Expense Approval Workflow</p>
                <p className="text-sm text-amber-700">All expenses require: Request → Finance Review → Principal Approval (PIN required, mandatory for ALL amounts) → Payment Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader><CardTitle>Expense Requests</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense: any) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>UGX {parseFloat(expense.amount || '0').toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{expense.category?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGES[expense.status]?.variant || 'outline'}>
                        {STATUS_BADGES[expense.status]?.label || expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {expense.status === 'pending' && (role === 'bursar' || role === 'admin') && (
                        <Button size="sm" variant="outline" onClick={() => setShowApproval({ type: 'finance_review', expense })}>
                          Finance Review
                        </Button>
                      )}
                      {expense.status === 'finance_reviewed' && (role === 'principal' || role === 'admin') && (
                        <Button size="sm" variant="outline" onClick={() => setShowApproval({ type: 'principal_approval', expense })}>
                          Principal Approve
                        </Button>
                      )}
                      {expense.status === 'principal_approved' && (role === 'bursar' || role === 'admin') && (
                        <Button size="sm" variant="outline" onClick={() => setShowApproval({ type: 'process_payment', expense })}>
                          Process Payment
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!expenses || expenses.length === 0) && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expense requests</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog open={!!showApproval} onOpenChange={() => { setShowApproval(null); setPin(''); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {showApproval?.type === 'finance_review' && 'Finance Review'}
                {showApproval?.type === 'principal_approval' && 'Principal Approval (PIN Required)'}
                {showApproval?.type === 'process_payment' && 'Process Payment'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{showApproval?.expense?.title}</p>
                <p className="text-lg font-bold">UGX {parseFloat(showApproval?.expense?.amount || '0').toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{showApproval?.expense?.description}</p>
              </div>

              {showApproval?.type === 'principal_approval' && (
                <div>
                  <Label>Digital PIN (Required for ALL amounts) *</Label>
                  <Input type="password" placeholder="Enter your PIN" value={pin} onChange={(e) => setPin(e.target.value)} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Principal PIN authorization is mandatory regardless of expense amount.</p>
                </div>
              )}

              {showApproval?.type === 'process_payment' && (
                <div>
                  <Label>Payment Method</Label>
                  <Select onValueChange={(v) => setShowApproval((prev: any) => ({ ...prev, paymentMethod: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                {showApproval?.type === 'finance_review' && (
                  <>
                    <Button className="flex-1" onClick={() => financeReviewMutation.mutate({ expenseId: showApproval.expense.id, approved: true, budgetVerified: true, fundsAvailable: true })}>
                      <CheckCircle className="w-4 h-4 mr-2" />Approve
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => financeReviewMutation.mutate({ expenseId: showApproval.expense.id, approved: false })}>
                      <XCircle className="w-4 h-4 mr-2" />Reject
                    </Button>
                  </>
                )}
                {showApproval?.type === 'principal_approval' && (
                  <>
                    <Button className="flex-1" disabled={!pin} onClick={() => principalApproveMutation.mutate({ expenseId: showApproval.expense.id, approved: true, pin })}>
                      <CheckCircle className="w-4 h-4 mr-2" />Approve with PIN
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => principalApproveMutation.mutate({ expenseId: showApproval.expense.id, approved: false, pin: pin || 'reject' })}>
                      <XCircle className="w-4 h-4 mr-2" />Reject
                    </Button>
                  </>
                )}
                {showApproval?.type === 'process_payment' && (
                  <Button className="flex-1" onClick={() => processPaymentMutation.mutate({ expenseId: showApproval.expense.id, paymentMethod: showApproval.paymentMethod || 'cash' })}>
                    <CheckCircle className="w-4 h-4 mr-2" />Process Payment
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function ExpenseForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const { selectedSchoolId } = useSchool();
  const [form, setForm] = useState({
    title: '', description: '', amount: '', category: '', schoolId: selectedSchoolId > 0 ? selectedSchoolId : undefined as number | undefined,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} /></div>
      <div><Label>Amount (UGX) *</Label><Input required type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
      <div><Label>Category *</Label><Input required value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. supplies, maintenance, transport" /></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} /></div>
      <div><Label>School</Label>
        <Select value={form.schoolId?.toString() || ''} onValueChange={(v) => setForm(f => ({ ...f, schoolId: parseInt(v) }))}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {SCHOOLS.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.shortName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? 'Submitting...' : 'Submit Expense Request'}</Button>
    </form>
  );
}
