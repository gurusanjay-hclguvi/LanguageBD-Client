import { useRef, useState } from 'react';
import { api, apiUrl } from '../api.js';
import { Languages, Note, PageHeader, Section, Source, Loading } from '../components/ui.jsx';

export default function Import() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api.importCsv(file));
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  const blocking = result?.errors?.filter((e) => e.severity !== 'warning') ?? [];
  const warnings = result?.errors?.filter((e) => e.severity === 'warning') ?? [];

  return (
    <div>
      <PageHeader title="Import Leads" sub="Upload a CSV. Missing languages will be inferred from region." actions={<a className="btn" href={apiUrl('/leads/template.csv')}>Download Template</a>} />

      {error && <div className="mb-8"><Note tone="critical" title="Import failed" onClose={() => setError(null)}>{error}</Note></div>}

      {busy && <Loading label="Processing" />}

      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }}
        className={'flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-all ' + (dragging ? 'border-accent bg-accent-light' : 'border-rule bg-white hover:border-accent')}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p className="text-[18px] font-bold text-ink">Drop a CSV file here</p>
          <p className="mt-2 text-[15px] text-ink-3">name, phone, email, city, state, course, preferred_languages</p>
        </div>
        <button className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? 'Processing...' : 'Choose File'}</button>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </div>

      {result && !busy && (
        <div className="mt-10 space-y-10">
          <section className="rounded-xl border border-rule bg-white p-6">
            <h2 className="text-[18px] font-bold text-ink">Results</h2>
            <div className="mt-6 grid grid-cols-3 gap-6">
              {[{ label: 'Rows Read', value: result.rows }, { label: 'Created', value: result.inserted }, { label: 'Skipped', value: result.skipped }].map((s) => (
                <div key={s.label} className="rounded-lg bg-panel p-5">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-ink-3">{s.label}</p>
                  <p className="mt-2 text-[36px] font-bold leading-none text-ink">{s.value}</p>
                </div>
              ))}
            </div>
            {result.routing && (
              <div className="mt-6">
                <Note title="Routed automatically">
                  {result.routing.assigned} of {result.inserted} leads matched to a BD
                  {result.routing.unroutable > 0 && ' - ' + result.routing.unroutable + ' need a language or capacity you don\'t have yet'}.
                </Note>
              </div>
            )}
          </section>

          {(blocking.length > 0 || warnings.length > 0) && (
            <Section title="Rows with Issues" sub="Bad rows don't fail the batch">
              <ul className="space-y-2">
                {[...blocking, ...warnings].map((e, i) => (
                  <li key={i} className="rounded-lg border border-rule bg-white p-4">
                    <span className="inline-flex items-center rounded-full bg-panel px-2.5 py-0.5 text-[12px] font-semibold uppercase text-ink-3">Row {e.row}</span>
                    <span className="ml-3 text-[15px] text-ink">{e.error}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {result.preview.length > 0 && (
            <Section title="Inferred Languages" sub="First few rows">
              <div className="overflow-hidden rounded-xl border border-rule bg-white">
                <table className="w-full">
                  <thead className="bg-panel">
                    <tr>
                      <th className="th px-5 py-4">Learner</th>
                      <th className="th px-5 py-4">Location</th>
                      <th className="th px-5 py-4">Languages</th>
                      <th className="th px-5 py-4">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i} className="border-t border-rule">
                        <td className="td px-5 py-4 font-semibold text-ink">{row.name}</td>
                        <td className="td px-5 py-4 text-ink-2">{[row.city, row.state].filter(Boolean).join(', ') || '-'}</td>
                        <td className="td px-5 py-4"><Languages codes={row.languages} /></td>
                        <td className="td px-5 py-4"><Source source={row.languageSource} /></td>
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
