import { useState } from 'react';
import { api } from '../api.js';
import { useRole } from '../context/RoleContext.jsx';
import { useAsync } from '../lib/useAsync.js';
import { Loading, Modal, Note, PageHeader } from '../components/ui.jsx';
import { languageLabel, LANGUAGE_LABELS, titleCase } from '../lib/format.js';

const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS);
const PROFICIENCIES = ['native', 'fluent', 'basic'];

const emptyBD = { name: '', email: '', region: '', dailyCapacity: 14, languages: [] };

/**
 * Language picker with proficiency. Proficiency is not decoration - it scales
 * the language part of the match score, so a native speaker outranks someone
 * who only gets by.
 */
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
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
        {LANGUAGE_OPTIONS.map(([code, label]) => (
          <button
            key={code}
            type="button"
            onClick={() => toggle(code)}
            className={
              'text-[13px] transition-colors ' +
              (byCode[code]
                ? 'font-medium text-ink underline decoration-ink underline-offset-4'
                : 'text-ink-3 hover:text-ink')
            }
          >
            {label}
          </button>
        ))}
      </div>
      {value.length > 0 && (
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {value.map((l) => (
            <li key={l.code} className="flex items-center justify-between gap-4 py-2">
              <span className="text-[13px] text-ink">{languageLabel(l.code)}</span>
              <select
                className="field h-7 w-auto border-0 px-0 text-[12px]"
                value={l.proficiency}
                onChange={(e) => setProficiency(l.code, e.target.value)}
              >
                {PROFICIENCIES.map((p) => (
                  <option key={p} value={p}>
                    {titleCase(p)}
                  </option>
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
        region: form.region,
        dailyCapacity: Number(form.dailyCapacity) || 1,
        isActive: form.isActive ?? true,
        languages: form.languages,
      };
      if (editing) await api.updateBD(form._id, payload);
      else await api.createBD(payload);
      onSaved();
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
      title={editing ? 'Edit ' + initial.name : 'Add a BD'}
      sub="Languages and proficiency drive every routing decision"
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Note tone="critical">{error}</Note>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            Name
            <input className="field mt-1.5" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="label">
            Email
            <input className="field mt-1.5" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </label>
          <label className="label">
            Region (state)
            <input className="field mt-1.5" value={form.region ?? ''} onChange={(e) => set('region', e.target.value)} />
          </label>
          <label className="label">
            Calls per day
            <input
              type="number"
              min="1"
              className="field mt-1.5"
              value={form.dailyCapacity}
              onChange={(e) => set('dailyCapacity', e.target.value)}
            />
          </label>
        </div>
        <fieldset>
          <legend className="label">Languages spoken</legend>
          <LanguageEditor value={form.languages} onChange={(v) => set('languages', v)} />
        </fieldset>
        <label className="flex items-center gap-2.5 text-[13px] text-ink">
          <input
            type="checkbox"
            className="accent-ink"
            checked={form.isActive ?? true}
            onChange={(e) => set('isActive', e.target.checked)}
          />
          Taking calls today
        </label>
        <div className="flex justify-end gap-2 border-t border-rule pt-4">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add BD'}
          </button>
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

  const refresh = () => {
    reload();
    refreshBDs();
  };

  async function remove(bd) {
    if (!window.confirm('Remove ' + bd.name + '? Their leads go back into the routing pool.')) return;
    try {
      await api.deleteBD(bd._id);
      setNotice(bd.name + ' was removed and their leads returned to the pool.');
      refresh();
    } catch (err) {
      setNotice(err.message);
    }
  }

  if (loading) return <Loading label="Loading the team" />;
  if (error) {
    return (
      <Note tone="critical" title="Could not load the team">
        {error}
      </Note>
    );
  }

  return (
    <div>
      <PageHeader
        title="BD team"
        sub="Add a language here and re-run routing to clear the matching coverage gap."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            Add BD
          </button>
        }
      />

      {notice && (
        <div className="mb-8">
          <Note onClose={() => setNotice(null)}>{notice}</Note>
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr>
            <th className="th">BD</th>
            <th className="th">Languages</th>
            <th className="th">Region</th>
            <th className="th">Load today</th>
            <th className="th pr-0" />
          </tr>
        </thead>
        <tbody>
          {data.map((bd) => {
            const used = bd.currentLoad ?? 0;
            const capacity = bd.dailyCapacity || 1;
            return (
              <tr key={bd._id}>
                <td className="td">
                  <span className="block font-medium text-ink">
                    {bd.name}
                    {!bd.isActive && (
                      <span className="ml-2 text-[11px] font-normal uppercase tracking-[0.07em] text-ink-3">
                        off today
                      </span>
                    )}
                  </span>
                  <span className="block text-[12px] text-ink-3">{bd.email || 'no email'}</span>
                </td>
                <td className="td">
                  {bd.languages.length ? (
                    <span className="text-[13px]">
                      {bd.languages.map((l, i) => (
                        <span key={l.code}>
                          {i > 0 && <span className="text-ink-3"> · </span>}
                          <span className={l.proficiency === 'native' ? 'font-medium text-ink' : 'text-ink-2'}>
                            {languageLabel(l.code)}
                          </span>
                          <span className="text-ink-3"> {l.proficiency}</span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-[13px] font-medium text-critical">
                      No languages set — unroutable
                    </span>
                  )}
                </td>
                <td className="td">{bd.region ? titleCase(bd.region) : '-'}</td>
                <td className="td">
                  <span className="flex items-center gap-2.5">
                    <span className="tabular text-[13px] text-ink">
                      {used}/{capacity}
                    </span>
                    <span className="h-[3px] w-14 rounded-full bg-rule">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: Math.min(100, (used / capacity) * 100) + '%' }}
                      />
                    </span>
                  </span>
                </td>
                <td className="td pr-0 text-right">
                  <button
                    type="button"
                    className="text-[12px] text-ink-3 underline underline-offset-2 hover:text-ink"
                    onClick={() => setEditing(bd)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-4 text-[12px] text-ink-3 underline underline-offset-2 hover:text-critical"
                    onClick={() => remove(bd)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {adding && <BDModal open onClose={() => setAdding(false)} onSaved={refresh} initial={{ ...emptyBD }} />}
      {editing && (
        <BDModal open key={editing._id} initial={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      )}
    </div>
  );
}
