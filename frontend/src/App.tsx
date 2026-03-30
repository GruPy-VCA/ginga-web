import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RecruiterLayout } from "./components/RecruiterLayout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { JobListPage } from "./pages/JobListPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { ApplicationListPage } from "./pages/ApplicationListPage";
import { PublicCompaniesPage } from "./pages/PublicCompaniesPage";
import { CompanyPublicDetailPage } from "./pages/CompanyPublicDetailPage";
import { RecruiterCompaniesPage } from "./pages/CompaniesPage";
import { CompanyFormPage } from "./pages/CompanyFormPage";
import { RecruiterJobFormPage } from "./pages/RecruiterJobFormPage";
import { RecruiterJobsDashboardPage } from "./pages/RecruiterJobsDashboardPage";
import { RecruiterDashboardPage } from "./pages/RecruiterDashboardPage";
import { RecruiterApplicationsPage } from "./pages/RecruiterApplicationsPage";
import { ProfilePage } from "./pages/ProfilePage";

function LegacyRedirectCompanyEdit() {
  const { companyId } = useParams<{ companyId: string }>();
  return <Navigate to={`/recruiter/companies/${companyId}/edit`} replace />;
}

function LegacyRedirectCompanyJobNew() {
  const { companyId } = useParams<{ companyId: string }>();
  return <Navigate to={`/recruiter/companies/${companyId}/jobs/new`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="jobs" element={<JobListPage />} />
            <Route path="jobs/:jobId" element={<JobDetailPage />} />
            <Route path="companies/new" element={<Navigate to="/recruiter/companies/new" replace />} />
            <Route path="companies/:companyId/edit" element={<LegacyRedirectCompanyEdit />} />
            <Route path="companies/:companyId/jobs/new" element={<LegacyRedirectCompanyJobNew />} />
            <Route path="companies" element={<PublicCompaniesPage />} />
            <Route path="companies/:companyId" element={<CompanyPublicDetailPage />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="applications"
              element={
                <ProtectedRoute>
                  <ApplicationListPage />
                </ProtectedRoute>
              }
            />
            <Route path="recruiter/dashboard" element={<Navigate to="/recruiter" replace />} />
            <Route
              path="recruiter"
              element={
                <ProtectedRoute>
                  <RecruiterLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RecruiterDashboardPage />} />
              <Route path="companies" element={<RecruiterCompaniesPage />} />
              <Route path="companies/new" element={<CompanyFormPage />} />
              <Route path="companies/:companyId/edit" element={<CompanyFormPage />} />
              <Route path="companies/:companyId/jobs/new" element={<RecruiterJobFormPage />} />
              <Route path="jobs" element={<RecruiterJobsDashboardPage />} />
              <Route path="jobs/new" element={<RecruiterJobFormPage />} />
              <Route path="jobs/:jobId/edit" element={<RecruiterJobFormPage />} />
              <Route path="applications" element={<RecruiterApplicationsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
