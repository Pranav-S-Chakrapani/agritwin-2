import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { UserModeProvider } from './context/UserModeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './components/Auth/AuthGuard';
import { GuidedOnboardingWizard } from './components/Onboarding/GuidedOnboardingWizard';

import Login from './pages/Login';
import SignUp from './pages/SignUp';
import UserManagement from './pages/UserManagement';

import Dashboard from './pages/Dashboard';
import CropComparison from './pages/CropComparison';
import CropHealthAdvisor from './pages/CropHealthAdvisor';
import CropVision from './pages/CropVision';
import AIAdvisor from './pages/AIAdvisor';
import VirtualFarm from './pages/VirtualFarm';
import FieldLog from './pages/FieldLog';
import Analytics from './pages/Analytics';
import WhatIfSimulator from './pages/WhatIfSimulator';
import MapView from './pages/MapView';
import CameraFeed from './pages/CameraFeed';
import MySensors from './pages/MySensors';
import DeviceControl from './pages/DeviceControl';
import Crops from './pages/farm-management/Crops';
import FieldAuditLog from './pages/farm-management/FieldAuditLog';
import MyFarms from './pages/MyFarms';
import DatabaseMonitor from './pages/DatabaseMonitor';
import ActivityLog from './pages/ActivityLog';
import Alerts from './pages/Alerts';

import AddNewFarmlandPage from './pages/AddNewFarmlandPage';
import ManualTelemetryPage from './pages/ManualTelemetryPage';
import ResearchView from './pages/ResearchView';
import DeveloperTools from './pages/DeveloperTools';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import NotFound from './pages/NotFound';

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingFallback } from './components/common/LoadingFallback';
import { CookieConsent } from './components/common/CookieConsent';
import { AgriStoreProvider } from './context/AgriStore';

const CleanSlateGatekeeper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isCleanSlate = false;

  if (isCleanSlate && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary moduleName="AgriTwin Core">
      <AgriStoreProvider>
        <AuthProvider>
          <UserModeProvider>
            <Router>
              <Routes>
                {/* Public Authentication Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <Login />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicOnlyRoute>
                      <SignUp />
                    </PublicOnlyRoute>
                  }
                />

                {/* Public Legal & Informational Routes */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/404" element={<NotFound />} />

                {/* Protected Onboarding Wizard */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <GuidedOnboardingWizard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Main Application Layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <CleanSlateGatekeeper>
                        <AppLayout />
                      </CleanSlateGatekeeper>
                    </ProtectedRoute>
                  }
                >
                  {/* Operations & Monitoring Tier */}
                  <Route index element={<Dashboard />} />
                  <Route path="my-farms" element={<MyFarms />} />
                  <Route path="crop-health" element={<CropVision />} />
                  <Route path="virtual-farm" element={<VirtualFarm />} />
                  <Route path="advisor" element={<AIAdvisor />} />
                  <Route path="vision" element={<CropHealthAdvisor />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="history" element={<FieldLog />} />
                  <Route path="activity-log" element={<ActivityLog />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="control" element={<DeviceControl />} />
                  <Route path="camera" element={<CameraFeed />} />
                  <Route path="map" element={<MapView />} />

                  {/* Advanced & Administration Tier */}
                  <Route path="db-monitor" element={<AdminRoute><DatabaseMonitor /></AdminRoute>} />
                  <Route path="developer-tools" element={<AdminRoute><DeveloperTools /></AdminRoute>} />
                  <Route path="add-farmland" element={<AdminRoute><AddNewFarmlandPage /></AdminRoute>} />
                  <Route path="manual-telemetry" element={<AdminRoute><ManualTelemetryPage /></AdminRoute>} />
                  <Route path="research" element={<AdminRoute><ResearchView /></AdminRoute>} />
                  <Route path="what-if" element={<AdminRoute><WhatIfSimulator /></AdminRoute>} />
                  <Route path="sensors" element={<AdminRoute><MySensors /></AdminRoute>} />
                  <Route path="compare" element={<AdminRoute><CropComparison /></AdminRoute>} />
                  <Route path="farm-management/crops" element={<AdminRoute><Crops /></AdminRoute>} />
                  <Route path="farm-management/audit-log" element={<AdminRoute><FieldAuditLog /></AdminRoute>} />
                  <Route path="audit-log" element={<AdminRoute><FieldAuditLog /></AdminRoute>} />
                  <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                </Route>

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CookieConsent />
            </Router>
          </UserModeProvider>
        </AuthProvider>
      </AgriStoreProvider>
    </ErrorBoundary>
  );
}

export default App;
