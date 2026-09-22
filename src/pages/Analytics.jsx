import { api } from '../api.js';
import { useAsync } from '../lib/useAsync.js';
import { Loading, Note, PageHeader, Section, Stat, StatRow } from '../components/ui.jsx';
import {
  BarrierTrendChart,
  BdLoadChart,
  LanguageCoverageChart,
  OutcomeChart,
  PipelineBar,
} from '../components/charts.jsx';

export default function Analytics() {
  const { data, error, loading } = useAsync(() => api.analytics(), []);

  if (loading) return <Loading label="Crunching the numbers" />;
  if (error) {
    return (
      <Note tone="critical" title="Could not load analytics">
        {error}
      </Note>
    );
  }

  const {
    kpis,
    statusCounts,
    languageCoverage,
    bdLoad,
    barrierTrend,
    outcomeCounts,
    coverageGaps,
    projection,
  } = data;

  return (
    <div>
      <PageHeader
        title="Impact"
        sub="What language-aware routing is actually buying, and where the team is still short."
      />

      <StatRow>
        <Stat
          label="Measured barrier rate"
          value={kpis.barrierRate}
          unit="%"
          tone={kpis.barrierRate > 10 ? 'critical' : 'neutral'}
          hint={kpis.barrierCalls + ' of ' + kpis.totalCalls + ' logged calls'}
        />
        <Stat
          label="Wasted calls avoided"
          value={kpis.callsSaved}
          hint="Versus round-robin — a model estimate"
        />
        <Stat
          label="Average match score"
          value={kpis.avgMatchScore}
          unit="/100"
          hint="Across every routed lead"
        />
        <Stat
          label="Leads nobody can call"
          value={kpis.unroutable}
          tone={kpis.unroutable ? 'critical' : 'neutral'}
          hint={coverageGaps.map((g) => g.label).join(', ') || 'Every language is covered'}
        />
      </StatRow>

      <div className="mt-12 space-y-12">
        <BarrierTrendChart data={barrierTrend} />
        <LanguageCoverageChart data={languageCoverage} />
        <OutcomeChart outcomeCounts={outcomeCounts} />
        <BdLoadChart data={bdLoad} />

        <Section title="Pipeline" sub="Every lead in the system, by where it has got to">
          <PipelineBar statusCounts={statusCounts} />
        </Section>

        {coverageGaps.length > 0 && (
          <Section title="Hiring and upskilling signal" sub="Demand with nobody to serve it">
            <ul className="border-t border-rule">
              {coverageGaps.map((gap) => (
                <li key={gap.code} className="border-b border-rule py-4">
                  <p className="text-[13px] font-medium text-critical">{gap.label}</p>
                  <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-2">
                    {gap.primaryLeads} leads name it as their primary language, {gap.unroutableLeads}{' '}
                    are stuck unrouted, and nobody on the roster speaks it. One {gap.label} speaker
                    would unblock all of them.
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="How the estimate is built" sub="So nobody mistakes the model for measured data">
          <p className="max-w-3xl text-[13px] leading-relaxed text-ink-2">
            Under round-robin assignment, a learner&apos;s chance of reaching a BD who shares a
            language is simply the share of BDs who speak it. Adding up the opposite across all{' '}
            {projection.leadsConsidered} leads gives roughly{' '}
            <span className="font-medium text-ink">{projection.naiveWastedCalls} calls</span> that
            would die on a language barrier — {projection.naiveWastedRate}% of calls. Language-matched
            routing never makes that call at all, which is where the wasted-calls-avoided figure comes
            from. The barrier rate at the top of this page is a different thing entirely: that one is
            counted from calls BDs actually logged.
          </p>
        </Section>
      </div>
    </div>
  );
}
