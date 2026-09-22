import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAsync } from '../lib/useAsync.js';
import { Empty, Languages, Loading, Modal, Note, PageHeader, Score, Source, Status } from '../components/ui.jsx';
import { COURSE_OPTIONS, effectiveLanguages, INDIAN_STATES, languageLabel, LANGUAGE_LABELS, STATUS_LABELS } from '../lib/format.js';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS);

function MatchDrawer({ leadId, leadName, hasAssignedBD, leadStatus, onClose, onAssigned }) {
  const { data, error, loading } = useAsync(() => api.matches(leadId), [leadId]);
  const [busy, setBusy] = useState(null);
  const [warning, setWarning] = useState(null);

  async function assign(bd) {
    if (!bd.eligible && bd.blocked === 'language') {
      if (!window.confirm(bd.name + ' does not share a language. Assign anyway?')) return;
    }
    setBusy(bd.bdId);
    try {
      const res = await api.assign(leadId, bd.bdId);
      if (res.languageMismatch) setWarning(bd.name + ' assigned despite mismatch.');
      onAssigned();
      if (!res.languageMismatch) onClose();
    } catch (err) {
      setWarning(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-rule bg-white shadow-lg">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-rule bg-white px-8 py-5">
          <div>
            <h2 className="text-[22px] font-bold text-ink">
              {leadStatus === 'unroutable' ? 'No BD Available' : hasAssignedBD ? 'Reassign Lead' : 'Assign Lead'}
            </h2>
            <p className="mt-1 text-[16px] text-ink-3">
              {leadName} — Match scoring breakdown
            </p>
          </div>
          <button className="text-[15px] font-medium text-ink-3 hover:text-ink" onClick={onClose}>Close</button>
        </header>

        {loading && <Loading label="Scoring matches" />}
        {error && <div className="p-8"><Note tone="critical" title="Error">{error}</Note></div>}

        {leadStatus === 'unroutable' && (
          <div className="p-8">
            <Note title="No BD Available">
              This lead cannot be routed because there is no BD on the team who speaks their language. 
              Add a BD with matching language skills to enable routing.
            </Note>
          </div>
        )}

        {data && leadStatus !== 'unroutable' && (
          <div className="px-8 pb-10">
            <div className="border-b border-rule py-6">
              <p className="text-[20px] font-bold text-ink">{data.lead.name}</p>
              <p className="mt-1 text-[16px] text-ink-3">{[data.lead.city, data.lead.state].filter(Boolean).join(', ') || 'No location'}</p>
              <div className="mt-4 flex items-center gap-3">
                <Languages codes={data.lead.effectiveLanguages} />
                <Source source={data.lead.languageSource} />
              </div>
            </div>

            {warning && <div className="pt-6"><Note tone="critical" title="Note" onClose={() => setWarning(null)}>{warning}</Note></div>}

            {!data.matches.length ? (
              <div className="pt-6">
                <Note title="No BD Available">
                  There are no BDs on the team to match with this lead. Add a BD before trying to assign it.
                </Note>
              </div>
            ) : (
              <ol className="mt-6 space-y-4">
                {data.matches.map((bd, i) => (
                  <li key={bd.bdId} className={'rounded-xl border p-5 ' + (bd.eligible ? 'border-rule bg-white' : 'border-rule/50 bg-panel opacity-50')}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[17px] font-bold text-ink">
                          {bd.name}
                          {i === 0 && bd.eligible && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-accent-light px-3 py-1 text-[13px] font-bold text-accent">
                              Best Match
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-[15px] text-ink-3">
                          {bd.languages.map((l) => languageLabel(l.code) + ' (' + l.proficiency + ')').join(' · ')}
                        </p>
                      </div>
                      <div>
                        {bd.eligible ? (
                          <Score score={bd.score} />
                        ) : (
                          <span className="text-[14px] font-semibold text-ink">{bd.blocked === 'language' ? 'No match' : 'Inactive'}</span>
                        )}
                      </div>
                    </div>
                    
                    {bd.eligible && (
                      <button 
                        className={'btn mt-4 ' + (i === 0 ? 'btn-primary' : '')} 
                        disabled={busy === bd.bdId} 
                        onClick={() => assign(bd)}
                      >
                        {busy === bd.bdId ? 'Assigning...' : hasAssignedBD ? 'Reassign to ' + bd.name.split(' ')[0] : 'Assign to ' + bd.name.split(' ')[0]}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AddLeadModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', state: '', course: '', languages: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createLead({ ...form, preferredLanguages: form.languages });
      setForm({ name: '', email: '', phone: '', city: '', state: '', course: '', languages: [] });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Lead" sub="Leave language blank for inference">
      <form onSubmit={submit} className="space-y-5">
        {error && <Note tone="critical">{error}</Note>}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="label">Name *</span>
            <input className="field mt-2" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input className="field mt-2" type="email" maxLength="254" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input className="field mt-2" type="tel" inputMode="numeric" maxLength="10" minLength="10" pattern="[0-9]{10}" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit phone number" />
          </label>
          <label className="block">
            <span className="label">City</span>
            <input className="field mt-2" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
          </label>
          <label className="block">
            <span className="label">State</span>
            <select className="field mt-2" value={form.state} onChange={(e) => set('state', e.target.value)}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="label">Course Interest</span>
          <select className="field mt-2" value={form.course} onChange={(e) => set('course', e.target.value)}>
            <option value="">Select course</option>
            {COURSE_OPTIONS.map((course) => <option key={course} value={course}>{course}</option>)}
          </select>
        </label>
        <fieldset>
          <legend className="label">Languages Spoken</legend>
          <p className="mt-1 text-[15px] text-ink-3">Optional — will be inferred from region if not specified</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(([code, label]) => {
              const on = form.languages.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => set('languages', on ? form.languages.filter((c) => c !== code) : [...form.languages, code])}
                  className={'rounded-lg px-4 py-2 text-[15px] font-medium transition-all ' + (on ? 'bg-accent text-white' : 'border border-rule bg-white text-ink-2 hover:border-accent')}>
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="flex justify-end gap-3 border-t border-rule pt-5">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Add Lead'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Leads() {
  const [filters, setFilters] = useState({ status: '', language: '', source: '', q: '' });
  const [openLead, setOpenLead] = useState(null);
  const [adding, setAdding] = useState(false);
  const [routing, setRouting] = useState(false);
  const [notice, setNotice] = useState(null);

  const query = useMemo(() => ({ ...filters }), [filters]);
  const { data, error, loading, refreshing, reload } = useAsync(() => api.leads(query), [query]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  async function runRouting() {
    setRouting(true);
    try {
      const res = await api.runRouting();
      setNotice('Routed ' + res.assigned + ' of ' + res.processed + ' leads.');
      reload();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setRouting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Leads"
        sub="Manage and route leads to matching BDs"
        actions={
          <>
            <button className="btn" onClick={() => setAdding(true)}>Add Lead</button>
            <button className="btn btn-primary" onClick={runRouting} disabled={routing}>
              {routing ? 'Routing...' : 'Run Routing'}
            </button>
          </>
        }
      />

      {notice && (
        <div className="mb-8">
          <Note title="Done" onClose={() => setNotice(null)}>{notice}</Note>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rule bg-white p-4">
        <input
          className="field min-w-[220px] flex-1"
          placeholder="Search by name, phone, city..."
          value={filters.q}
          onChange={(e) => set('q', e.target.value)}
        />
        <select className="field w-auto" value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select className="field w-auto" value={filters.language} onChange={(e) => set('language', e.target.value)}>
          <option value="">All languages</option>
          {LANGUAGE_OPTIONS.map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={'mt-6 transition-opacity ' + (refreshing ? 'opacity-50' : '')}>
        {loading ? (
          <Loading label="Loading leads" />
        ) : !data?.length ? (
          <Empty title="No leads found">
            Import a CSV or add leads manually to get started.
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-xl border border-rule bg-white">
            <table className="w-full">
              <thead className="bg-panel">
                <tr>
                  <th className="th px-5 py-4">Learner</th>
                  <th className="th px-5 py-4">Languages</th>
                  <th className="th px-5 py-4">Source</th>
                  <th className="th px-5 py-4">Status</th>
                  <th className="th px-5 py-4">Assigned To</th>
                  <th className="th px-5 py-4">Match</th>
                  <th className="th px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((lead) => {
                  const noBDs = !lead.assignedBD && lead.hasAvailableMatch === false;
                  return (
                    <tr key={lead._id} className="border-t border-rule hover:bg-panel transition-colors">
                    <td className="td px-5 py-4">
                      <span className="block text-[17px] font-bold text-ink">{lead.name}</span>
                      <span className="block text-[15px] text-ink-3">
                        {[lead.city, lead.state].filter(Boolean).join(', ') || 'No location'}
                      </span>
                    </td>
                    <td className="td px-5 py-4">
                      <Languages codes={effectiveLanguages(lead)} />
                    </td>
                    <td className="td px-5 py-4">
                      <Source source={lead.languageSource} />
                    </td>
                    <td className="td px-5 py-4">
                      <Status status={lead.status} />
                    </td>
                    <td className="td px-5 py-4">
                      {lead.assignedBD ? (
                        <div>
                          <span className="text-[16px] font-semibold text-ink">{lead.assignedBD.name}</span>
                          {lead.assignmentMode === 'manual' && (
                            <span className="ml-2 text-[13px] text-ink-3">(manual)</span>
                          )}
                        </div>
                      ) : lead.status === 'unroutable' || noBDs ? (
                        <div>
                          <span className="text-[16px] font-semibold text-ink">No BD Available</span>
                          {lead.unroutableReason && !noBDs && (
                            <span className="ml-2 text-[13px] text-ink-3">— {lead.unroutableReason}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-accent-light px-3 py-1 text-[13px] font-bold text-accent">
                            Best Match Available
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="td px-5 py-4">
                      {noBDs ? (
                        <span className="text-[15px] text-ink-3">Add a BD to match</span>
                      ) : lead.matchScore ? (
                        <Score score={lead.matchScore} />
                      ) : (
                        <span className="text-[15px] text-ink-3">Run routing</span>
                      )}
                    </td>
                    <td className="td px-5 py-4">
                      {lead.status === 'unroutable' || noBDs ? (
                        <span className="text-[15px] text-ink-3">Cannot assign</span>
                      ) : lead.assignedBD ? (
                        <button
                          className="text-[15px] font-semibold text-accent hover:underline"
                          onClick={() => setOpenLead(lead._id)}
                        >
                          Reassign
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => setOpenLead(lead._id)}
                        >
                          Assign
                        </button>
                      )}
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-rule px-5 py-3 text-[15px] text-ink-3">
              {data.length} leads total
            </div>
          </div>
        )}
      </div>

      {openLead && (
        <MatchDrawer
          leadId={openLead}
          leadName={data?.find(l => l._id === openLead)?.name || 'Lead'}
          hasAssignedBD={!!data?.find(l => l._id === openLead)?.assignedBD}
          leadStatus={data?.find(l => l._id === openLead)?.status}
          onClose={() => setOpenLead(null)}
          onAssigned={reload}
        />
      )}
      <AddLeadModal open={adding} onClose={() => setAdding(false)} onCreated={reload} />
    </div>
  );
}
