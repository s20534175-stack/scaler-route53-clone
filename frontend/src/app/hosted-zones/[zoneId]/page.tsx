'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, RefreshCw, Trash2, Edit2, ChevronLeft, Filter } from 'lucide-react';
import TopNav from '@/components/layout/TopNav';
import Sidebar from '@/components/layout/Sidebar';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { api, Zone, DNSRecord } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA', 'SOA'];
const ROUTING_POLICIES = ['Simple', 'Weighted', 'Latency', 'Failover', 'Geolocation', 'Multivalue'];
const TTL_PRESETS = [
  { label: '1m', value: 60 }, { label: '5m', value: 300 }, { label: '1h', value: 3600 },
  { label: '1d', value: 86400 }, { label: 'Custom', value: 0 },
];

const TYPE_COLORS: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700',
  AAAA: 'bg-purple-100 text-purple-700',
  CNAME: 'bg-green-100 text-green-700',
  TXT: 'bg-yellow-100 text-yellow-700',
  MX: 'bg-orange-100 text-orange-700',
  NS: 'bg-gray-100 text-gray-600',
  SOA: 'bg-gray-100 text-gray-600',
  PTR: 'bg-pink-100 text-pink-700',
  SRV: 'bg-red-100 text-red-700',
  CAA: 'bg-indigo-100 text-indigo-700',
};

function ZoneRecordsContent() {
  const params = useParams();
  const zoneId = params.zoneId as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [zone, setZone] = useState<Zone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  // Record form state
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<DNSRecord | null>(null);
  const [form, setForm] = useState({
    name: '', type: 'A', value: '', ttl: 300,
    routing_policy: 'Simple', comment: '', customTtl: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete
  const [deleteRecord, setDeleteRecord] = useState<DNSRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchZone = useCallback(async () => {
    try {
      const z = await api.zones.get(zoneId);
      setZone(z);
    } catch {
      router.push('/hosted-zones');
    }
  }, [zoneId, router]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.records.list(zoneId, {
        search, page, type_filter: typeFilter || undefined,
      });
      setRecords(res.records);
      setTotal(res.total);
      setPages(res.pages);
    } catch (e: any) {
      if (e.message?.includes('401')) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [zoneId, search, page, typeFilter, router]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) { fetchZone(); fetchRecords(); }
  }, [fetchZone, fetchRecords, user]);

  const openCreate = () => {
    setEditRecord(null);
    setForm({ name: zone?.name || '', type: 'A', value: '', ttl: 300, routing_policy: 'Simple', comment: '', customTtl: false });
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (r: DNSRecord) => {
    setEditRecord(r);
    setForm({ name: r.name, type: r.type, value: r.value, ttl: r.ttl, routing_policy: r.routing_policy, comment: r.comment, customTtl: false });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.name.trim() || !form.value.trim()) { setFormError('Name and value are required'); return; }
    setFormLoading(true);
    try {
      if (editRecord) {
        await api.records.update(zoneId, editRecord.record_id, {
          name: form.name, value: form.value, ttl: form.ttl,
          routing_policy: form.routing_policy, comment: form.comment,
        });
        toast('Record updated successfully');
      } else {
        await api.records.create(zoneId, {
          name: form.name, type: form.type, value: form.value,
          ttl: form.ttl, routing_policy: form.routing_policy, comment: form.comment,
        });
        toast('Record created successfully');
      }
      setFormOpen(false);
      fetchRecords();
      fetchZone();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;
    setDeleteLoading(true);
    try {
      await api.records.delete(zoneId, deleteRecord.record_id);
      toast('Record deleted');
      setDeleteRecord(null);
      fetchRecords();
      fetchZone();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const toggleSelect = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAll = () => selected.length === records.length ? setSelected([]) : setSelected(records.map(r => r.record_id));

  const placeholders: Record<string, string> = {
    A: '192.0.2.1', AAAA: '2001:db8::1', CNAME: 'target.example.com.',
    TXT: '"v=spf1 include:example.com ~all"', MX: '10 mail.example.com.',
    NS: 'ns1.example.com.', PTR: 'hostname.example.com.',
    SRV: '10 20 443 target.example.com.', CAA: '0 issue "letsencrypt.org"',
    SOA: 'ns1.example.com. admin.example.com. 1 7200 900 1209600 86400',
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-aws-gray-50 p-6">
          {/* Breadcrumb */}
          <div className="text-xs text-aws-gray-500 mb-4 flex items-center gap-1">
            <Link href="/hosted-zones" className="breadcrumb-link">Route 53</Link>
            &rsaquo;
            <Link href="/hosted-zones" className="breadcrumb-link">Hosted zones</Link>
            &rsaquo;
            <span className="text-aws-gray-700 font-medium font-mono">{zone?.name || zoneId}</span>
          </div>

          {/* Zone info banner */}
          {zone && (
            <div className="card p-4 mb-4 flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-aws-gray-500 uppercase tracking-wide">Domain</p>
                  <p className="font-medium text-aws-gray-900">{zone.name}</p>
                </div>
                <div>
                  <p className="text-xs text-aws-gray-500 uppercase tracking-wide">Zone ID</p>
                  <p className="font-mono text-xs text-aws-gray-700">{zone.zone_id}</p>
                </div>
                <div>
                  <p className="text-xs text-aws-gray-500 uppercase tracking-wide">Type</p>
                  <span className={zone.type === 'Public' ? 'badge-public' : 'badge-private'}>{zone.type}</span>
                </div>
                <div>
                  <p className="text-xs text-aws-gray-500 uppercase tracking-wide">Records</p>
                  <p className="font-medium text-aws-gray-900">{zone.record_count}</p>
                </div>
              </div>
              <Link href="/hosted-zones" className="btn-secondary flex items-center gap-1 text-xs">
                <ChevronLeft size={13} /> Back to zones
              </Link>
            </div>
          )}

          {/* Page header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-medium text-aws-gray-900">DNS records</h1>
              <p className="text-xs text-aws-gray-500 mt-0.5">Manage the DNS records in this hosted zone</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { fetchRecords(); fetchZone(); }} className="btn-secondary flex items-center gap-1">
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={openCreate} className="btn-primary flex items-center gap-1">
                <Plus size={14} /> Create record
              </button>
            </div>
          </div>

          {/* Search + filter bar */}
          <div className="card mb-4 p-3 flex gap-3 items-center flex-wrap">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-aws-gray-400" size={14} />
                <input
                  className="input-field pl-9"
                  placeholder="Search records..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-secondary">Search</button>
              {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="btn-secondary text-aws-gray-500">Clear</button>}
            </form>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-aws-gray-400" />
              <select
                className="input-field w-auto min-w-[100px]"
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="">All types</option>
                {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Records table */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" onChange={selectAll} checked={selected.length === records.length && records.length > 0} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Record name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Routing policy</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Value / Route traffic to</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">TTL (seconds)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-aws-gray-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-aws-gray-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Loading records...
                  </td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center">
                    <p className="font-medium text-aws-gray-600">No records found</p>
                    <p className="text-xs text-aws-gray-400 mt-1">Create your first DNS record for this zone.</p>
                    <button onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-1">
                      <Plus size={14} /> Create record
                    </button>
                  </td></tr>
                ) : (
                  records.map(rec => (
                    <tr key={rec.record_id} className="table-row">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(rec.record_id)} onChange={() => toggleSelect(rec.record_id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-aws-gray-900 max-w-[200px] truncate">{rec.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${TYPE_COLORS[rec.type] || 'bg-gray-100 text-gray-600'}`}>
                          {rec.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-aws-gray-600 text-xs">{rec.routing_policy}</td>
                      <td className="px-4 py-3 font-mono text-xs text-aws-gray-700 max-w-[250px]">
                        <div className="truncate" title={rec.value}>{rec.value}</div>
                      </td>
                      <td className="px-4 py-3 text-aws-gray-600">{rec.ttl}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(rec)} className="text-aws-blue hover:text-aws-blue-dark" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteRecord(rec)} className="text-aws-red hover:opacity-75" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination page={page} pages={pages} total={total} limit={20} onPage={setPage} />
          </div>
        </main>
      </div>

      {/* Create/Edit Record Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editRecord ? 'Edit record' : 'Create DNS record'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Record name <span className="text-aws-red">*</span></label>
              <input
                className="input-field"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={zone?.name || 'subdomain.example.com.'}
              />
            </div>
            <div>
              <label className="label">Record type <span className="text-aws-red">*</span></label>
              <select
                className="input-field"
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                disabled={!!editRecord}
              >
                {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">TTL (seconds)</label>
              <div className="flex gap-2">
                <div className="flex gap-1">
                  {TTL_PRESETS.slice(0, -1).map(p => (
                    <button
                      key={p.value}
                      onClick={() => setForm(prev => ({ ...prev, ttl: p.value, customTtl: false }))}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${form.ttl === p.value && !form.customTtl ? 'bg-aws-blue text-white border-aws-blue' : 'border-aws-gray-300 text-aws-gray-600 hover:bg-aws-gray-100'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setForm(prev => ({ ...prev, customTtl: true }))}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${form.customTtl ? 'bg-aws-blue text-white border-aws-blue' : 'border-aws-gray-300 text-aws-gray-600 hover:bg-aws-gray-100'}`}
                  >
                    Custom
                  </button>
                </div>
              </div>
              {form.customTtl && (
                <input
                  className="input-field mt-2"
                  type="number"
                  min={1}
                  value={form.ttl}
                  onChange={e => setForm(p => ({ ...p, ttl: parseInt(e.target.value) || 300 }))}
                  placeholder="300"
                />
              )}
            </div>
            <div>
              <label className="label">Routing policy</label>
              <select className="input-field" value={form.routing_policy} onChange={e => setForm(p => ({ ...p, routing_policy: e.target.value }))}>
                {ROUTING_POLICIES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Value <span className="text-aws-red">*</span></label>
            <textarea
              className="input-field font-mono"
              rows={3}
              value={form.value}
              onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
              placeholder={placeholders[form.type] || 'Enter value...'}
            />
            <p className="text-xs text-aws-gray-400 mt-1">For multiple values, enter one per line</p>
          </div>

          <div>
            <label className="label">Comment (optional)</label>
            <input
              className="input-field"
              value={form.comment}
              onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
              placeholder="Describe this record..."
            />
          </div>

          {formError && (
            <div className="bg-aws-red-light border border-aws-red text-aws-red text-sm px-3 py-2 rounded">{formError}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setFormOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={formLoading} className="btn-primary">
              {formLoading ? 'Saving...' : editRecord ? 'Save changes' : 'Create record'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        title="Delete DNS record"
        description={`Delete the ${deleteRecord?.type} record "${deleteRecord?.name}"? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}

export default function ZoneRecordsPage() {
  return (
    <ToastProvider>
      <ZoneRecordsContent />
    </ToastProvider>
  );
}
