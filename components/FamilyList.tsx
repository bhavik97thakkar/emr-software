
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  ExternalLink, 
  AlertCircle,
  Network,
  UsersRound,
  Database,
  Heart
} from 'lucide-react';
import { DB } from '../services/db';
import { Family, Patient } from '../types';

const RenameFamilyModal = ({ family, onSave, onCancel }: { family: Family, onSave: (name: string) => void, onCancel: () => void }) => {
  const [name, setName] = useState(family.name || '');
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Rename Family Group</h3>
            <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">Cancel</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Household Identity</label>
            <input className="w-full minimal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Sharma Household" autoFocus />
          </div>
          <button onClick={() => onSave(name)} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-100">Apply Changes</button>
        </div>
      </div>
    </div>
  );
};

const FamilyList = () => {
  const [query, setQuery] = useState('');
  const [families, setFamilies] = useState<Family[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [unlinkingMember, setUnlinkingMember] = useState<{ familyId: string, mobile: string, name: string } | null>(null);

  const loadData = async () => {
    const [f, p] = await Promise.all([DB.getFamilies(), DB.getPatients()]);
    setFamilies(f); setAllPatients(p);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('emr-db-update', loadData);
    return () => window.removeEventListener('emr-db-update', loadData);
  }, []);

  const handleRenameSave = async (name: string) => {
    if (editingFamily && name.trim()) {
      await DB.updateFamilyName(editingFamily.id, name.trim());
      setEditingFamily(null); loadData();
    }
  };

  const handleConfirmUnlink = async () => {
    if (unlinkingMember) {
      await DB.unlinkFamilyMember(unlinkingMember.mobile);
      setUnlinkingMember(null); loadData();
    }
  };

  const filtered = useMemo(() => families.filter(f => 
    (f.name?.toLowerCase().includes(query.toLowerCase())) ||
    (f.id.toLowerCase().includes(query.toLowerCase())) ||
    (f.members.some(m => m.mobile.includes(query)))
  ), [families, query]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Directory</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">{families.length} household networks identified</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input className="pl-9 pr-4 py-1.5 bg-slate-100 border-transparent rounded-lg text-xs w-full focus:bg-white focus:border-slate-200 outline-none transition-all font-medium" placeholder="Search households..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(f => (
          <div key={f.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:border-blue-400/50 transition-all duration-300">
             <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
                      <Users size={18} />
                   </div>
                   <div className="truncate">
                      <h3 className="text-sm font-bold text-slate-900 truncate tracking-tight">{f.name || 'Untitled Group'}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {f.id.toUpperCase()}</p>
                   </div>
                </div>
                <button onClick={() => setEditingFamily(f)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={14} /></button>
             </div>
             
             <div className="p-2 space-y-1 flex-1">
                {f.members.map(member => {
                   const profile = allPatients.find(p => p.mobile === member.mobile);
                   return (
                     <div key={member.mobile} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group/item">
                        <div className="flex items-center space-x-3 overflow-hidden">
                           <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${profile?.gender === 'Female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                              {profile?.name.charAt(0) || '?'}
                           </div>
                           <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate leading-none">{profile?.name || member.mobile}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center"><Heart size={8} className="mr-1 text-rose-400" /> {member.relationship}</p>
                           </div>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setUnlinkingMember({ familyId: f.id, mobile: member.mobile, name: profile?.name || member.mobile })} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
                           <Link to={`/patient/${member.mobile}`} className="p-1.5 text-slate-300 hover:text-blue-600"><ExternalLink size={12} /></Link>
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-3">
             <Users size={32} className="mx-auto text-slate-200" />
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No households matching your search</p>
          </div>
        )}
      </div>

      {editingFamily && <RenameFamilyModal family={editingFamily} onSave={handleRenameSave} onCancel={() => setEditingFamily(null)} />}
      {unlinkingMember && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto"><AlertCircle size={32} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Unlink Member?</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">Remove {unlinkingMember.name} from this family group?</p>
              </div>
              <div className="flex flex-col space-y-3">
                <button onClick={handleConfirmUnlink} className="w-full py-3 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Yes, Unlink</button>
                <button onClick={() => setUnlinkingMember(null)} className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FamilyList;
