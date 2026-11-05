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
      className={`bg-gradient-to-b from-[#221040] via-[#1A0B32] to-[#140827] border-r border-[#2D1654] text-white flex flex-col justify-between transition-all duration-300 z-30 flex-shrink-0 relative shadow-xl ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#2D1654]/80">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#9333EA] flex items-center justify-center shadow-md shadow-[#7C3AED]/30 text-white">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-base tracking-tight text-white block leading-none">
                  Optimach-AI
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#3B1F6E] text-[#D8B4FE] rounded border border-[#582D9E]">
                  EPMS
                </span>
              </div>
              <span className="text-[10px] text-[#A78BFA] font-medium tracking-wide block mt-0.5">
                Industrial Intelligence
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#9333EA] flex items-center justify-center mx-auto shadow-md text-white">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-1 rounded-md text-[#A78BFA] hover:text-white hover:bg-white/10 transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Menu Items */}
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-light-scrollbar">
        <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-[#C4B5FD]/60 font-mono">
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
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-semibold shadow-lg shadow-[#7C3AED]/30 ring-1 ring-[#A78BFA]/50'
                  : 'text-[#DDD6FE]/80 hover:text-white hover:bg-white/10'
              } ${collapsed ? 'justify-center px-0' : 'justify-between'}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-white' : 'text-[#A78BFA] group-hover:text-white'
                }`} />
                {!collapsed && <span className="text-[13px]">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  item.badge === 'Live'
                    ? 'bg-[#2563EB] text-white border border-[#3B82F6]'
                    : 'bg-[#DC2626] text-white border border-[#EF4444]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subtle Bottom System Status & Settings Button */}
      <div className="p-3.5 border-t border-[#2D1654]/80 text-xs text-[#DDD6FE]/70">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[11px] font-medium text-[#EDE9FE]">Gateway Online</span>
            </div>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1 rounded-lg hover:bg-white/10 text-[#A78BFA] hover:text-white transition-colors"
                title="System Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center p-1 rounded-lg hover:bg-white/10 text-[#A78BFA] hover:text-white transition-colors"
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
  // Completely removed per user request: "remove everthing from header"
  return null;
};
