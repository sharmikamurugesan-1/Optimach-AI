import React from 'react';
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
  Zap
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
      className={`bg-[#211044] border-r border-[#2E1854] flex flex-col justify-between transition-all duration-300 z-30 flex-shrink-0 relative shadow-xl select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#2E1854]/80">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7950E8] to-[#9258F5] flex items-center justify-center shadow-md text-white flex-shrink-0">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                  Optimach-AI
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#3B1F75] text-[#D8B4FE] rounded border border-[#6D28D9]/50">
                  EPMS
                </span>
              </div>
              <span className="text-[10px] text-[#A39BC2] font-medium tracking-wide block mt-1">
                Industrial Intelligence
              </span>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7950E8] to-[#9258F5] flex items-center justify-center mx-auto shadow-md text-white">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-[#A39BC2] hover:text-white hover:bg-[#321763] transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Menu Items */}
      <div className="p-3.5 space-y-1.5 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-[#7E6F9F] font-mono">
          {!collapsed ? 'NAVIGATION' : '•••'}
        </div>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-[#7950E8] to-[#9258F5] text-white shadow-md shadow-[#7950E8]/25'
                  : 'text-[#A39BC2] hover:text-white hover:bg-[#2F1759]'
              } ${collapsed ? 'justify-center px-0' : 'justify-between'}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-white' : 'text-[#A39BC2] group-hover:text-white'
                }`} />
                {!collapsed && <span className="text-[13px]">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  item.badge === 'Live'
                    ? 'bg-[#1E293B] text-[#38BDF8] border border-[#0284C7]/40'
                    : 'bg-[#5B1218] text-[#FCA5A5] border border-[#DC2626]/40'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status & Settings */}
      <div className="p-3.5 border-t border-[#2E1854]/80 text-xs text-[#A39BC2]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
              <span className="text-[11px] font-medium text-[#D1CDE5]">Gateway Online</span>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg hover:bg-[#321763] text-[#A39BC2] hover:text-white transition-colors"
                title="System Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-[#321763] text-[#A39BC2] hover:text-white transition-colors"
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

export const TopHeader: React.FC<TopHeaderProps> = () => {
  return null;
};
