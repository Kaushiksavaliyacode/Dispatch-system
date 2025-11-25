
import React, { useState, useMemo } from 'react';
import { ChallanEntry, ChallanItem, MOCK_PARTIES, PaymentType, ChallanType } from '../types';
import { Plus, Trash2, Receipt, Save, X, CheckCircle2, Clock, Pencil, Search, RefreshCw, AlertCircle, Printer, ScanLine, Calculator } from 'lucide-react';

interface ChallanProps {
  data: ChallanEntry[];
  onAdd?: (entry: Omit<ChallanEntry, 'id' | 'timestamp'>) => Promise<void> | void;
  onUpdate?: (id: string, entry: Partial<ChallanEntry>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  isAdmin?: boolean;
}

type FilterRange = 'today' | '7days' | '30days' | 'custom';
type EntryMode = 'unpaid' | 'cash' | 'job';
type SummaryFilter = 'all' | 'cash' | 'unpaid';

export const ChallanView: React.FC<ChallanProps> = ({ data, onAdd, onUpdate, onDelete, isAdmin = false }) => {
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [challanNo, setChallanNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyName, setPartyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simplified Entry Mode
  const [entryMode, setEntryMode] = useState<EntryMode>('unpaid');
  const [items, setItems] = useState<ChallanItem[]>([]);
  
  // Item Entry State
  const [itemSize, setItemSize] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  // View/Filter State
  const [filterRange, setFilterRange] = useState<FilterRange>('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>('all');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Derived State ---
  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  const summary = useMemo(() => {
      return data.reduce((acc, curr) => {
          if (curr.paymentType === 'cash') {
              return { ...acc, received: acc.received + curr.grandTotal };
          }
          if (curr.paymentType === 'credit' && curr.challanType !== 'jobwork') {
              return { ...acc, receivable: acc.receivable + curr.grandTotal };
          }
          return acc;
      }, { receivable: 0, received: 0 });
  }, [data]);

  const filteredData = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);

      return data.filter(d => {
          if (searchTerm && !d.challanNo.toLowerCase().includes(searchTerm.toLowerCase()) && !d.partyName.toLowerCase().includes(searchTerm.toLowerCase())) {
              return false;
          }
          if (summaryFilter === 'cash' && d.paymentType !== 'cash') return false;
          if (summaryFilter === 'unpaid' && (d.paymentType !== 'credit' || d.challanType === 'jobwork')) return false;

          if (!searchTerm) {
              const entryDate = new Date(d.date);
              entryDate.setHours(0,0,0,0);
              
              if (filterRange === 'today') return entryDate.getTime() === today.getTime();
              if (filterRange === '7days') {
                  const sevenDaysAgo = new Date(today);
                  sevenDaysAgo.setDate(today.getDate() - 7);
                  return entryDate >= sevenDaysAgo && entryDate <= today;
              }
              if (filterRange === '30days') {
                  const thirtyDaysAgo = new Date(today);
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  return entryDate >= thirtyDaysAgo && entryDate <= today;
              }
              if (filterRange === 'custom') return d.date === customDate;
          }
          return true;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filterRange, customDate, searchTerm, summaryFilter]);

  // --- Handlers ---
  const addItem = () => {
      if (!itemSize || !itemWeight) return;
      if (entryMode !== 'job' && !itemPrice) return;

      const weight = parseFloat(itemWeight);
      const price = parseFloat(itemPrice) || 0;
      const newItem: ChallanItem = {
          id: crypto.randomUUID(),
          size: itemSize,
          weight,
          price,
          total: weight * price
      };
      setItems([...items, newItem]);
      setItemSize('');
      setItemWeight('');
      setItemPrice('');
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleEdit = (entry: ChallanEntry) => {
      setEditingId(entry.id);
      setChallanNo(entry.challanNo);
      setDate(entry.date);
      setPartyName(entry.partyName);
      setItems(entry.items);
      
      if (entry.paymentType === 'cash') {
          setEntryMode('cash');
      } else if (entry.challanType === 'jobwork') {
          setEntryMode('job');
      } else {
          setEntryMode('unpaid');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
      setEditingId(null);
      setChallanNo('');
      setItems([]);
      setPartyName('');
      setEntryMode('unpaid');
      setItemSize('');
      setItemWeight('');
      setItemPrice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!partyName || items.length === 0) {
          setErrorMsg("Party name and at least one item are required.");
          setTimeout(() => setErrorMsg(null), 3000);
          return;
      }
      
      let pType: PaymentType = 'credit';
      let cType: ChallanType = 'debit_note';

      if (entryMode === 'cash') {
          pType = 'cash';
          cType = 'debit_note';
      } else if (entryMode === 'job') {
          pType = 'credit';
          cType = 'jobwork';
      } else {
          pType = 'credit';
          cType = 'debit_note';
      }

      const entryData = {
          challanNo,
          date,
          partyName,
          paymentType: pType,
          challanType: cType,
          items,
          grandTotal
      };

      setIsSubmitting(true);
      setErrorMsg(null);
      
      try {
          if (editingId && onUpdate) {
              await onUpdate(editingId, entryData);
          } else if (onAdd) {
              await onAdd(entryData);
          }
          resetForm();
      } catch (e: any) {
          console.error("Error saving challan", e);
          setErrorMsg(e.message || 'Error saving transaction');
      } finally {
          setIsSubmitting(false);
      }
  };

  const toggleSummaryFilter = (filter: SummaryFilter) => {
      if (summaryFilter === filter) {
          setSummaryFilter('all');
      } else {
          setSummaryFilter(filter);
      }
  };

  return (
    <div className="w-full pb-20 space-y-6 font-inter animate-in fade-in duration-500">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
                onClick={() => toggleSummaryFilter('cash')}
                className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm flex items-center justify-between transition-all group ${
                    summaryFilter === 'cash' 
                    ? 'bg-emerald-500 border-emerald-600 text-white ring-2 ring-emerald-500/20' 
                    : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
            >
                <div className="text-left relative z-10">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${summaryFilter === 'cash' ? 'text-emerald-100' : 'text-emerald-600'}`}>Total Cash Received</p>
                    <h3 className={`text-3xl font-black mt-1 ${summaryFilter === 'cash' ? 'text-white' : 'text-emerald-900'}`}>
                        ₹{Math.floor(summary.received).toLocaleString()}
                    </h3>
                </div>
                <div className={`p-3 rounded-xl transition-colors ${summaryFilter === 'cash' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                    <CheckCircle2 className="w-6 h-6" />
                </div>
            </button>
            
            <button 
                onClick={() => toggleSummaryFilter('unpaid')}
                className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm flex items-center justify-between transition-all group ${
                    summaryFilter === 'unpaid' 
                    ? 'bg-amber-500 border-amber-600 text-white ring-2 ring-amber-500/20' 
                    : 'bg-white border-slate-200 hover:border-amber-300'
                }`}
            >
                <div className="text-left relative z-10">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${summaryFilter === 'unpaid' ? 'text-amber-100' : 'text-amber-600'}`}>Total Receivable</p>
                    <h3 className={`text-3xl font-black mt-1 ${summaryFilter === 'unpaid' ? 'text-white' : 'text-amber-900'}`}>
                        ₹{Math.floor(summary.receivable).toLocaleString()}
                    </h3>
                </div>
                <div className={`p-3 rounded-xl transition-colors ${summaryFilter === 'unpaid' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
                    <Clock className="w-6 h-6" />
                </div>
            </button>
        </div>

        {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold text-sm">{errorMsg}</span>
            </div>
        )}

        <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8`}>
            
            {/* Create Challan Form */}
            {!isAdmin && (
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden relative">
                        {editingId && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 z-10"></div>}
                        <div className="bg-white px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit Invoice' : 'New Invoice'}</h3>
                            </div>
                            {editingId && (
                                <button onClick={resetForm} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            {/* Type Selector */}
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <button type="button" onClick={() => setEntryMode('unpaid')} className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${entryMode === 'unpaid' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Credit</button>
                                <button type="button" onClick={() => setEntryMode('cash')} className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${entryMode === 'cash' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}>Cash</button>
                                <button type="button" onClick={() => setEntryMode('job')} className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${entryMode === 'job' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-amber-100' : 'text-slate-400 hover:text-slate-600'}`}>Job Work</button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Invoice No</label>
                                    <input type="text" value={challanNo} onChange={e => setChallanNo(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" placeholder="Auto" />
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" />
                                </div>
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Bill To</label>
                                <input list="parties" value={partyName} onChange={e => setPartyName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" placeholder="Select Party Name" />
                                <datalist id="parties">{MOCK_PARTIES.map(p => <option key={p} value={p} />)}</datalist>
                            </div>

                            {/* Item Builder */}
                            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Line Items</span>
                                    <div className="flex gap-2">
                                        <button type="button" className="text-slate-400 hover:text-slate-600"><ScanLine className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-5">
                                            <input placeholder="Item Size" value={itemSize} onChange={e => setItemSize(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none" />
                                        </div>
                                        <div className="col-span-3">
                                            <input type="number" placeholder="Wt (kg)" value={itemWeight} onChange={e => setItemWeight(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none" />
                                        </div>
                                        <div className="col-span-4 flex gap-2">
                                            {entryMode !== 'job' ? (
                                                <input type="number" placeholder="Rate" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none" />
                                            ) : (
                                                <div className="w-full flex items-center justify-center text-[10px] text-slate-400 font-bold bg-slate-100 rounded-lg border border-slate-200">NO RATE</div>
                                            )}
                                        </div>
                                    </div>
                                    <button type="button" onClick={addItem} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                        <Plus className="w-4 h-4" /> Add Item
                                    </button>
                                </div>

                                {items.length > 0 && (
                                    <div className="border-t border-slate-200 max-h-48 overflow-y-auto">
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center px-4 py-3 border-b border-slate-100 last:border-0 bg-white text-xs hover:bg-slate-50">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{item.size}</span>
                                                    <span className="text-[10px] text-slate-400">{item.weight} kg @ {item.price}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-slate-900">₹{Math.floor(item.total).toLocaleString()}</span>
                                                    <button type="button" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {entryMode !== 'job' && (
                                <div className="flex items-end justify-between pt-2">
                                    <div className="text-left">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</span>
                                        <div className="flex items-center gap-2 text-indigo-600">
                                            <Calculator className="w-4 h-4" />
                                            <span className="text-xs font-bold">Auto-calculated</span>
                                        </div>
                                    </div>
                                    <span className="text-3xl font-black text-slate-900 tracking-tight">₹{Math.floor(grandTotal).toLocaleString()}</span>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : <Save className="w-5 h-5" />} 
                                {editingId ? 'Update' : 'Generate'} Invoice
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* List View */}
            <div className={isAdmin ? "lg:col-span-1" : "lg:col-span-7 xl:col-span-8"}>
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white flex flex-col h-full min-h-[600px] overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                            <h3 className="text-lg font-black text-slate-800 whitespace-nowrap">Invoice History</h3>
                            <div className="relative w-full sm:w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search invoice or party..." 
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                            {summaryFilter !== 'all' && (
                                <button onClick={() => setSummaryFilter('all')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 whitespace-nowrap transition-colors">
                                    <RefreshCw className="w-3 h-3" /> Reset
                                </button>
                            )}
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                {['today', '7days', '30days'].map((r) => (
                                    <button 
                                        key={r}
                                        onClick={() => setFilterRange(r as FilterRange)} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterRange === r ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {r === 'today' ? 'Today' : r === '7days' ? 'Week' : 'Month'}
                                    </button>
                                ))}
                            </div>
                            <input type="date" value={customDate} onChange={(e) => { setCustomDate(e.target.value); setFilterRange('custom'); }} className="px-2 py-1.5 text-xs font-bold text-slate-600 outline-none bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Invoice</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Party</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center">
                                                <Search className="w-10 h-10 mb-2 opacity-20" />
                                                <p>No transactions found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((row) => {
                                        let bgClass = "bg-white hover:bg-slate-50";
                                        let textClass = "text-slate-600";
                                        let statusDot = "bg-slate-400";
                                        
                                        if (row.paymentType === 'cash') {
                                            statusDot = "bg-emerald-500";
                                        } else if (row.challanType === 'jobwork') {
                                            statusDot = "bg-amber-500";
                                        } else {
                                            statusDot = "bg-red-500";
                                        }

                                        return (
                                            <React.Fragment key={row.id}>
                                                <tr className={`group transition-all cursor-pointer ${bgClass}`} onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${statusDot}`}></div>
                                                            {row.challanNo || <span className="text-slate-300 italic">Auto</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{row.date}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.partyName}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-right text-slate-900">
                                                        {row.challanType === 'jobwork' ? <span className="text-xs text-slate-400 font-medium">JOB WORK</span> : `₹${Math.floor(row.grandTotal).toLocaleString()}`}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                                                            {!isAdmin && <button onClick={() => handleEdit(row)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>}
                                                            <button onClick={() => onDelete(row.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expandedRow === row.id && (
                                                    <tr className="bg-slate-50 shadow-inner">
                                                        <td colSpan={5} className="px-6 py-4">
                                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-3xl mx-auto shadow-sm">
                                                                <div className="flex items-center justify-between px-4 py-2 bg-slate-100/50 border-b border-slate-200">
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Item Details</span>
                                                                    <span className="text-[10px] font-bold text-slate-400">{row.items.length} items</span>
                                                                </div>
                                                                <table className="w-full text-left">
                                                                    <tbody>
                                                                        {row.items.map((item, idx) => (
                                                                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                                                                <td className="px-4 py-3 text-xs font-bold text-slate-700 w-1/3">{item.size}</td>
                                                                                <td className="px-4 py-3 text-xs font-medium text-slate-500 text-right">{item.weight} kg</td>
                                                                                <td className="px-4 py-3 text-xs font-medium text-slate-500 text-right">{item.price > 0 ? `@ ${item.price}` : '-'}</td>
                                                                                <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right">{item.total > 0 ? `₹${Math.floor(item.total)}` : '-'}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
