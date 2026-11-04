import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
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

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Client Facing Experience */}
        <Route path="/" element={<HomePage />} />

        {/* Phase 4: Employee & Operations Management Routes */}
        <Route path="/admin" element={<Navigate to="/admin/employees/dashboard" replace />} />
        <Route path="/admin/employees" element={<EmployeeRoster />} />
        <Route path="/admin/employees/dashboard" element={<EmployeeDashboard />} />
        <Route path="/admin/employees/add" element={<AddEmployeePage />} />
        <Route path="/admin/employees/schedule" element={<WeeklyScheduleView />} />
        <Route path="/admin/employees/:id" element={<EmployeeProfile />} />
        <Route path="/admin/employees/:id/services" element={<ServiceAssignmentView />} />
        <Route path="/admin/employees/:id/schedule" element={<WeeklyScheduleView />} />

        {/* Phase 5: Service Rituals & Branch Governance Routes */}
        <Route path="/admin/services" element={<ServiceCatalogPage />} />
        <Route path="/admin/services/create" element={<CreateServicePage />} />
        <Route path="/admin/services/branch-governance" element={<BranchServiceGovernancePage />} />
        <Route path="/admin/services/:id" element={<ServiceDetailsPage />} />

        {/* Wildcard fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
