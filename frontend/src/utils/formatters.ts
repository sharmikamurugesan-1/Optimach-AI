/**
 * Industrial Status Formatters & Helpers for FactoryMind (Minimal Purple + Soft Blue)
 */

export function getMachineStatusLabel(status: 'normal' | 'warning' | 'critical'): string {
  switch (status) {
    case 'normal':
      return 'Healthy';
    case 'warning':
      return 'Needs Attention';
    case 'critical':
      return 'Critical';
    default:
      return status;
  }
}

export function getStatusTheme(status: 'normal' | 'warning' | 'critical') {
  switch (status) {
    case 'normal':
      return {
        label: 'Healthy',
        badge: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
        dot: 'bg-[#059669]',
        cardBorder: 'border-l-[3px] border-l-[#059669]',
        text: 'text-[#059669]',
        subtleBg: 'bg-[#ECFDF5]',
        border: 'border-[#A7F3D0]',
      };
    case 'warning':
      return {
        label: 'Needs Attention',
        badge: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
        dot: 'bg-[#D97706]',
        cardBorder: 'border-l-[3px] border-l-[#D97706]',
        text: 'text-[#D97706]',
        subtleBg: 'bg-[#FFFBEB]',
        border: 'border-[#FDE68A]',
      };
    case 'critical':
      return {
        label: 'Critical',
        badge: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]',
        dot: 'bg-[#DC2626]',
        cardBorder: 'border-l-[3px] border-l-[#DC2626]',
        text: 'text-[#DC2626]',
        subtleBg: 'bg-[#FEF2F2]',
        border: 'border-[#FECACA]',
      };
    default:
      return {
        label: 'Unknown',
        badge: 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]',
        dot: 'bg-[#64748B]',
        cardBorder: 'border-l-[3px] border-l-[#64748B]',
        text: 'text-[#64748B]',
        subtleBg: 'bg-[#F8FAFC]',
        border: 'border-[#E2E8F0]',
      };
  }
}
