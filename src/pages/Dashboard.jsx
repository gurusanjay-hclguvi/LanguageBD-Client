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
        {error}. Check that the server is running on port 4000 and MongoDB is up.
      </Note>
    );
  }

  const { kpis, statusCounts, sourceCounts, coverageGaps, languageCoverage, recentCalls, projection } =
    data;

  return (
    <div className={'transition-opacity ' + (refreshing ? 'opacity-50' : '')}>
      <PageHeader
        title="Routing overview"
        sub="Every lead goes to a BD who shares a language with them — or is held back and counted, never handed to someone who cannot speak to them."
        actions={
          <button type="button" className="btn btn-primary" onClick={runRouting} disabled={routing}>
            {routing ? 'Routing…' : 'Run routing'}
          </button>
        }
      />

      {result && !result.error && (
        <div className="mb-8">
          <Note title="Routing finished" onClose={() => setResult(null)}>
            Matched {result.assigned} of {result.processed} waiting leads, average score{' '}
            {result.avgMatchScore}.
            {result.unroutable > 0 && (
              <>
                {' '}
                {result.unroutable} could not be routed:{' '}
                {Object.entries(result.gaps)
                  .map(([code, n]) => n + ' ' + languageLabel(code))
                  .join(', ')}
                .
              </>
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

      <StatRow>
        <Stat label="Leads" value={kpis.totalLeads} hint={kpis.waiting + ' still waiting'} />
        <Stat
          label="Matched"
          value={kpis.routedRate}
          unit="%"
          hint={kpis.routed + ' leads · average score ' + kpis.avgMatchScore + '/100'}
        />
        <Stat
          label="Nobody can call"
          value={kpis.unroutable}
          tone={kpis.unroutable ? 'critical' : 'neutral'}
          hint="No BD on the roster speaks their language"
        />
        <Stat
          label="Wasted calls avoided"
          value={kpis.callsSaved}
          hint="Estimated against round-robin routing"
        />
      </StatRow>

      {coverageGaps.length > 0 && (
        <div className="mt-8">
          <Note tone="critical" title="Coverage gaps">
            <ul className="mt-1 space-y-1">
              {coverageGaps.map((gap) => (
                <li key={gap.code}>
                  <span className="font-medium text-ink">{gap.label}</span> — {gap.primaryLeads}{' '}
                  leads, nobody on the roster speaks it.{' '}
                  <Link to="/team" className="link">
                    Add {article(gap.label)} {gap.label} speaker
                  </Link>
                </li>
              ))}
            </ul>
          </Note>
        </div>
      )}

      <div className="mt-12 space-y-12">
        <Section
          title="Where every lead stands"
          sub="The whole pipeline, including the leads we are deliberately holding back"
        >
          <PipelineBar statusCounts={statusCounts} />

          <dl className="mt-10 grid grid-cols-3 gap-8 border-t border-rule pt-6">
            {[
              { key: 'explicit', label: 'Declared on the form' },
              { key: 'inferred', label: 'Inferred from region' },
              { key: 'unknown', label: 'No signal at all' },
            ].map(({ key, label }) => (
              <div key={key}>
                <dt className="text-[11px] uppercase tracking-[0.07em] text-ink-3">{label}</dt>
                <dd className="mt-1.5 text-[22px] font-medium leading-none text-ink">
                  {sourceCounts[key] ?? 0}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[12px] text-ink-3">
            How we know each learner&apos;s language. An inferred language is a guess from their
            region and is labelled as one everywhere it appears.
          </p>
        </Section>

        <LanguageCoverageChart data={languageCoverage} />

        <Section title="Latest calls" sub="Straight from the BD call log">
          {recentCalls.length ? (
            <table className="w-full">
              <tbody>
                {recentCalls.map((call) => (
                  <tr key={call.id}>
                    <td className="td text-ink">{call.lead}</td>
                    <td className="td">{call.bd}</td>
                    <td
                      className={
                        'td ' + (call.outcome === 'language_barrier' ? 'font-medium text-critical' : '')
                      }
                    >
                      {OUTCOME_LABELS[call.outcome]}
                    </td>
                    <td className="td pr-0 text-right text-ink-3">{relativeTime(call.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty title="No calls logged yet">
              Switch to a BD from the menu at the top right and log a call outcome.
            </Empty>
          )}
        </Section>

        <Section title="What language routing is worth" sub={projection.note}>
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.07em] text-ink-3">
                Round-robin, ignoring language
              </p>
              <p className="mt-2 text-[28px] font-medium leading-none text-critical">
                {projection.naiveWastedRate}%
              </p>
              <p className="mt-2 text-[12px] leading-snug text-ink-3">
                about {projection.naiveWastedCalls} of {projection.leadsConsidered} calls would hit a
                language wall
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.07em] text-ink-3">
                Language-matched routing
              </p>
              <p className="mt-2 text-[28px] font-medium leading-none text-ink">0%</p>
              <p className="mt-2 text-[12px] leading-snug text-ink-3">
                a lead is only ever assigned to someone who shares a language
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.07em] text-ink-3">
                Measured barrier rate
              </p>
              <p className="mt-2 text-[28px] font-medium leading-none text-ink">{kpis.barrierRate}%</p>
              <p className="mt-2 text-[12px] leading-snug text-ink-3">
                {kpis.barrierCalls} of {kpis.totalCalls} logged calls, including calls made before
                routing was switched on
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
