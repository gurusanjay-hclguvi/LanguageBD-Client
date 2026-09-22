import { useState } from 'react';
import { api } from '../api.js';
import { useRole } from '../context/RoleContext.jsx';
import { useAsync } from '../lib/useAsync.js';
import { Loading, Modal, Note, PageHeader } from '../components/ui.jsx';
import { INDIAN_STATES, languageLabel, LANGUAGE_LABELS, titleCase } from '../lib/format.js';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS);
const PROFICIENCIES = ['native', 'fluent', 'basic'];

const emptyBD = { name: '', email: '', phone: '', region: '', dailyCapacity: 14, languages: [] };

function LanguageEditor({ value, onChange }) {
  const byCode = Object.fromEntries(value.map((l) => [l.code, l.proficiency]));

  function toggle(code) {
    onChange(byCode[code] ? value.filter((l) => l.code !== code) : [...value, { code, proficiency: 'fluent' }]);
  }

  function setProficiency(code, proficiency) {
    onChange(value.map((l) => (l.code === code ? { ...l, proficiency } : l)));
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map(([code, label]) => {
          const on = byCode[code];
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              className={
                'rounded-lg px-4 py-2 text-[14px] font-medium transition-all ' +
                (on ? 'bg-accent text-white' : 'border border-rule bg-white text-ink-2 hover:border-accent')
              }
            >
              {label}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <ul className="mt-5 space-y-2">
          {value.map((l) => (
            <li key={l.code} className="flex items-center justify-between gap-4 rounded-lg border border-rule bg-white px-4 py-3">
              <span className="text-[15px] font-semibold text-ink">{languageLabel(l.code)}</span>
              <select className="field w-auto" value={l.proficiency} onChange={(e) => setProficiency(l.code, e.target.value)}>
                {PROFICIENCIES.map((p) => (
                  <option key={p} value={p}>{titleCase(p)}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BDModal({ open, initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ?? emptyBD);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const editing = Boolean(initial?._id);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        region: form.region,
        dailyCapacity: Number(form.dailyCapacity) || 1,
        isActive: form.isActive ?? true,
        languages: form.languages,
      };
      let result;
      if (editing) result = await api.updateBD(form._id, payload);
      else result = await api.createBD(payload);
      
      onSaved(result);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit ' + initial.name : 'Add BD'} sub="Languages drive routing">
      <form onSubmit={submit} className="space-y-5">
        {error && <Note tone="critical">{error}</Note>}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="label">Name *</span>
            <input className="field mt-2" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input className="field mt-2" type="email" maxLength="254" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Phone</span>
            <input className="field mt-2" type="tel" inputMode="numeric" maxLength="10" minLength="10" pattern="[0-9]{10}" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
          </label>
          <label className="block">
            <span className="label">Region</span>
            <select className="field mt-2" value={form.region ?? ''} onChange={(e) => set('region', e.target.value)}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Daily Capacity</span>
            <input type="number" min="1" max="500" step="1" required className="field mt-2" value={form.dailyCapacity} onChange={(e) => set('dailyCapacity', e.target.value)} />
          </label>
        </div>
        <fieldset>
          <legend className="label">Languages</legend>
          <LanguageEditor value={form.languages} onChange={(v) => set('languages', v)} />
        </fieldset>
        <label className="flex items-center gap-3 rounded-lg border border-rule bg-white p-4 cursor-pointer hover:bg-panel">
          <input type="checkbox" className="h-5 w-5 accent-accent" checked={form.isActive ?? true} onChange={(e) => set('isActive', e.target.checked)} />
          <span className="text-[15px] font-medium text-ink">Active today</span>
        </label>
        <div className="flex justify-end gap-3 border-t border-rule pt-5">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save' : 'Add BD'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Team() {
  const { refreshBDs } = useRole();
  const { data, error, loading, reload } = useAsync(() => api.bds(), []);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState(null);
  const [routingResult, setRoutingResult] = useState(null);

  const refresh = () => { reload(); refreshBDs(); };

  function handleBDSaved(result) {
    refresh();
    // Show routing result if leads were assigned
    if (result?.routing?.newAssignments && result.routing.newAssignments.length > 0) {
      setRoutingResult({
        bdName: result.routing.newAssignments[0].bd,
        assigned: result.routing.newAssignments.length,
        leads: result.routing.newAssignments
      });
    }
  }

  async function remove(bd) {
    if (!window.confirm('Remove ' + bd.name + '?')) return;
    try {
      await api.deleteBD(bd._id);
      setNotice(bd.name + ' removed.');
      refresh();
    } catch (err) {
      setNotice(err.message);
    }
  }

  if (loading) return <Loading label="Loading team" />;
  if (error) return <Note tone="critical" title="Could not load">{error}</Note>;

  return (
    <div>
      <PageHeader title="Team" sub="Add languages to improve coverage." actions={<button className="btn btn-primary" onClick={() => setAdding(true)}>Add BD</button>} />

      {routingResult && (
        <div className="mb-8">
          <Note tone="ok" title={`${routingResult.assigned} lead${routingResult.assigned !== 1 ? 's' : ''} assigned to ${routingResult.bdName}`} onClose={() => setRoutingResult(null)}>
            Previously unroutable leads are now assigned and ready to call. {routingResult.bdName} can view them in My Queue.
          </Note>
        </div>
      )}
      {notice && <div className="mb-8"><Note onClose={() => setNotice(null)}>{notice}</Note></div>}

      <div className="overflow-hidden rounded-xl border border-rule bg-white">
        <table className="w-full">
          <thead className="bg-panel">
            <tr>
              <th className="th px-5 py-4">BD</th>
              <th className="th px-5 py-4">Languages</th>
              <th className="th px-5 py-4">Region</th>
              <th className="th px-5 py-4">Load</th>
              <th className="th px-5 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((bd) => {
              const used = bd.currentLoad ?? 0;
              const capacity = bd.dailyCapacity || 1;
              return (
                <tr key={bd._id} className="border-t border-rule hover:bg-panel">
                  <td className="td px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-[16px] font-bold text-white">
                        {bd.name.charAt(0)}
                      </div>
                      <div>
                        <span className="block text-[16px] font-bold text-ink">
                          {bd.name}
                          {!bd.isActive && <span className="ml-2 text-[12px] font-normal text-ink-3">Inactive</span>}
                        </span>
                        <span className="text-[14px] text-ink-3">{bd.email || 'No email'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="td px-5 py-4">
                    {bd.languages.length ? (
                      <div className="flex flex-wrap gap-2">
                        {bd.languages.map((l) => (
                          <span key={l.code} className="inline-flex items-center rounded-lg bg-accent-light px-3 py-1 text-[13px] font-semibold text-accent">
                            {languageLabel(l.code)} <span className="ml-1 text-[11px] font-normal">{l.proficiency}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[14px] font-medium text-ink">No languages</span>
                    )}
                  </td>
                  <td className="td px-5 py-4 text-[15px] text-ink-2">{bd.region ? titleCase(bd.region) : '-'}</td>
                  <td className="td px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-semibold text-ink">{used}/{capacity}</span>
                      <div className="h-2 w-20 rounded-full bg-rule">
                        <div className="h-full rounded-full bg-accent" style={{ width: Math.min(100, (used / capacity) * 100) + '%' }} />
                      </div>
                    </div>
                  </td>
                  <td className="td px-5 py-4 text-right">
                    <button className="text-[14px] font-medium text-accent hover:underline" onClick={() => setEditing(bd)}>Edit</button>
                    <button className="ml-4 text-[14px] font-medium text-ink hover:underline" onClick={() => remove(bd)}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adding && (
        <BDModal 
          open 
          onClose={() => setAdding(false)}
          onSaved={handleBDSaved}
          initial={{ ...emptyBD }} 
        />
      )}
      {editing && (
        <BDModal 
          open 
          key={editing._id} 
          initial={editing} 
          onClose={() => setEditing(null)}
          onSaved={handleBDSaved}
        />
      )}
    </div>
  );
}
