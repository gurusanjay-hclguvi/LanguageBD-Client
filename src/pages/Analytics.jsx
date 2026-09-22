import { api } from '../api.js';
import { useAsync } from '../lib/useAsync.js';
import { Loading, Note, PageHeader, Section, Stat, StatRow } from '../components/ui.jsx';
import { BarrierTrendChart, BdLoadChart, LanguageCoverageChart, OutcomeChart, PipelineBar } from '../components/charts.jsx';

export default function Analytics() {
  const { data, error, loading } = useAsync(() => api.analytics(), []);

  if (loading) return <Loading label="Loading" />;
  if (error) return <Note tone="critical" title="Error">{error}</Note>;

  const { kpis, statusCounts, languageCoverage, bdLoad, barrierTrend, outcomeCounts, coverageGaps, projection, inferenceAccuracy } = data;

  return (
    <div>
      <PageHeader title="Impact" sub="What language routing achieves." />

      <div className="rounded-xl border border-rule bg-white p-6">
        <StatRow>
          <Stat label="Barrier Rate" value={kpis.barrierRate} unit="%" hint={kpis.barrierCalls + ' of ' + kpis.totalCalls + ' calls'} />
          <Stat label="Calls Saved" value={kpis.callsSaved} hint="Estimated" />
          <Stat label="Avg Match" value={kpis.avgMatchScore} unit="/100" hint="Routed leads" />
          <Stat label="Unservable" value={kpis.unroutable} hint={coverageGaps.length ? coverageGaps.map((g) => g.label).join(', ') : 'All covered'} />
        </StatRow>
      </div>

      <div className="mt-10 space-y-10">
        <BarrierTrendChart data={barrierTrend} />
        <LanguageCoverageChart data={languageCoverage} />
        <OutcomeChart outcomeCounts={outcomeCounts} />
        <BdLoadChart data={bdLoad} />

        <Section title="Pipeline" sub="Lead status breakdown">
          <PipelineBar statusCounts={statusCounts} />
        </Section>

        {coverageGaps.length > 0 && (
          <Section title="Coverage Gaps" sub="Languages without a BD">
            <div className="space-y-4">
              {coverageGaps.map((gap) => (
                <div key={gap.code} className="rounded-xl border border-rule bg-white p-5">
                  <h3 className="text-[17px] font-bold text-ink">{gap.label}</h3>
                  <p className="mt-1 text-[15px] text-ink-2">{gap.primaryLeads} leads, {gap.unroutableLeads} unrouted.</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Inference Accuracy" sub="How good are our guesses?">
          {inferenceAccuracy?.graded ? (
            <div>
              <div className="rounded-lg bg-accent-light p-5">
                <p className="text-[15px] text-ink">Of {inferenceAccuracy.graded} confirmed leads, region guess was right <strong className="text-accent">{inferenceAccuracy.accuracy}%</strong> of the time.</p>
              </div>
              <div className="mt-6 overflow-hidden rounded-xl border border-rule bg-white">
                <table className="w-full">
                  <thead className="bg-panel">
                    <tr>
                      <th className="th px-5 py-4">State</th>
                      <th className="th px-5 py-4">Graded</th>
                      <th className="th px-5 py-4">Correct</th>
                      <th className="th px-5 py-4">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inferenceAccuracy.byState.map((row) => (
                      <tr key={row.state} className="border-t border-rule">
                        <td className="td px-5 py-4 font-semibold text-ink">{row.state}</td>
                        <td className="td px-5 py-4">{row.graded}</td>
                        <td className="td px-5 py-4">{row.hits}</td>
                        <td className={'td px-5 py-4 font-bold ' + (row.accuracy < 50 ? 'text-ink' : 'text-accent')}>{row.accuracy}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-[15px] text-ink-3">{inferenceAccuracy?.note ?? 'No confirmed calls yet.'}</p>
          )}
        </Section>


      </div>
    </div>
  );
}
