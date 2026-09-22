import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAsync } from '../lib/useAsync.js';
import {
  Empty,
  Languages,
  Loading,
  Modal,
  Note,
  PageHeader,
  Score,
  Source,
  Status,
} from '../components/ui.jsx';
import { effectiveLanguages, languageLabel, LANGUAGE_LABELS, STATUS_LABELS } from '../lib/format.js';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS);

/**
 * The routing decision, explained: which languages we matched on, where they
 * came from, and every BD ranked with the reasoning - including the ones ruled
 * out, so an override is an informed choice rather than a shot in the dark.
 */
function MatchDrawer({ leadId, onClose, onAssigned }) {
  const { data, error, loading } = useAsync(() => api.matches(leadId), [leadId]);
  const [busy, setBusy] = useState(null);
  const [warning, setWarning] = useState(null);

  async function assign(bd) {
    if (!bd.eligible && bd.blocked === 'language') {
      const ok = window.confirm(
        bd.name +
          ' does not share a language with this learner. This is exactly the call that gets wasted. Assign anyway?',
      );
      if (!ok) return;
    }
    setBusy(bd.bdId);
    try {
      const res = await api.assign(leadId, bd.bdId);
      if (res.languageMismatch) setWarning(bd.name + ' was assigned despite a language mismatch.');
      onAssigned();
      if (!res.languageMismatch) onClose();
    } catch (err) {
      setWarning(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-rule bg-paper">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-rule bg-paper px-7 py-4">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Why this BD?</h2>
            <p className="mt-0.5 text-[12px] text-ink-3">Every BD scored against this learner</p>
          </div>
          <button type="button" onClick={onClose} className="text-[12px] text-ink-3 hover:text-ink">
            Close
          </button>
        </header>

        {loading && <Loading label="Scoring the team" />}
        {error && (
          <div className="p-7">
            <Note tone="critical" title="Could not load matches">
              {error}
            </Note>
          </div>
        )}

        {data && (
          <div className="px-7 pb-10">
            <div className="border-b border-rule py-6">
              <p className="text-[17px] font-medium text-ink">{data.lead.name}</p>
              <p className="mt-0.5 text-[12px] text-ink-3">
                {[data.lead.city, data.lead.state].filter(Boolean).join(', ') || 'No location on file'}
                {data.lead.course ? ' · ' + data.lead.course : ''}
              </p>
              <p className="mt-4 flex items-baseline gap-2">
                <Languages codes={data.lead.effectiveLanguages} />
                <Source source={data.lead.languageSource} />
              </p>
              <p className="mt-1.5 text-[12px] text-ink-3">{data.lead.languageBasis}</p>
            </div>

            {warning && (
              <div className="pt-6">
                <Note tone="critical" title="Heads up" onClose={() => setWarning(null)}>
                  {warning}
                </Note>
              </div>
            )}

            <ol>
              {data.matches.map((bd, i) => (
                <li key={bd.bdId} className={'border-b border-rule py-5 ' + (bd.eligible ? '' : 'opacity-60')}>
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">
                        {bd.name}
                        {i === 0 && bd.eligible && (
                          <span className="ml-2 text-[11px] font-normal uppercase tracking-[0.07em] text-ink-3">
                            best match
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-3">
                        {bd.languages
                          .map((l) => languageLabel(l.code) + ' (' + l.proficiency + ')')
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {bd.eligible ? (
                        <Score score={bd.score} />
                      ) : (
                        <span className="text-[12px] font-medium text-critical">
                          {bd.blocked === 'language'
                            ? 'No shared language'
                            : bd.blocked === 'capacity'
                              ? 'At capacity'
                              : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1">
                    {bd.reasons.map((reason, j) => (
                      <li key={j} className="text-[12px] leading-relaxed text-ink-2">
                        {reason}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={'btn mt-4 ' + (i === 0 && bd.eligible ? 'btn-primary' : '')}
                    disabled={busy === bd.bdId}
                    onClick={() => assign(bd)}
                  >
                    {busy === bd.bdId ? 'Assigning…' : 'Assign to ' + bd.name.split(' ')[0]}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function AddLeadModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', phone: '', city: '', state: '', course: '', languages: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createLead({ ...form, preferredLanguages: form.languages });
      setForm({ name: '', phone: '', city: '', state: '', course: '', languages: [] });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a lead"
      sub="Leave the language blank to watch region inference do its job"
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Note tone="critical">{error}</Note>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            Name
            <input className="field mt-1.5" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="label">
            Phone
            <input className="field mt-1.5" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>
          <label className="label">
            City
            <input className="field mt-1.5" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </label>
          <label className="label">
            State
            <input className="field mt-1.5" value={form.state} onChange={(e) => set('state', e.target.value)} />
          </label>
        </div>
        <label className="label block">
          Course interest
          <input className="field mt-1.5" value={form.course} onChange={(e) => set('course', e.target.value)} />
        </label>
        <fieldset>
          <legend className="label">Languages the learner speaks (optional)</legend>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
            {LANGUAGE_OPTIONS.map(([code, label]) => {
              const on = form.languages.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() =>
                    set('languages', on ? form.languages.filter((c) => c !== code) : [...form.languages, code])
                  }
                  className={
                    'text-[13px] transition-colors ' +
                    (on
                      ? 'font-medium text-ink underline decoration-ink underline-offset-4'
                      : 'text-ink-3 hover:text-ink')
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[12px] text-ink-3">
            The first language you pick is treated as their primary language.
          </p>
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-rule pt-4">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Add lead'}
          </button>
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
      setNotice(
        'Routed ' +
          res.assigned +
          ' of ' +
          res.processed +
          ' waiting leads.' +
          (res.unroutable ? ' ' + res.unroutable + ' still have nobody who speaks their language.' : ''),
      );
      await reload();
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
        sub="Open any lead to see exactly why it was routed the way it was."
        actions={
          <>
            <button type="button" className="btn" onClick={() => setAdding(true)}>
              Add lead
            </button>
            <button type="button" className="btn btn-primary" onClick={runRouting} disabled={routing}>
              {routing ? 'Routing…' : 'Run routing'}
            </button>
          </>
        }
      />

      {notice && (
        <div className="mb-8">
          <Note title="Routing finished" onClose={() => setNotice(null)}>
            {notice}
          </Note>
        </div>
      )}

      {/* One filter row above everything it scopes. */}
      <div className="flex flex-wrap items-center gap-2 border-y border-rule py-3">
        <input
          className="field h-8 min-w-[200px] flex-1 border-0 px-0 focus:border-0"
          placeholder="Search name, phone, email or city"
          value={filters.q}
          onChange={(e) => set('q', e.target.value)}
        />
        <select className="field h-8 w-auto" value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className="field h-8 w-auto" value={filters.language} onChange={(e) => set('language', e.target.value)}>
          <option value="">All languages</option>
          {LANGUAGE_OPTIONS.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        <select className="field h-8 w-auto" value={filters.source} onChange={(e) => set('source', e.target.value)}>
          <option value="">Declared or inferred</option>
          <option value="explicit">Declared only</option>
          <option value="inferred">Inferred only</option>
          <option value="unknown">Unknown only</option>
        </select>
      </div>

      {error && (
        <div className="mt-6">
          <Note tone="critical" title="Could not load leads">
            {error}
          </Note>
        </div>
      )}

      <div className={'transition-opacity ' + (refreshing ? 'opacity-50' : '')}>
        {loading ? (
          <Loading label="Loading leads" />
        ) : !data?.length ? (
          <Empty title="No leads match these filters">
            Clear a filter, or import a CSV to bring some in.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px]">
              <thead>
                <tr>
                  <th className="th pt-5">Learner</th>
                  <th className="th pt-5">Languages</th>
                  <th className="th pt-5">Source</th>
                  <th className="th pt-5">Status</th>
                  <th className="th pt-5">Assigned to</th>
                  <th className="th pt-5">Match</th>
                  <th className="th pr-0 pt-5" />
                </tr>
              </thead>
              <tbody>
                {data.map((lead) => (
                  <tr key={lead._id} className="group">
                    <td className="td">
                      <span className="block font-medium text-ink">{lead.name}</span>
                      <span className="block text-[12px] text-ink-3">
                        {[lead.city, lead.state].filter(Boolean).join(', ') || 'location unknown'}
                      </span>
                    </td>
                    <td className="td">
                      <Languages codes={effectiveLanguages(lead)} />
                    </td>
                    <td className="td">
                      <Source source={lead.languageSource} />
                    </td>
                    <td className="td">
                      <Status status={lead.status} />
                      {lead.status === 'unroutable' && (
                        <span className="mt-0.5 block max-w-[220px] text-[12px] leading-snug text-ink-3">
                          {lead.unroutableReason}
                        </span>
                      )}
                    </td>
                    <td className="td">
                      {lead.assignedBD ? (
                        <>
                          <span className="block text-ink">{lead.assignedBD.name}</span>
                          {lead.assignmentMode === 'manual' && (
                            <span className="block text-[12px] text-ink-3">manual override</span>
                          )}
                        </>
                      ) : (
                        <span className="text-ink-3">-</span>
                      )}
                    </td>
                    <td className="td">
                      <Score score={lead.matchScore} />
                    </td>
                    <td className="td pr-0 text-right">
                      <button
                        type="button"
                        className="text-[12px] text-ink-3 underline underline-offset-2 transition-colors hover:text-ink"
                        onClick={() => setOpenLead(lead._id)}
                      >
                        Why?
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-rule py-4 text-[12px] text-ink-3">
              {data.length} leads
            </p>
          </div>
        )}
      </div>

      {openLead && <MatchDrawer leadId={openLead} onClose={() => setOpenLead(null)} onAssigned={reload} />}
      <AddLeadModal open={adding} onClose={() => setAdding(false)} onCreated={reload} />
    </div>
  );
}
