import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';

// Minimalist Auth & Account Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import StaffLoginPage from './pages/auth/StaffLoginPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';

// Phase 4: Employee & Operations Management Pages
import EmployeeDashboard from './pages/admin/employees/EmployeeDashboard';
import EmployeeRoster from './pages/admin/employees/EmployeeRoster';
import AddEmployeePage from './pages/admin/employees/AddEmployeePage';
import EmployeeProfile from './pages/admin/employees/EmployeeProfile';
import ServiceAssignmentView from './pages/admin/employees/ServiceAssignmentView';
import WeeklyScheduleView from './pages/admin/employees/WeeklyScheduleView';

// Phase 5: Service Rituals & Multi-Branch Governance Pages
import ServiceCatalogPage from './pages/admin/services/ServiceCatalogPage';
import CreateServicePage from './pages/admin/services/CreateServicePage';
import ServiceDetailsPage from './pages/admin/services/ServiceDetailsPage';
import BranchServiceGovernancePage from './pages/admin/services/BranchServiceGovernancePage';
import GovernanceApprovalPage from './pages/admin/governance/GovernanceApprovalPage';

// Phase 6: Appointment Booking & Scheduling Pages
import BookAppointmentPage from './pages/booking/BookAppointmentPage';
import SelectDateTimePage from './pages/booking/SelectDateTimePage';
import BookingReviewPage from './pages/booking/BookingReviewPage';
import BookingConfirmationPage from './pages/booking/BookingConfirmationPage';
import MyBookingsPage from './pages/booking/MyBookingsPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import StaffAppointmentDetailPage from './pages/staff/StaffAppointmentDetailPage';
import StaffAvailabilityPage from './pages/staff/StaffAvailabilityPage';
import AdminAppointmentsPage from './pages/admin/appointments/AdminAppointmentsPage';

// RBAC & System Audit Pages
import RolesManagementPage from './pages/admin/roles/RolesManagementPage';
import AuditLogsPage from './pages/admin/audit/AuditLogsPage';
import BranchManagementPage from './pages/admin/branches/BranchManagementPage';
import ClienteleDirectoryPage from './pages/admin/clientele/ClienteleDirectoryPage';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Client Facing Experience */}
            <Route path="/" element={<HomePage />} />

            {/* Authentication Portals */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />

            {/* Customer Booking Funnel (Public & Authenticated) */}
            <Route path="/book" element={<BookAppointmentPage />} />
            <Route path="/book/datetime" element={<SelectDateTimePage />} />
            <Route path="/book/review" element={<BookingReviewPage />} />
            <Route path="/book/confirmation/:reference" element={<BookingConfirmationPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />

            {/* Customer Account & Preferences (Protected) */}
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER', 'BRANCH_ADMIN']}>
                  <CustomerProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Staff Portal (Protected for Specialist Employees and Admins) */}
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'BRANCH_ADMIN', 'OWNER']}>
                  <StaffDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/appointments/:id"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'BRANCH_ADMIN', 'OWNER']}>
                  <StaffAppointmentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/availability"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'BRANCH_ADMIN', 'OWNER']}>
                  <StaffAvailabilityPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Portal (Protected for Branch Admin & Owner) */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/appointments" replace />}
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <AdminAppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clientele"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <ClienteleDirectoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <EmployeeRoster />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/dashboard"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/add"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <AddEmployeePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/schedule"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <WeeklyScheduleView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/schedules"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <WeeklyScheduleView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/:id"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/:id/services"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <ServiceAssignmentView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/:id/schedule"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <WeeklyScheduleView />
                </ProtectedRoute>
              }
            />

            {/* Service Catalog & Multi-Branch Governance */}
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <ServiceCatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services/create"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <CreateServicePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services/pricing"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <BranchServiceGovernancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services/branch-governance"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <BranchServiceGovernancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services/:id"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <ServiceDetailsPage />
                </ProtectedRoute>
              }
            />
            {/* Governance Approvals (OWNER & BRANCH_ADMIN) */}
            <Route
              path="/admin/governance"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_ADMIN', 'OWNER']}>
                  <GovernanceApprovalPage />
                </ProtectedRoute>
              }
            />

            {/* Roles & Permissions Governance (OWNER or manage_roles) */}
            <Route
              path="/admin/roles"
              element={
                <ProtectedRoute
                  allowedRoles={['BRANCH_ADMIN', 'OWNER']}
                  requiredPermission="manage_roles"
                >
                  <RolesManagementPage />
                </ProtectedRoute>
              }
            />
            {/* Branch Management & Operating Hours (OWNER or manage_branches) */}
            <Route
              path="/admin/branches"
              element={
                <ProtectedRoute
                  allowedRoles={['BRANCH_ADMIN', 'OWNER']}
                  requiredPermission="manage_branches"
                >
                  <BranchManagementPage />
                </ProtectedRoute>
              }
            />
            {/* System Audit Logs (OWNER or view_audit_logs) */}
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute
                  allowedRoles={['BRANCH_ADMIN', 'OWNER']}
                  requiredPermission="view_audit_logs"
                >
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Wildcard fallback to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
