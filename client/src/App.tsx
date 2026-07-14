import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SchoolProvider } from "./contexts/SchoolContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Attendance from "./pages/Attendance";
import Finance from "./pages/Finance";
import Expenses from "./pages/Expenses";
import Budget from "./pages/Budget";
import Payroll from "./pages/Payroll";
import Academics from "./pages/Academics";
import HumanResources from "./pages/HumanResources";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import AuditLog from "./pages/AuditLog";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/students"} component={Students} />
      <Route path={"/students/:id"} component={StudentDetail} />
      <Route path={"/attendance"} component={Attendance} />
      <Route path={"/finance"} component={Finance} />
      <Route path={"/finance/expenses"} component={Expenses} />
      <Route path={"/finance/budget"} component={Budget} />
      <Route path={"/finance/payroll"} component={Payroll} />
      <Route path={"/academics"} component={Academics} />
      <Route path={"/hr"} component={HumanResources} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/users"} component={UserManagement} />
      <Route path={"/audit-log"} component={AuditLog} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <SchoolProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SchoolProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
