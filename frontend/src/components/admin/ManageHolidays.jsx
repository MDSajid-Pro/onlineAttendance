import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { 
  CalendarDays, 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  X, 
  Search,
  Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const initialFormData = {
  title: '',
  startDate: '',
  endDate: '',
  type: 'Institutional',
  description: ''
};

const ManageHolidays = () => {
  const { axios } = useAppContext();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/holidays');
      setHolidays(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title,
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      type: item.type || 'Institutional',
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        await axios.put(`/api/holidays/${editingId}`, formData);
        toast.success('Holiday updated successfully');
      } else {
        await axios.post('/api/holidays', formData);
        toast.success('Holiday created successfully');
      }
      handleCloseModal();
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;

    try {
      await axios.delete(`/api/holidays/${id}`);
      toast.success('Holiday removed successfully');
      setHolidays((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    }
  };

  const filteredHolidays = holidays.filter((h) => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'National':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Gazetted':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Academic':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Restricted':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d121f] p-6 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <CalendarDays className="text-indigo-400" size={22} />
            Academic & Institutional Calendar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure academic recesses, public observances, and scheduled institute breaks.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer w-fit"
        >
          <Plus size={16} /> Add Holiday
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-[#0d121f] p-3 rounded-xl border border-white/5">
        <Search size={18} className="text-slate-500 ml-2" />
        <input 
          type="text"
          placeholder="Filter by title or holiday category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Holidays Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-mono">
          Loading schedule records...
        </div>
      ) : filteredHolidays.length === 0 ? (
        <div className="py-20 text-center text-slate-500 border border-white/5 rounded-2xl bg-[#090d16]/50">
          <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No holidays recorded</p>
          <p className="text-xs text-slate-500 mt-1">Click "Add Holiday" to log a new entry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHolidays.map((holiday) => {
            const start = new Date(holiday.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const end = new Date(holiday.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const isSingleDay = start === end;

            return (
              <div 
                key={holiday._id}
                className="bg-[#090d16] border border-white/10 hover:border-indigo-500/40 transition-all rounded-2xl p-5 flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[10px] uppercase font-mono px-2.5 py-1 rounded-lg border font-bold ${getTypeBadgeColor(holiday.type)}`}>
                      {holiday.type}
                    </span>
                    
                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(holiday)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Edit entry"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(holiday._id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                    {holiday.title}
                  </h3>

                  {holiday.description && (
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                      {holiday.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5 text-indigo-300">
                    <CalendarIcon size={12} />
                    <span>{start}</span>
                    {!isSingleDay && <span>– {end}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Dialog for Add & Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-sm font-bold text-white">
                {editingId ? 'Modify Holiday Entry' : 'Schedule New Holiday'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Holiday Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Independence Day, Winter Vacation" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#131826] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[#131826] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-[#131826] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Holiday Classification</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#131826] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Institutional">Institutional</option>
                  <option value="National">National</option>
                  <option value="Gazetted">Gazetted</option>
                  <option value="Academic">Academic Recess</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Description (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Additional context or notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#131826] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHolidays;