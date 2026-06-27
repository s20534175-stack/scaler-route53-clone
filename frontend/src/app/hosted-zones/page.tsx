'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Plus, Search, RefreshCw, Trash2, Edit2, ExternalLink, ChevronDown } from 'lucide-react';
import TopNav from '@/components/layout/TopNav';
import Sidebar from '@/components/layout/Sidebar';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { api, Zone } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function HostedZonesContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [zones, setZones] = useState<Zone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createComment, setCreateComment] = useState('');
  const [createType, setCreateType] = useState('Public');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit modal
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editType, setEditType] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete
  const [deleteZone, setDeleteZone] = useState<Zone | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.zones.list({ search, page, limit: 10 });
      setZones(res.zones);
      setTotal(res.total);
      setPages(res.pages);
    } catch (e: any) {
      if (e.message?.includes('401') || e.message?.includes('Invalid')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [search, page, router]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => { if (user) fetchZones(); }, [fetchZones, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!createName.trim()) { setCreateError('Domain name is required'); return; }
    setCreateLoading(true);
    try {
      await api.zones.create({ name: createName, comment: createComment, type: createType });
      toast('Hosted zone created successfully');
      setCreateOpen(false);
      setCreateName(''); setCreateComment(''); setCreateType('Public');
      fetchZones();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editZone) return;
    setEditLoading(true);
    try {
      await api.zones.update(editZone.zone_id, { comment: editComment, type: editType });
      toast('Hosted zone updated');
      setEditZone(null);
      fetchZones();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteZone) return;
    setDeleteLoading(true);
    try {
      await api.zones.delete(deleteZone.zone_id);
      toast('Hosted zone deleted');
      setDeleteZone(null);
      fetchZones();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const selectAll = () => {
    if (selected.length === zones.length) setSelected([]);
    else setSelected(zones.map(z => z.zone_id));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-aws-gray-50 p-6">
          {/* Breadcrumb */}
          <div className="text-xs text-aws-gray-500 mb-4">
            Route 53 &rsaquo; <span className="text-aws-gray-700 font-medium">Hosted zones</span>
          </div>

          {/* Page header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-medium text-aws-gray-900">Hosted zones</h1>
              <p className="text-xs text-aws-gray-500 mt-0.5">
                Manage DNS records for your domains. Total: <strong>{total}</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchZones} className="btn-secondary flex items-center gap-1">
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-1">
                <Plus size={14} /> Create hosted zone
              </button>
            </div>
          </div>

          {/* Search + filters */}
          <div className="card mb-4 p-3 flex gap-3 items-center">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-aws-gray-400" size={14} />
                <input
                  className="input-field pl-9"
                  placeholder="Search by domain name..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-secondary">Search</button>
              {search && (
                <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="btn-secondary text-aws-gray-500">
                  Clear
                </button>
              )}
            </form>
            <div className="text-xs text-aws-gray-500 border-l border-aws-gray-200 pl-3">
              {selected.length > 0 ? (
                <button
                  onClick={() => { if (selected.length === 1) { const z = zones.find(x => x.zone_id === selected[0]); if (z) setDeleteZone(z); }}}
                  className="flex items-center gap-1 text-aws-red hover:underline"
                >
                  <Trash2 size={13} /> Delete ({selected.length})
                </button>
              ) : 'Select zones to delete'}
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" onChange={selectAll} checked={selected.length === zones.length && zones.length > 0} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Domain name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Record count</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Zone ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Comment</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-aws-gray-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Loading hosted zones...
                  </td></tr>
                ) : zones.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center">
                    <Globe size={40} className="text-aws-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-aws-gray-600">No hosted zones found</p>
                    <p className="text-xs text-aws-gray-400 mt-1">Create your first hosted zone to get started.</p>
                    <button onClick={() => setCreateOpen(true)} className="btn-primary mt-4 inline-flex items-center gap-1">
                      <Plus size={14} /> Create hosted zone
                    </button>
                  </td></tr>
                ) : (
                  zones.map(zone => (
                    <tr key={zone.zone_id} className="table-row">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(zone.zone_id)} onChange={() => toggleSelect(zone.zone_id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/hosted-zones/${zone.zone_id}`)}
                          className="text-aws-blue hover:text-aws-blue-dark hover:underline font-medium flex items-center gap-1"
                        >
                          {zone.name} <ExternalLink size={11} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={zone.type === 'Public' ? 'badge-public' : 'badge-private'}>
                          {zone.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-aws-gray-700">{zone.record_count}</td>
                      <td className="px-4 py-3 font-mono text-xs text-aws-gray-600">{zone.zone_id}</td>
                      <td className="px-4 py-3 text-aws-gray-500 text-xs max-w-[160px] truncate">{zone.comment || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditZone(zone); setEditComment(zone.comment); setEditType(zone.type); }}
                            className="text-aws-blue hover:text-aws-blue-dark"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteZone(zone)}
                            className="text-aws-red hover:opacity-75"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination page={page} pages={pages} total={total} limit={10} onPage={setPage} />
          </div>
        </main>
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(''); }} title="Create hosted zone">
        <div className="space-y-4">
          <div>
            <label className="label">Domain name <span className="text-aws-red">*</span></label>
            <input
              className="input-field"
              placeholder="example.com"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
            />
            <p className="text-xs text-aws-gray-400 mt-1">Enter the domain name for your hosted zone</p>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input-field" value={createType} onChange={e => setCreateType(e.target.value)}>
              <option>Public</option>
              <option>Private</option>
            </select>
          </div>
          <div>
            <label className="label">Comment (optional)</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Add a description..."
              value={createComment}
              onChange={e => setCreateComment(e.target.value)}
            />
          </div>
          {createError && (
            <div className="bg-aws-red-light border border-aws-red text-aws-red text-sm px-3 py-2 rounded">{createError}</div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={createLoading} className="btn-primary">
              {createLoading ? 'Creating...' : 'Create hosted zone'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editZone} onClose={() => setEditZone(null)} title="Edit hosted zone">
        <div className="space-y-4">
          <div>
            <label className="label">Domain name</label>
            <input className="input-field bg-aws-gray-100 cursor-not-allowed" value={editZone?.name || ''} disabled />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input-field" value={editType} onChange={e => setEditType(e.target.value)}>
              <option>Public</option>
              <option>Private</option>
            </select>
          </div>
          <div>
            <label className="label">Comment</label>
            <textarea className="input-field" rows={2} value={editComment} onChange={e => setEditComment(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditZone(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleEdit} disabled={editLoading} className="btn-primary">
              {editLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteZone}
        onClose={() => setDeleteZone(null)}
        onConfirm={handleDelete}
        title="Delete hosted zone"
        description={`Are you sure you want to delete "${deleteZone?.name}"? All DNS records in this zone will also be deleted. This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}

export default function HostedZonesPage() {
  return (
    <ToastProvider>
      <HostedZonesContent />
    </ToastProvider>
  );
}
