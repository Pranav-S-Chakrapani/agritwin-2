import React from 'react';
import { ViewMode } from '../types';
import { LucideIcon, LayoutDashboard, Box, Camera, TrendingUp, Apple, Sprout, Activity, Bell, LogOut, Menu, X, Leaf } from 'lucide-react';

interface Props {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: ViewMode; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
  { id: 'twin', label: 'Digital Twin', icon: Box },
  { id: 'disease', label: 'Disease Detection', icon: Camera },
  { id: 'growth', label: 'Growth Analytics', icon: TrendingUp },
  { id: 'ripeness', label: 'Fruit Ripeness', icon: Apple },
  { id: 'yield', label: 'Yield Prediction', icon: Sprout },
  { id: 'sensors', label: 'Sensor Monitoring', icon: Activity },
  { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
];

export const Layout: React.FC<Props> = ({ currentView, onSelectView, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/80 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-14 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center space-x-3 text-emerald-600">
              <Leaf className="w-6 h-6" />
              <span className="font-bold text-lg text-slate-900">AgriTwin</span>
            </div>
            <button className="ml-auto lg:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User / Logout */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-500 hover:text-slate-700">
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-4 flex items-center space-x-2 text-emerald-600">
            <Leaf className="w-5 h-5" />
            <span className="font-bold text-slate-900">AgriTwin</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
