
import React, { useState, useEffect, useMemo } from 'react';
import { DispatchEntry, DispatchStatus, MOCK_PARTIES, ChallanEntry } from '../types';
import { Plus, RotateCcw, CheckCircle2, Trash2, Send, Ruler, User, Package, Scale, Pencil, Save, X, ScrollText, Receipt, AlertCircle, Copy, Search, Scissors, Factory } from 'lucide-react';
import { ChallanView } from './Challan';

interface DispatchEntryProps {
  entries: DispatchEntry[];
  onAddEntry: (entry: Omit<DispatchEntry, 'id' | 'timestamp'>) => Promise<void> | void;
  onUpdateEntry: (id: string, updates: Partial<DispatchEntry>) => Promise<void> | void;
  onDeleteEntry: (id: string) => Promise<void> | void;
  onBulkDelete: (ids: string[]) => void;
  onBulkStatusUpdate: (ids: string[], status: DispatchStatus) => void;
  
  // Challan props
  challanData?: ChallanEntry[];
  onAddChallan?: (entry: any) => Promise<void> | void;
  onUpdateChallan?: (id: string, entry: any) => Promise<void> | void;
  onDeleteChallan?: (id: string) => Promise<void> | void;
}

export const DispatchEntryView: React.FC<DispatchEntryProps> = ({ 
    entries, onAddEntry, onUpdateEntry, onDeleteEntry,
    challanData = [], onAddChallan, onUpdateChallan, onDeleteChallan
}) => {
  // --- Tab State ---
  const [activeTab, setActiveTab] = useState<'dispatch' | 'challan'>('dispatch');
  const [entryType, setEntryType] = useState<'standard' | 'slitting' | 'production'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Dispatch State ---
  const [formData, setFormData] = useState({
    partyName: '',
    size: '',
    weight: '', // Net Weight
    grossWeight: '',
    coreWeight: '',
    productionWeight: '',
    pcs: '',
    meter: '',
    bundle: '',
    joint: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as DispatchStatus
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableParties, setAvailableParties] = useState<string[]>(MOCK_PARTIES);
  const [newPartyName, setNewPartyName] = useState('');
  const [showAddParty, setShowAddParty] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Effects ---
  useEffect(() => {
      const saved = localStorage.getItem('custom_parties');
      if (saved) {
          setAvailableParties([...MOCK_PARTIES, ...JSON.parse(saved)]);
      }
  }, []);

  // Auto calculate Net Weight
  useEffect(() => {
      if (formData.grossWeight && formData.coreWeight) {
          const g = parseFloat(formData.grossWeight) || 0;
          const c = parseFloat(formData.coreWeight) || 0;
          if (g > c) {
              setFormData(prev => ({ ...prev, weight: (g - c).toFixed(3) }));
          }
      }
  }, [formData.grossWeight, formData.coreWeight]);

  // --- Handlers ---
  const handleAddParty = () => {
      if (newPartyName.trim()) {
          const updatedParties = Array.from(new Set([...availableParties, newPartyName.trim()]));
          setAvailableParties(updatedParties);
          const custom = updatedParties.filter(p => !MOCK_PARTIES.includes(p));
          localStorage.setItem('custom_parties', JSON.stringify(custom));
          setFormData(prev => ({ ...prev, partyName: newPartyName.trim() }));
          setNewPartyName('');
          setShowAddParty(false);
      }
  };

  const handleEditClick = (entry: DispatchEntry) => {
      setEditingId(entry.id);
      setFormData({
          partyName: entry.partyName,
          size: entry.size,
          weight: entry.weight.toString(),
          grossWeight: entry.grossWeight ? entry.grossWeight.toString() : '',
          coreWeight: entry.coreWeight ? entry.coreWeight.toString() : '',
          productionWeight: entry.productionWeight ? entry.productionWeight.toString() : '',
          pcs: entry.pcs ? entry.pcs.toString() : '',
          meter: entry.meter ? entry.meter.toString() : '',
          bundle: entry.bundle ? entry.bundle.toString() : '',
          joint: entry.joint ? entry.joint.toString() : '',
          date: entry.date,
          status: entry.status
      });
      
      // Auto-detect type based on filled fields
      if (entry.joint !== undefined || (entry.meter && !entry.bundle)) {
          setEntryType('production');
      } else if (entry.coreWeight !== undefined) {
          setEntryType('slitting');
      } else {
          setEntryType('standard');
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const duplicateEntry = (entry: DispatchEntry) => {
      setFormData({
          partyName: entry.partyName,
          size: entry.size,
          weight: '', // Clear weight for new entry
          grossWeight: '',
          coreWeight: '',
          productionWeight: '',
          pcs: entry.pcs ? entry.pcs.toString() : '',
          meter: entry.meter ? entry.meter.toString() : '',
          bundle: entry.bundle ? entry.bundle.toString() : '',
          joint: '',
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setNotification({ type: 'success', message: "Details duplicated. Enter weight to save." });
      setTimeout(() => setNotification(null), 3000);
  };

  const cancelEdit = () => {
      setEditingId(null);
      setFormData(prev => ({
          ...prev,
          partyName: '',
          size: '',
          weight: '',
          grossWeight: '',
          coreWeight: '',
          productionWeight: '',
          pcs: '',
          meter: '',
          bundle: '',
          joint: '',
          status: 'pending'
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyName || !formData.size) {
      setNotification({ type: 'error', message: "Party & Size required" });
      return;
    }
    const weight = parseFloat(formData.weight) || 0;
    const bundle = parseInt(formData.bundle) || 0;
    const pcs = parseFloat(formData.pcs) || 0;

    if (formData.status === 'completed' && (weight <= 0)) {
        setNotification({ type: 'error', message: "Net Weight is required" });
        return;
    }

    const entryData: any = {
      date: formData.date,
      partyName: formData.partyName,
      size: formData.size,
      weight,
      pcs,
      bundle,
      status: formData.status
    };

    // Optional fields
    if (formData.grossWeight) entryData.grossWeight = parseFloat(formData.grossWeight);
    if (formData.coreWeight) entryData.coreWeight = parseFloat(formData.coreWeight);
    if (formData.meter) entryData.meter = parseFloat(formData.meter);
    if (formData.joint) entryData.joint = parseInt(formData.joint);
    if (formData.productionWeight) entryData.productionWeight = parseFloat(formData.productionWeight);

    setIsSubmitting(true);
    try {
        if (editingId) {
            await onUpdateEntry(editingId, entryData);
            setNotification({ type: 'success', message: "Updated successfully" });
            setEditingId(null);
        } else {
            await onAddEntry(entryData);
            setNotification({ type: 'success', message: "Added successfully" });
        }
        
        // Reset form partially
        setFormData(prev => ({
            ...prev,
            weight: '',
            grossWeight: '',
            coreWeight: '',
            productionWeight: '',
            // Keep party/size/bundle/pcs for faster data entry as per "Auto-fill for repeat challans"
            status: 'pending'
        }));
    } catch (error: any) {
        console.error("Save failed:", error);
        setNotification({ type: 'error', message: "Save Failed" });
    } finally {
        setIsSubmitting(false);
        setTimeout(() => setNotification(null), 3000);
    }
  };

  // Bulk WhatsApp Function
  const sendBulkWhatsApp = (items: DispatchEntry[]) => {
    if (items.length === 0) return;
    const firstItem = items[0];
    
    let text = `*Update - ${firstItem.date}*%0A*Party:* ${firstItem.partyName}%0A%0A`;
    let totalWt = 0;
    let totalBdl = 0;

    items.forEach(item => {
        const wt = item.weight.toFixed(3);
        const detail = item.grossWeight ? `(Gross: ${item.grossWeight} | Core: ${item.coreWeight})` : '';
        text += `• ${item.size} ${detail}: ${wt} kg | ${item.bundle} Pkg%0A`;
        totalWt += item.weight;
        totalBdl += item.bundle;
    });

    text += `%0A*Total Net Weight:* ${totalWt.toFixed(3)} kg%0A*Total Bundles:* ${totalBdl}`;
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const isMMSize = formData.size.toLowerCase().includes('mm');
  
  // Grouping Logic for Job List
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const filteredEntries = sortedEntries.filter(e => 
      e.partyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.size.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const groupedEntries = useMemo(() => {
      const groups = new Map<string, DispatchEntry[]>();
      filteredEntries.forEach(entry => {
          const key = `${entry.date}|${entry.partyName}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)?.push(entry);
      });
      return Array.from(groups.entries());
  }, [filteredEntries]);

  if (activeTab === 'challan' && onAddChallan && onDeleteChallan) {
      return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
             <div className="flex justify-center mb-6">
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex">
                    <button onClick={() => setActiveTab('dispatch')} className="px-6 py-2.5 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all">Job Entry</button>
                    <button onClick={() => setActiveTab('challan')} className="px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl shadow-md transition-all">Transaction Book</button>
                </div>
            </div>
            <ChallanView data={challanData} onAdd={onAddChallan} onUpdate={onUpdateChallan} onDelete={onDeleteChallan} />
        </div>
      );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
        {notification && (
            <div className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-5 border ${notification.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                <span className="font-bold text-base">{notification.message}</span>
            </div>
        )}

        {/* Tab Switcher (Mobile/Top) */}
        <div className="lg:col-span-12 flex justify-center">
             <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex">
                <button onClick={() => setActiveTab('dispatch')} className="px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl shadow-md flex items-center gap-2 transition-all">
                    <ScrollText className="w-4 h-4" /> Job Entry
                </button>
                <button onClick={() => setActiveTab('challan')} className="px-6 py-2.5 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 flex items-center gap-2 transition-all">
                    <Receipt className="w-4 h-4" /> Transaction Book
                </button>
             </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
             <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden">
                 {/* Decorative */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                 
                 <div className="flex justify-between items-center mb-8 relative z-10">
                     <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingId ? 'Edit Job' : 'New Entry'}</h3>
                     <button onClick={() => setShowAddParty(!showAddParty)} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100">+ Add Party</button>
                 </div>

                 {showAddParty && (
                     <div className="bg-slate-50 p-4 rounded-2xl mb-6 flex gap-2 border border-slate-200 animate-in slide-in-from-top-2">
                         <input type="text" value={newPartyName} onChange={e => setNewPartyName(e.target.value)} placeholder="Enter New Party Name" className="flex-1 bg-white px-4 py-2.5 rounded-xl text-sm font-semibold outline-none border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
                         <button onClick={handleAddParty} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700">Save</button>
                     </div>
                 )}

                 <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                     
                     {/* Entry Type Toggle */}
                     <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                         <button type="button" onClick={() => setEntryType('standard')} className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${entryType === 'standard' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Dispatch</button>
                         <button type="button" onClick={() => setEntryType('slitting')} className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${entryType === 'slitting' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Slitting</button>
                         <button type="button" onClick={() => setEntryType('production')} className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${entryType === 'production' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Production</button>
                     </div>

                     {/* Date & Party */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block group-focus-within:text-indigo-500 transition-colors">Date</label>
                           <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/5 transition-all" />
                        </div>
                        <div className="group">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block group-focus-within:text-indigo-500 transition-colors">Party</label>
                           <div className="relative">
                               <input list="parties" name="partyName" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} placeholder="Select" className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/5 transition-all" />
                               <datalist id="parties">{availableParties.map(p => <option key={p} value={p} />)}</datalist>
                           </div>
                        </div>
                     </div>
                     
                     {/* Size */}
                     <div className="group">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block group-focus-within:text-indigo-500 transition-colors">Material Size</label>
                         <div className="relative">
                             <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                             <input type="text" name="size" value={formData.size} onChange={e => {
                                 const val = e.target.value;
                                 setFormData(prev => ({ ...prev, size: val, pcs: val.toLowerCase().includes('mm') ? prev.bundle.toString() : prev.pcs }));
                             }} placeholder="e.g. 12mm x 500" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/5 transition-all" />
                         </div>
                     </div>

                     {/* Dynamic Fields based on Type */}
                     <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-4">
                        
                        {/* Slitting & Production Specifics */}
                        {(entryType === 'slitting' || entryType === 'production') && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Gross Wt</label>
                                    <input type="number" step="0.001" placeholder="0.000" value={formData.grossWeight} onChange={e => setFormData({...formData, grossWeight: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all" />
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Core Wt</label>
                                    <input type="number" step="0.001" placeholder="0.000" value={formData.coreWeight} onChange={e => setFormData({...formData, coreWeight: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all" />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                             <div className="group">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                     {entryType === 'production' ? 'Joint' : 'Bundles/Rolls'}
                                 </label>
                                 <div className="relative">
                                    {entryType === 'production' ? (
                                        <input type="number" value={formData.joint} onChange={e => setFormData({...formData, joint: e.target.value})} className="w-full pl-3 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all" placeholder="0" />
                                    ) : (
                                        <>
                                            <Package className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                                            <input type="number" name="bundle" value={formData.bundle} onChange={e => {
                                                const val = e.target.value;
                                                setFormData(prev => ({ ...prev, bundle: val, pcs: isMMSize ? val : prev.pcs }));
                                            }} className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all" placeholder="0" />
                                        </>
                                    )}
                                 </div>
                             </div>
                             
                             <div className="group">
                                 <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 block">Net Weight</label>
                                 <div className="relative">
                                    <Scale className="absolute left-3 top-3 w-4 h-4 text-indigo-300" />
                                    <input type="number" step="0.001" name="weight" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full pl-10 px-3 py-3 bg-indigo-50/50 border border-indigo-100 text-indigo-700 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder-indigo-300" placeholder="0.000" />
                                 </div>
                             </div>
                        </div>

                        {/* Extra Dimensions */}
                        {!isMMSize && entryType === 'standard' && (
                            <div className="animate-in fade-in">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Total Pcs</label>
                                <input type="number" name="pcs" value={formData.pcs} onChange={e => setFormData({...formData, pcs: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="0" />
                            </div>
                        )}
                        
                        {(entryType === 'slitting' || entryType === 'production') && (
                             <div className="animate-in fade-in">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Meter</label>
                                <input type="number" value={formData.meter} onChange={e => setFormData({...formData, meter: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="0" />
                            </div>
                        )}
                     </div>

                     {/* Status Selection */}
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Status</label>
                        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
                             {['pending', 'running', 'completed'].map(s => (
                                 <button 
                                      key={s} 
                                      type="button" 
                                      onClick={() => setFormData({...formData, status: s as DispatchStatus})}
                                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${formData.status === s ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                                 >
                                     {s}
                                 </button>
                             ))}
                        </div>
                     </div>

                     <div className="flex gap-3 pt-4 border-t border-slate-100">
                         {editingId ? (
                             <button type="button" onClick={cancelEdit} className="p-4 text-slate-500 hover:bg-slate-100 rounded-2xl bg-white border border-slate-200 transition-colors"><X className="w-5 h-5" /></button>
                         ) : (
                             <button type="button" onClick={() => setFormData({partyName: '', size: '', weight: '', grossWeight: '', coreWeight: '', productionWeight: '', pcs: '', meter: '', joint: '', bundle: '', date: new Date().toISOString().split('T')[0], status: 'pending'})} className="p-4 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 rounded-2xl transition-colors" title="Reset Form"><RotateCcw className="w-5 h-5" /></button>
                         )}
                         
                         <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-300 hover:shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                             {isSubmitting ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : (editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)} 
                             {editingId ? 'Update Job' : 'Add Entry'}
                         </button>
                     </div>
                 </form>
             </div>
        </div>

        {/* List Section - Grouped */}
        <div className="lg:col-span-7 xl:col-span-8 h-full flex flex-col">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                 <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Active Jobs</h3>
                    <span className="bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{filteredEntries.length}</span>
                 </div>
                 
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                 </div>
             </div>
             
             <div className="space-y-6 pb-10">
                 {groupedEntries.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 opacity-60">
                         <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <Factory className="w-8 h-8 text-slate-400" />
                         </div>
                         <p className="text-slate-500 font-bold">No active jobs found.</p>
                         <p className="text-xs text-slate-400 mt-1">Add a new entry to get started.</p>
                     </div>
                 ) : (
                     groupedEntries.map(([key, items]) => {
                         const [date, party] = key.split('|');
                         const totalBundles = items.reduce((sum, item) => sum + (item.bundle || 0), 0);
                         const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);

                         return (
                             <div key={key} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow duration-300">
                                 <div className="bg-slate-50/80 backdrop-blur px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
                                      <div className="flex items-center gap-3">
                                          <div className="text-[10px] font-black bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-500 shadow-sm">{date}</div>
                                          <h4 className="font-bold text-slate-800 text-sm md:text-base">{party}</h4>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <div className="flex gap-2 text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                                              <span>{totalBundles} pkg</span>
                                              <span className="text-slate-300">|</span>
                                              <span className="text-indigo-600">{totalWeight.toFixed(2)} kg</span>
                                          </div>
                                          <button 
                                              onClick={() => sendBulkWhatsApp(items)} 
                                              className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                                              title="Send WhatsApp"
                                          >
                                              <Send className="w-4 h-4" />
                                          </button>
                                      </div>
                                 </div>
                                 
                                 <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                     {items.map(entry => {
                                         const isSlitting = entry.coreWeight !== undefined;
                                         const isProduction = entry.joint !== undefined;

                                         return (
                                            <div key={entry.id} className={`relative p-4 rounded-xl border transition-all flex flex-col gap-3 group/card ${editingId === entry.id ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50'}`}>
                                                
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800 leading-tight">{entry.size}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                            {isSlitting ? 'Slitting' : isProduction ? 'Production' : 'Dispatch'}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-wide ${
                                                        entry.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                                        entry.status === 'running' ? 'bg-blue-100 text-blue-700' : 
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {entry.status}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 mt-1">
                                                    <div className="bg-slate-50 p-2 rounded-lg">
                                                       <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">{isProduction ? 'Joints' : 'Packages'}</span>
                                                       <span className="font-bold text-slate-700 text-sm">{isProduction ? entry.joint : entry.bundle} <span className="text-[10px] text-slate-400 font-normal">{isProduction ? '' : 'pkg'}</span></span>
                                                    </div>
                                                    <div className="bg-indigo-50 p-2 rounded-lg">
                                                       <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-0.5">Net Weight</span>
                                                       <span className="font-bold text-indigo-700 text-sm">{entry.weight.toFixed(3)} kg</span>
                                                    </div>
                                                    
                                                    {/* Detail Row */}
                                                    {(entry.grossWeight || entry.meter) && (
                                                        <div className="col-span-2 flex gap-2 pt-1 border-t border-slate-100 mt-1">
                                                            {entry.grossWeight && (
                                                                <div className="text-[10px] text-slate-500">
                                                                    <span className="font-bold">G:</span> {entry.grossWeight}
                                                                </div>
                                                            )}
                                                            {entry.coreWeight && (
                                                                <div className="text-[10px] text-slate-500">
                                                                    <span className="font-bold">C:</span> {entry.coreWeight}
                                                                </div>
                                                            )}
                                                            {entry.meter && (
                                                                <div className="text-[10px] text-slate-500">
                                                                    <span className="font-bold">M:</span> {entry.meter}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-lg p-1 shadow-sm border border-slate-100">
                                                     <button onClick={() => duplicateEntry(entry)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                                                     <button onClick={() => handleEditClick(entry)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                                                     <button onClick={() => onDeleteEntry(entry.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                         );
                                     })}
                                 </div>
                             </div>
                         );
                     })
                 )}
             </div>
        </div>
    </div>
  );
};
