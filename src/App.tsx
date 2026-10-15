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
import SensorMappingAdmin from './pages/farm-management/SensorMappingAdmin';
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
import FirebaseDebugPage from './pages/FirebaseDebugPage';

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
                {/* Public Authentication & Debug Routes */}
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
                <Route path="/debug/firebase" element={<FirebaseDebugPage />} />


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
                  <Route index element={<ErrorBoundary moduleName="Dashboard"><Dashboard /></ErrorBoundary>} />
                  <Route path="my-farms" element={<ErrorBoundary moduleName="My Farms"><MyFarms /></ErrorBoundary>} />
                  <Route path="crop-health" element={<ErrorBoundary moduleName="Crop Health"><CropVision /></ErrorBoundary>} />
                  <Route path="virtual-farm" element={<ErrorBoundary moduleName="Virtual Farm Digital Twin"><VirtualFarm /></ErrorBoundary>} />
                  <Route path="advisor" element={<ErrorBoundary moduleName="AI Agronomic Advisor"><AIAdvisor /></ErrorBoundary>} />
                  <Route path="vision" element={<ErrorBoundary moduleName="Crop Health Vision"><CropHealthAdvisor /></ErrorBoundary>} />
                  <Route path="analytics" element={<ErrorBoundary moduleName="Telemetry Analytics"><Analytics /></ErrorBoundary>} />
                  <Route path="history" element={<ErrorBoundary moduleName="Field Log"><FieldLog /></ErrorBoundary>} />
                  <Route path="activity-log" element={<ErrorBoundary moduleName="Activity Log"><ActivityLog /></ErrorBoundary>} />
                  <Route path="alerts" element={<ErrorBoundary moduleName="Alerts Engine"><Alerts /></ErrorBoundary>} />
                  <Route path="control" element={<ErrorBoundary moduleName="Device Control"><DeviceControl /></ErrorBoundary>} />
                  <Route path="camera" element={<ErrorBoundary moduleName="Camera Feed"><CameraFeed /></ErrorBoundary>} />
                  <Route path="map" element={<ErrorBoundary moduleName="Farm GIS Map"><MapView /></ErrorBoundary>} />

                  {/* Advanced & Administration Tier */}
                  <Route path="db-monitor" element={<AdminRoute><ErrorBoundary moduleName="Database Monitor"><DatabaseMonitor /></ErrorBoundary></AdminRoute>} />
                  <Route path="developer-tools" element={<AdminRoute><ErrorBoundary moduleName="Developer Tools"><DeveloperTools /></ErrorBoundary></AdminRoute>} />
                  <Route path="add-farmland" element={<AdminRoute><ErrorBoundary moduleName="Add Farmland"><AddNewFarmlandPage /></ErrorBoundary></AdminRoute>} />
                  <Route path="manual-telemetry" element={<AdminRoute><ErrorBoundary moduleName="Manual Telemetry"><ManualTelemetryPage /></ErrorBoundary></AdminRoute>} />
                  <Route path="research" element={<AdminRoute><ErrorBoundary moduleName="Research View"><ResearchView /></ErrorBoundary></AdminRoute>} />
                  <Route path="what-if" element={<AdminRoute><ErrorBoundary moduleName="What-If Simulator"><WhatIfSimulator /></ErrorBoundary></AdminRoute>} />
                  <Route path="sensors" element={<AdminRoute><ErrorBoundary moduleName="Sensor Nodes Fleet"><MySensors /></ErrorBoundary></AdminRoute>} />
                  <Route path="compare" element={<AdminRoute><ErrorBoundary moduleName="Crop Comparison"><CropComparison /></ErrorBoundary></AdminRoute>} />
                  <Route path="farm-management/crops" element={<AdminRoute><ErrorBoundary moduleName="Crops Management"><Crops /></ErrorBoundary></AdminRoute>} />
                  <Route path="farm-management/sensor-mapping" element={<AdminRoute><ErrorBoundary moduleName="Sensor Mapping"><SensorMappingAdmin /></ErrorBoundary></AdminRoute>} />
                  <Route path="sensor-mapping" element={<AdminRoute><ErrorBoundary moduleName="Sensor Mapping"><SensorMappingAdmin /></ErrorBoundary></AdminRoute>} />
                  <Route path="farm-management/audit-log" element={<AdminRoute><ErrorBoundary moduleName="Audit Log"><FieldAuditLog /></ErrorBoundary></AdminRoute>} />
                  <Route path="audit-log" element={<AdminRoute><ErrorBoundary moduleName="Audit Log"><FieldAuditLog /></ErrorBoundary></AdminRoute>} />
                  <Route path="users" element={<AdminRoute><ErrorBoundary moduleName="User Management"><UserManagement /></ErrorBoundary></AdminRoute>} />
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
