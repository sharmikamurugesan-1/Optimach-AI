import React, { useState } from 'react';
import { MaintenanceRecord, Machine } from '../types';
import { 
  Wrench, 
  Plus, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  X,
  FileText,
  AlertTriangle,
  ChevronRight,
  Filter,
  CheckSquare
} from 'lucide-react';

interface MaintenanceHistoryViewProps {
  records: MaintenanceRecord[];
  machines: Machine[];
  onAddRecord: (record: MaintenanceRecord) => void;
  onUpdateRecordStatus?: (id: string, newStatus: MaintenanceRecord['status'], completionNotes?: string) => void;
}

export const MaintenanceHistoryView: React.FC<MaintenanceHistoryViewProps> = ({
  records,
  machines,
  onAddRecord,
  onUpdateRecordStatus
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Assigned' | 'In Progress' | 'Completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'board'>('ledger');

  // Complete modal state
  const [newMachineId, setNewMachineId] = useState(machines[0]?.id || 'MACH-012');
  const [newActionType, setNewActionType] = useState('Bearing Replacement');
  const [newComponent, setNewComponent] = useState('Drive Bearings & Shaft');
  const [newTechnician, setNewTechnician] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('High');
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10));
  const [newNotes, setNewNotes] = useState('');
  const [newDuration, setNewDuration] = useState(3.5);
  const [newParts, setNewParts] = useState('');

  const filteredRecords = records.filter(r => {
    const matchesMachine = selectedMachineId === 'all' || r.machineId === selectedMachineId;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesMachine && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = 'id,machineId,date,component,technician,actionType,status,priority,dueDate,durationHours,issue,notes\n';
    const rows = filteredRecords.map(r => 
      `"${r.id}","${r.machineId}","${r.date}","${r.component}","${r.technician}","${r.actionType}","${r.status}","${r.priority || 'Medium'}","${r.dueDate || ''}",${r.durationHours},"${(r.issue || '').replace(/"/g, '""')}","${r.notes.replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRec: MaintenanceRecord = {
      id: `WO-${Math.floor(8850 + Math.random() * 1000)}`,
      machineId: newMachineId,
      date: new Date().toISOString().slice(0, 10),
      component: newComponent,
      technician: newTechnician.trim() || 'Assigned Field Tech',
      actionType: newActionType,
      issue: newIssue.trim() || 'Scheduled maintenance inspection',
      priority: newPriority,
      dueDate: newDueDate,
      notes: newNotes.trim() || 'Preventive inspection dispatched.',
      status: 'Open',
      durationHours: Number(newDuration),
      replacedParts: newParts.split(',').map(p => p.trim()).filter(Boolean)
    };
    onAddRecord(newRec);
    setIsModalOpen(false);
    setNewIssue('');
    setNewNotes('');
    setNewParts('');
  };

  return (
    <div className="flex flex-col gap-8 pb-16 text-[#242139]">
      {/* 1. View Header & Action Toolbar */}
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-subtle">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6D55E8] flex items-center gap-1.5 mb-1 font-mono">
            <FileText className="w-3.5 h-3.5 text-[#6D55E8]" /> Service Ledger & Work Orders
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#242139]">
            Maintenance Management
          </h1>
          <p className="text-xs sm:text-sm text-[#77738C] mt-1 max-w-2xl leading-relaxed">
            Convert machine warnings into actionable maintenance tickets. Track repair lifecycles from open dispatch to field completion and persistent ledger records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#6D55E8] hover:bg-[#8874F5] text-white transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Work Order
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-[#FAF9FF] hover:bg-[#F3F0FF] text-[#242139] transition-all flex items-center gap-2 border border-[#EAE5FF] shadow-sm"
          >
            <Download className="w-4 h-4 text-[#6D55E8]" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-[#FAF9FF] hover:bg-[#F3F0FF] text-[#242139] transition-all flex items-center gap-2 border border-[#EAE5FF] shadow-sm"
          >
            <Printer className="w-4 h-4 text-[#6D55E8]" /> Print Ledger
          </button>
        </div>
      </div>

      {/* 2. Filter & View Mode Strip */}
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-subtle">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#77738C] font-mono">Filter Machine:</span>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6D55E8]"
            >
              <option value="all">All Monitored Assets</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#FAF9FF] p-1 rounded-xl border border-[#EAE5FF]">
            {(['all', 'Open', 'Assigned', 'In Progress', 'Completed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                  statusFilter === st
                    ? 'bg-[#FFFFFF] text-[#6D55E8] font-bold shadow-sm border border-[#EAE5FF]'
                    : 'text-[#77738C] hover:text-[#242139]'
                }`}
              >
                {st === 'all' ? 'All Records' : st}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-[#77738C] font-mono">
          Showing <strong className="text-[#242139] font-bold">{filteredRecords.length}</strong> work orders
        </span>
      </div>

      {/* 3. Maintenance Records Ledger Table */}
      <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FF] text-[#77738C] uppercase text-[10px] tracking-wider border-b border-[#EAE5FF] font-mono">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Order ID & Date</th>
                <th className="py-3.5 px-5 font-semibold">Machine & Bay</th>
                <th className="py-3.5 px-5 font-semibold">Reported Issue & Priority</th>
                <th className="py-3.5 px-5 font-semibold">Assigned Technician</th>
                <th className="py-3.5 px-5 font-semibold">Component & Action</th>
                <th className="py-3.5 px-5 font-semibold">Status Lifecycle</th>
                <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5FF] bg-[#FFFFFF]">
              {filteredRecords.map(rec => {
                const machine = machines.find(m => m.id === rec.machineId);
                const isCompleted = rec.status === 'Completed';
                const isInProgress = rec.status === 'In Progress';
                const isOpen = rec.status === 'Open';

                return (
                  <tr key={rec.id} className="hover:bg-[#FAF9FF] transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-bold text-[#6D55E8] block font-mono">{rec.id}</span>
                      <span className="text-xs text-[#77738C] flex items-center gap-1.5 mt-0.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[#A29DB3]" /> {rec.date}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-xs">
                      <span className="font-semibold text-[#242139] block">{machine?.name || rec.machineId}</span>
                      <span className="text-[11px] text-[#77738C] font-mono block">{rec.machineId} · {machine?.location}</span>
                    </td>

                    <td className="py-4 px-5 max-w-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          rec.priority === 'Emergency' ? 'bg-[#FCEBED] text-[#DC5268]' :
                          rec.priority === 'High' ? 'bg-[#FEF6E9] text-[#D99117]' :
                          'bg-[#E8F7F2] text-[#159B70]'
                        }`}>
                          {rec.priority || 'Medium'}
                        </span>
                        {rec.dueDate && (
                          <span className="text-[10px] text-[#77738C] font-mono">Due: {rec.dueDate}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#242139] font-medium line-clamp-1">{rec.issue || rec.notes}</p>
                    </td>

                    <td className="py-4 px-5 text-[#77738C]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#6D55E8]" />
                        <span className="font-medium text-[#242139]">{rec.technician}</span>
                      </div>
                      <span className="text-[11px] text-[#77738C] block mt-0.5 font-mono">
                        Est: {rec.durationHours} hrs
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-semibold text-[#6D55E8] block">{rec.actionType}</span>
                      <span className="text-xs text-[#77738C]">{rec.component}</span>
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                        isCompleted ? 'bg-[#E8F7F2] text-[#159B70] border border-[#A3E3CD]' :
                        isInProgress ? 'bg-[#FEF6E9] text-[#D99117] border border-[#F7D59A]' :
                        'bg-[#EDF3FD] text-[#5685D8] border border-[#B8D1F7]'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {rec.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      {isOpen && onUpdateRecordStatus && (
                        <button
                          onClick={() => onUpdateRecordStatus(rec.id, 'In Progress')}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-[#FAF9FF] hover:bg-[#F3F0FF] text-[#6D55E8] border border-[#EAE5FF] font-semibold transition-all"
                        >
                          Start Work
                        </button>
                      )}
                      {isInProgress && onUpdateRecordStatus && (
                        <button
                          onClick={() => onUpdateRecordStatus(rec.id, 'Completed', 'Component serviced and verified.')}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-[#E8F7F2] hover:bg-[#D5EFE6] text-[#159B70] border border-[#A3E3CD] font-semibold transition-all"
                        >
                          Mark Done
                        </button>
                      )}
                      {isCompleted && (
                        <span className="text-[11px] text-[#159B70] font-semibold">Closed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Log Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#242139]/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EAE5FF] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-elevated flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#F3F0FF] pb-3">
              <h3 className="font-display font-bold text-[#242139] text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#6D55E8]" /> Log Maintenance Work Order
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#77738C] hover:text-[#242139]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewRecord} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-[#77738C] block mb-1 font-semibold font-mono">Select Target Machine:</label>
                <select
                  value={newMachineId}
                  onChange={(e) => setNewMachineId(e.target.value)}
                  className="w-full bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] rounded-xl p-2.5 focus:outline-none focus:border-[#6D55E8] font-semibold"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#77738C] block mb-1 font-semibold font-mono">Reported Mechanical Issue:</label>
                <input
                  type="text"
                  placeholder="e.g. High harmonic vibration spike on drive shaft bearing"
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  className="w-full bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] rounded-xl p-2.5 focus:outline-none focus:border-[#6D55E8]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#77738C] block mb-1 font-semibold font-mono">Action Type:</label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value)}
                    className="w-full bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] rounded-xl p-2.5 focus:outline-none focus:border-[#6D55E8]"
                  >
                    <option>Bearing Replacement</option>
                    <option>Seal Overhaul</option>
                    <option>Motor Rewind</option>
                    <option>Coolant Flush</option>
                    <option>Calibration & Lube</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#77738C] block mb-1 font-semibold font-mono">Priority:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] rounded-xl p-2.5 focus:outline-none focus:border-[#6D55E8]"
                  >
                    <option>Emergency</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#77738C] block mb-1 font-semibold font-mono">Assigned Technician:</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Chen"
                    value={newTechnician}
                    onChange={(e) => setNewTechnician(e.target.value)}
                    className="w-full bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] rounded-xl p-2.5 focus:outline-none focus:border-[#6D55E8]"
                  />
                </div>
                <div>
                  <label className="text-[#77738C] block mb-1 font-semibold font-mono">Target Due Date:</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] rounded-xl p-2.5 focus:outline-none focus:border-[#6D55E8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#77738C] block mb-1 font-semibold font-mono">Technician Work Instructions:</label>
                <textarea
                  rows={2}
                  placeholder="Specific maintenance instructions and safety checks..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#FAF9FF] border border-[#EAE5FF] text-[#242139] rounded-xl p-2.5 focus:outline-none focus:border-[#6D55E8]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#F3F0FF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF9FF] text-[#77738C] hover:bg-[#F3F0FF] hover:text-[#242139] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6D55E8] hover:bg-[#8874F5] text-white font-semibold shadow-sm"
                >
                  Save & Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
