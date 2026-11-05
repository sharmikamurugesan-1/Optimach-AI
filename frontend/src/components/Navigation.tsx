import React, { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/backendApi';
import { 
  LayoutDashboard, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  Database, 
  Wrench, 
  GitCompare, 
  Settings, 
  ChevronLeft, 
  Zap,
  Bell,
  Building2,
  ChevronDown,
  X
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  activeAlertCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  activeAlertCount,
  collapsed,
  onToggleCollapse,
  onOpenSettings
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'machines', label: 'Machine Fleet', icon: Cpu, badge: null },
    { id: 'live', label: 'Live Monitoring', icon: Activity, badge: 'Live' },
    { id: 'predictions', label: 'Failure Predictions', icon: ShieldAlert, badge: activeAlertCount > 0 ? `${activeAlertCount}` : null },
    { id: 'datacheck', label: 'Data & Integrations', icon: Database, badge: null },
    { id: 'maintenance', label: 'Maintenance Management', icon: Wrench, badge: null },
    { id: 'comparison', label: 'Fleet Comparison', icon: GitCompare, badge: null },
  ];

  return (
    <aside
      className={`bg-[#FFFFFF] border-r border-[#EDE9FE] flex flex-col justify-between transition-all duration-300 z-30 flex-shrink-0 relative ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#EDE9FE]">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#9333EA] flex items-center justify-center shadow-sm text-white">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-base tracking-tight text-[#2E1065] block leading-none">
                  Optimach-AI
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded border border-[#BFDBFE]">
                  EPMS
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] font-medium tracking-wide block mt-0.5">
                Industrial Intelligence
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#9333EA] flex items-center justify-center mx-auto shadow-sm text-white">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-1 rounded-md text-[#64748B] hover:text-[#2E1065] hover:bg-[#F5F3FF] transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Menu Items */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto custom-light-scrollbar">
        <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-[#94A3B8] font-mono">
          {!collapsed ? 'Navigation' : '•••'}
        </div>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-[#F5F3FF] text-[#7C3AED] font-semibold shadow-xs ring-1 ring-[#DDD6FE]'
                  : 'text-[#64748B] hover:text-[#2E1065] hover:bg-[#FAF9FD]'
              } ${collapsed ? 'justify-center px-0' : 'justify-between'}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-[#7C3AED]' : 'text-[#64748B] group-hover:text-[#7C3AED]'
                }`} />
                {!collapsed && <span className="text-[13px]">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  item.badge === 'Live'
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                    : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subtle Bottom System Status & Settings Button */}
      <div className="p-3.5 border-t border-[#EDE9FE] text-xs text-[#64748B]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669] shadow-[0_0_6px_rgba(5,150,105,0.4)]" />
              <span className="text-[11px] font-medium text-[#2E1065]">Gateway Online</span>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1 rounded-lg hover:bg-[#F5F3FF] text-[#64748B] hover:text-[#7C3AED] transition-colors"
                title="System Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center p-1 rounded-lg hover:bg-[#F5F3FF] text-[#64748B] hover:text-[#7C3AED] transition-colors"
            title="System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

interface TopHeaderProps {
  activeView: string;
  activeAlertCount?: number;
  onOpenSettings?: () => void;
  onNavigate?: (view: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeView,
  activeAlertCount = 0,
  onNavigate
}) => {
  const [selectedPlant, setSelectedPlant] = useState('North Plant — Precision Bay');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{ online: boolean; totalModels?: number }>({
    online: false,
    totalModels: 8
  });

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const res = await checkBackendHealth();
      if (isMounted) {
        setBackendStatus({ online: res.status === 'online', totalModels: res.total_models || 8 });
      }
    };
    check();
    const interval = setInterval(check, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const viewLabels: Record<string, string> = {
    overview: 'Overview',
    machines: 'Machine Fleet',
    live: 'Live Monitoring',
    predictions: 'Failure Predictions',
    datacheck: 'Data & Integrations',
    maintenance: 'Maintenance Management',
    comparison: 'Fleet Comparison'
  };

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#EDE9FE] px-6 sm:px-8 flex items-center justify-between z-20 flex-shrink-0 shadow-xs">
      {/* Left: Plant Context & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div className="relative">
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="appearance-none bg-transparent hover:bg-[#FAF9FD] text-xs font-semibold text-[#2E1065] py-1 pl-2 pr-7 rounded-lg border border-transparent hover:border-[#EDE9FE] focus:outline-none focus:border-[#7C3AED] cursor-pointer transition-all"
            >
              <option value="North Plant — Precision Bay">North Plant — Precision Bay</option>
              <option value="South Facility — Heavy Press Line">South Facility — Heavy Press Line</option>
              <option value="East Utility Hub — Compressor Depot">East Utility Hub — Compressor Depot</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <span className="text-[#EDE9FE] hidden sm:inline">|</span>

        <span className="text-xs font-medium text-[#64748B] hidden sm:inline">
          {viewLabels[activeView] || 'Overview'}
        </span>
      </div>

      {/* Right: Data Connection Status, Notifications, & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Backend / Edge Gateway Pill */}
        {backendStatus.online ? (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-medium font-mono shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            <span>Flask ML Backend: Connected ({backendStatus.totalModels} Models)</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-medium font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            <span>Edge Gateway: 1.0 Hz Active</span>
          </div>
        )}

        {/* Notifications Control */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2E1065] hover:bg-[#F5F3FF] border border-[#EDE9FE] transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white text-[9px] font-bold flex items-center justify-center">
                {activeAlertCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl shadow-card p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#EDE9FE] mb-3">
                <span className="text-xs font-bold text-[#2E1065]">Active Alerts</span>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-[#64748B] hover:text-[#2E1065]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-light-scrollbar">
                <div 
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    onNavigate?.('predictions');
                  }}
                  className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs cursor-pointer hover:bg-[#FEE2E2] transition-all"
                >
                  <div className="flex items-center justify-between text-[#DC2626] font-bold">
                    <span>MACH-012 Vibration Alert</span>
                    <span className="text-[10px]">12m ago</span>
                  </div>
                  <p className="text-[#64748B] mt-0.5 text-[11px]">
                    Bearing harmonic resonance exceeds threshold (+2.6 sigma).
                  </p>
                </div>

                <div 
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    onNavigate?.('predictions');
                  }}
                  className="p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs cursor-pointer hover:bg-[#FEF3C7] transition-all"
                >
                  <div className="flex items-center justify-between text-[#D97706] font-bold">
                    <span>MACH-024 Hydraulic Pressure</span>
                    <span className="text-[10px]">1h ago</span>
                  </div>
                  <p className="text-[#64748B] mt-0.5 text-[11px]">
                    Pressure modulation oscillation detected on manifold.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsNotificationsOpen(false);
                  onNavigate?.('predictions');
                }}
                className="w-full mt-3 py-1.5 rounded-lg bg-[#F5F3FF] text-[#7C3AED] text-xs font-semibold hover:bg-[#EDE9FE] transition-colors"
              >
                View Failure Predictions
              </button>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#EDE9FE]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            AC
          </div>
          <div className="hidden lg:block text-left">
            <span className="text-xs font-bold text-[#2E1065] block leading-tight">
              Alex Carter
            </span>
            <span className="text-[10px] text-[#64748B] block">
              Reliability Lead
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
