import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync } from '../lib/useAsync.js';
import { Empty, Loading, Note, PageHeader, Section, Stat, StatRow } from '../components/ui.jsx';
import { LanguageCoverageChart, PipelineBar } from '../components/charts.jsx';
import { languageLabel, OUTCOME_LABELS, relativeTime } from '../lib/format.js';

const article = (word) => (/^[AEIOU]/.test(word) ? 'an' : 'a');

export default function Dashboard() {
  const { data, error, loading, refreshing, reload } = useAsync(() => api.analytics(), []);
  const [routing, setRouting] = useState(false);
  const [result, setResult] = useState(null);

  async function runRouting() {
    setRouting(true);
    try {
      setResult(await api.runRouting());
      await reload();
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setRouting(false);
    }
  }

  if (loading) return <Loading label="Loading" />;
  if (error) {
    return (
      <Note tone="critical" title="Could not reach the API">
        {error}
      </Note>
    );
  }

  const { kpis, statusCounts, sourceCounts, coverageGaps, languageCoverage, recentCalls } = data;

  return (
    <div className={'transition-opacity duration-200 ' + (refreshing ? 'opacity-50' : '')}>
      <PageHeader
        title="Overview"
        sub="Every lead goes to a BD who shares a language with them."
        actions={
          <button type="button" className="btn btn-primary" onClick={runRouting} disabled={routing}>
            {routing ? 'Routing...' : 'Run Routing'}
          </button>
        }
      />

      {result && !result.error && (
        <div className="mb-8">
          <Note title="Routing finished" onClose={() => setResult(null)}>
            Matched <strong>{result.assigned}</strong> of {result.processed} leads.
            {result.unroutable > 0 && (
              <> {result.unroutable} could not be routed.</>
            )}
          </Note>
        </div>
      )}
      {result?.error && (
        <div className="mb-8">
          <Note tone="critical" title="Routing failed" onClose={() => setResult(null)}>
            {result.error}
          </Note>
        </div>
      )}

      <div className="rounded-xl border border-rule bg-white p-6">
        <StatRow>
          <Stat label="Leads" value={kpis.totalLeads} hint={kpis.waiting + ' waiting'} />
          <Stat label="Matched" value={kpis.routedRate} unit="%" hint={kpis.routed + ' routed'} />
          <Stat label="Unroutable" value={kpis.unroutable} hint="No BD speaks their language" />
          <Stat label="Calls Saved" value={kpis.callsSaved} hint="Estimated" />
        </StatRow>
      </div>

      {coverageGaps.length > 0 && (
        <div className="mt-6">
          <Note tone="critical" title="Coverage gaps">
            <ul className="mt-2 space-y-2">
              {coverageGaps.map((gap) => (
                <li key={gap.code} className="text-[15px]">
                  <span className="font-bold text-ink">{gap.label}</span> — {gap.primaryLeads} leads, no BD available.{' '}
                  <Link to="/team" className="link">Add {article(gap.label)} {gap.label} speaker</Link>
                </li>
              ))}
            </ul>
          </Note>
        </div>
      )}

      <div className="mt-10 space-y-10">
        <Section title="Pipeline" sub="Where every lead stands">
          <PipelineBar statusCounts={statusCounts} />

          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-rule pt-6 sm:grid-cols-4">
            {[
              { key: 'confirmed', label: 'Confirmed on call' },
              { key: 'explicit', label: 'Declared on form' },
              { key: 'inferred', label: 'Inferred from region' },
              { key: 'unknown', label: 'Unknown' },
            ].map(({ key, label }) => (
              <div key={key} className="rounded-lg bg-panel p-4">
                <dt className="text-[13px] font-semibold uppercase tracking-[0.05em] text-ink-3">{label}</dt>
                <dd className="mt-2 text-[28px] font-bold leading-none text-ink">{sourceCounts[key] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <LanguageCoverageChart data={languageCoverage} />

        <Section title="Recent Calls" sub="Latest call outcomes">
          {recentCalls.length ? (
            <div className="overflow-hidden rounded-xl border border-rule">
              <table className="w-full">
                <thead className="bg-panel">
                  <tr>
                    <th className="th px-5 py-4">Lead</th>
                    <th className="th px-5 py-4">BD</th>
                    <th className="th px-5 py-4">Outcome</th>
                    <th className="th px-5 py-4 text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map((call) => (
                    <tr key={call.id} className="border-t border-rule">
                      <td className="td px-5 py-4 font-medium text-ink">{call.lead}</td>
                      <td className="td px-5 py-4">{call.bd}</td>
                      <td className="td px-5 py-4">{OUTCOME_LABELS[call.outcome]}</td>
                      <td className="td px-5 py-4 text-right text-ink-3">{relativeTime(call.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="No calls logged">Switch to a BD and log a call.</Empty>
          )}
        </Section>
      </div>
    </div>
  );
}
