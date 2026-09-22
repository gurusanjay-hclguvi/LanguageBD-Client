import { useRef, useState } from 'react';
import { api, apiUrl } from '../api.js';
import { Languages, Note, PageHeader, Section, Source } from '../components/ui.jsx';

export default function Import() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [routed, setRouted] = useState(null);
  const [error, setError] = useState(null);

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setRouted(null);
    try {
      setResult(await api.importCsv(file));
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function routeBatch() {
    setBusy(true);
    try {
      setRouted(await api.runRouting());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const blocking = result?.errors?.filter((e) => e.severity !== 'warning') ?? [];
  const warnings = result?.errors?.filter((e) => e.severity === 'warning') ?? [];

  return (
    <div>
      <PageHeader
        title="Import leads"
        sub="Drop in a CSV export. Rows without a language are not rejected — their region is used to work out what they most likely speak."
        actions={
          <a className="btn" href={apiUrl('/leads/template.csv')}>
            Download template
          </a>
        }
      />

      {error && (
        <div className="mb-8">
          <Note tone="critical" title="Import failed" onClose={() => setError(null)}>
            {error}
          </Note>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files?.[0]);
        }}
        className={
          'flex flex-col items-center gap-4 rounded-md border border-dashed px-6 py-16 text-center transition-colors ' +
          (dragging ? 'border-ink bg-panel' : 'border-rule')
        }
      >
        <div>
          <p className="text-[14px] font-medium text-ink">Drop a CSV here</p>
          <p className="mt-1 text-[12px] text-ink-3">
            name, phone, email, city, state, course, preferred_languages
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? 'Working…' : 'Choose a file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </div>

      {result && (
        <div className="mt-12 space-y-12">
          <section>
            <div className="grid grid-cols-3 border-y border-rule py-6">
              {[
                { label: 'Rows read', value: result.rows, tone: 'neutral' },
                { label: 'Leads created', value: result.inserted, tone: 'neutral' },
                { label: 'Rows skipped', value: result.skipped, tone: result.skipped ? 'critical' : 'neutral' },
              ].map((s) => (
                <div key={s.label} className="px-6 first:pl-0 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-rule">
                  <p className="text-[11px] uppercase tracking-[0.07em] text-ink-3">{s.label}</p>
                  <p
                    className={
                      'mt-2 text-[30px] font-medium leading-none ' +
                      (s.tone === 'critical' ? 'text-critical' : 'text-ink')
                    }
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {routed ? (
                <Note title="Batch routed">
                  {routed.assigned} leads matched to a BD.
                  {routed.unroutable > 0 &&
                    ' ' + routed.unroutable + ' still have nobody on the roster who speaks their language.'}
                </Note>
              ) : (
                result.inserted > 0 && (
                  <button type="button" className="btn btn-primary" onClick={routeBatch} disabled={busy}>
                    Route these leads now
                  </button>
                )
              )}
            </div>
          </section>

          {(blocking.length > 0 || warnings.length > 0) && (
            <Section title="Rows that needed attention" sub="A bad row never fails the whole batch">
              <ul className="border-t border-rule">
                {[...blocking, ...warnings].map((e, i) => (
                  <li key={i} className="border-b border-rule py-3 text-[13px]">
                    <span className="mr-3 text-[12px] uppercase tracking-[0.07em] text-ink-3">
                      Row {e.row}
                    </span>
                    <span className={e.severity === 'warning' ? 'text-ink-2' : 'text-critical'}>
                      {e.error}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {result.preview.length > 0 && (
            <Section
              title="What we worked out about these learners"
              sub="First few rows, showing the language the router will match on"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr>
                      <th className="th">Learner</th>
                      <th className="th">Location</th>
                      <th className="th">Languages</th>
                      <th className="th pr-0">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i}>
                        <td className="td font-medium text-ink">{row.name}</td>
                        <td className="td">{[row.city, row.state].filter(Boolean).join(', ') || '-'}</td>
                        <td className="td">
                          <Languages codes={row.languages} />
                        </td>
                        <td className="td pr-0">
                          <Source source={row.languageSource} />
                          <span className="mt-0.5 block max-w-xs text-[12px] leading-snug text-ink-3">
                            {row.languageBasis}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
