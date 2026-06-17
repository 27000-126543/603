import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NewApplication from "@/pages/application/NewApplication";
import MyApplications from "@/pages/application/MyApplications";
import ApplicationList from "@/pages/application/ApplicationList";
import ParkingSpace from "@/pages/parking/ParkingSpace";
import ParkingConfig from "@/pages/parking/ParkingConfig";
import AccessRecords from "@/pages/records/AccessRecords";
import ExpenseList from "@/pages/finance/ExpenseList";
import DeductionManage from "@/pages/finance/DeductionManage";
import ReportOverview from "@/pages/reports/Overview";
import SystemLog from "@/pages/logs/SystemLog";
import Notifications from "@/pages/Notifications";
import { useAuthStore } from "@/store/useAuthStore";
import { usePermission } from "@/hooks/usePermission";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuthStore();
  const { isAdmin, isFinance, isEmployee } = usePermission();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    const hasPermission = roles.some(role => {
      if (role === 'admin' && isAdmin) return true;
      if (role === 'finance' && isFinance) return true;
      if (role === 'employee' && isEmployee) return true;
      return false;
    });

    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="application/new"
            element={
              <ProtectedRoute roles={['employee', 'admin']}>
                <NewApplication />
              </ProtectedRoute>
            }
          />

          <Route
            path="application/my"
            element={
              <ProtectedRoute roles={['employee', 'admin']}>
                <MyApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="application/list"
            element={
              <ProtectedRoute roles={['admin']}>
                <ApplicationList />
              </ProtectedRoute>
            }
          />

          <Route
            path="parking/space"
            element={
              <ProtectedRoute roles={['admin']}>
                <ParkingSpace />
              </ProtectedRoute>
            }
          />

          <Route
            path="parking/config"
            element={
              <ProtectedRoute roles={['admin']}>
                <ParkingConfig />
              </ProtectedRoute>
            }
          />

          <Route
            path="records/list"
            element={
              <ProtectedRoute>
                <AccessRecords />
              </ProtectedRoute>
            }
          />

          <Route
            path="finance/expense"
            element={
              <ProtectedRoute roles={['admin', 'finance', 'employee']}>
                <ExpenseList />
              </ProtectedRoute>
            }
          />

          <Route
            path="finance/deduction"
            element={
              <ProtectedRoute roles={['admin', 'finance']}>
                <DeductionManage />
              </ProtectedRoute>
            }
          />

          <Route
            path="reports/overview"
            element={
              <ProtectedRoute roles={['admin', 'finance']}>
                <ReportOverview />
              </ProtectedRoute>
            }
          />

          <Route
            path="logs/system"
            element={
              <ProtectedRoute roles={['admin', 'finance']}>
                <SystemLog />
              </ProtectedRoute>
            }
          />

          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
