import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { languageLabel, OUTCOME_LABELS, STATUS_LABELS } from '../lib/format.js';

/* Chart colors - green accent only */
const AXIS = { fill: 'var(--color-ink)', fontSize: 14, fontWeight: 500 };
const RULE = 'var(--color-rule)';
const DATA = 'var(--color-accent)';
const DATA_LIGHT = '#86efac'; /* Light green */
const DATA_LIGHTER = '#bbf7d0'; /* Lighter green */
const INK = 'var(--color-ink)';
const INK_2 = 'var(--color-ink-2)';
const INK_3 = 'var(--color-ink-3)';

export function ChartBlock({ title, sub, height = 300, columns, rows, footnote, children }) {
  const [view, setView] = useState('chart');

  return (
    <section className="border-t border-rule pt-8">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h2 className="text-[17px] font-bold text-ink">{title}</h2>
          {sub && <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-ink-3">{sub}</p>}
        </div>
        {columns && (
          <button
            type="button"
            onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
            className="shrink-0 text-[14px] font-medium text-accent hover:underline"
          >
            {view === 'chart' ? 'View Table' : 'View Chart'}
          </button>
        )}
      </div>

      {view === 'chart' ? (
        <div style={{ height }}>{children}</div>
      ) : (
        <div className="max-h-[400px] overflow-auto rounded-xl border border-rule">
          <table className="w-full">
            <thead className="bg-panel">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="th px-5 py-4">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-rule">
                  {row.map((cell, j) => (
                    <td key={j} className={'td px-5 py-4 ' + (j ? 'tabular' : 'font-medium text-ink')}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {footnote && <p className="mt-4 text-[15px] text-ink-3">{footnote}</p>}
    </section>
  );
}

function TooltipBox({ active, payload, label, render }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-rule bg-white px-4 py-3 text-[15px] shadow-lg">
      <p className="font-bold text-ink">{label}</p>
      <div className="mt-1 space-y-1 text-ink-2">{render(payload[0].payload)}</div>
    </div>
  );
}

export function LanguageCoverageChart({ data }) {
  const withLeads = data.filter((d) => d.leads > 0);
  // Coverage gaps (no BD at all) are the signal this chart exists to surface,
  // so they always make the cut even if a covered language has more leads.
  const gaps = withLeads.filter((d) => d.bds === 0);
  const covered = withLeads.filter((d) => d.bds > 0).slice(0, Math.max(0, 9 - gaps.length));
  const rows = [...gaps, ...covered]
    .sort((a, b) => b.leads - a.leads)
    .map((d) => ({
      ...d,
      name: languageLabel(d.code),
      bdLabel: d.bds ? d.bds + (d.bds > 1 ? ' BDs' : ' BD') : 'no BD',
    }));

  return (
    <ChartBlock
      title="Languages Our Leads Speak"
      sub="Leads per language with available BDs"
      height={Math.max(280, rows.length * 40 + 40)}
      columns={['Language', 'Leads', 'BDs', 'Capacity']}
      rows={rows.map((r) => [r.name, r.leads, r.bds || '-', r.capacity || '-'])}
      footnote="Languages without a BD are shown in black."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 80, bottom: 4, left: 4 }}
          barCategoryGap={8}
        >
          <CartesianGrid horizontal={false} stroke={RULE} strokeDasharray="0" />
          <XAxis type="number" tick={AXIS} axisLine={{ stroke: RULE }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={110} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'var(--color-panel)' }}
            content={(p) => (
              <TooltipBox
                {...p}
                render={(d) => (
                  <>
                    <p><strong>{d.leads}</strong> leads</p>
                    <p>{d.bds ? d.bds + ' BDs · ' + d.capacity + ' calls/day' : 'No BD available'}</p>
                  </>
                )}
              />
            )}
          />
          <Bar dataKey="leads" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.code} fill={r.bds ? DATA : INK} />
            ))}
            <LabelList dataKey="bdLabel" position="right" fontSize={14} fill={INK_2} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBlock>
  );
}

export function BarrierTrendChart({ data }) {
  const rows = data.map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  }));

  return (
    <ChartBlock
      title="Language Barrier Rate Over Time"
      sub="Percentage of calls that hit a language barrier"
      columns={['Day', 'Calls', 'Barriers', 'Rate %']}
      rows={rows.map((r) => [r.label, r.calls, r.barriers, r.barrierRate])}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 16, right: 60, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke={RULE} strokeDasharray="0" />
          <XAxis dataKey="label" tick={AXIS} axisLine={{ stroke: RULE }} tickLine={false} minTickGap={30} />
          <YAxis
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            width={50}
            unit="%"
            domain={[0, (max) => Math.max(20, Math.ceil(max / 10) * 10)]}
          />
          <Tooltip
            cursor={{ stroke: RULE, strokeWidth: 1 }}
            content={(p) => (
              <TooltipBox
                {...p}
                render={(d) => (
                  <>
                    <p><strong>{d.barrierRate}%</strong> hit a barrier</p>
                    <p>{d.barriers} of {d.calls} calls</p>
                  </>
                )}
              />
            )}
          />
          <Line
            type="linear"
            dataKey="barrierRate"
            stroke={DATA}
            strokeWidth={3}
            dot={{ r: 5, fill: 'var(--color-paper)', stroke: DATA, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="barrierRate"
              position="right"
              fontSize={14}
              fill={INK_2}
              content={({ index, x, y, value }) =>
                index === rows.length - 1 ? (
                  <text x={x + 10} y={y + 5} fill={INK_2} fontSize={14} fontWeight={500}>
                    {value}%
                  </text>
                ) : null
              }
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </ChartBlock>
  );
}

export function BdLoadChart({ data }) {
  const rows = data.map((d) => ({ ...d, headroom: Math.max(0, d.capacity - d.assigned) }));

  return (
    <ChartBlock
      title="BD Workload Distribution"
      sub="Assigned leads vs daily capacity"
      height={Math.max(300, rows.length * 36 + 40)}
      columns={['BD', 'Assigned', 'Capacity', 'Utilisation %']}
      rows={rows.map((r) => [r.name, r.assigned, r.capacity, r.utilisation])}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 20, bottom: 4, left: 4 }}
          barCategoryGap={6}
        >
          <CartesianGrid horizontal={false} stroke={RULE} strokeDasharray="0" />
          <XAxis type="number" tick={AXIS} axisLine={{ stroke: RULE }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={160} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'var(--color-panel)' }}
            content={(p) => (
              <TooltipBox
                {...p}
                render={(d) => (
                  <>
                    <p><strong>{d.assigned}</strong> of {d.capacity} slots ({d.utilisation}%)</p>
                    <p>{d.languages.map(languageLabel).join(' · ')}</p>
                  </>
                )}
              />
            )}
          />
          <Bar dataKey="assigned" stackId="load" fill={DATA} barSize={16} isAnimationActive={false} />
          <Bar
            dataKey="headroom"
            stackId="load"
            fill={RULE}
            stroke="var(--color-paper)"
            strokeWidth={2}
            barSize={16}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartBlock>
  );
}

export function OutcomeChart({ outcomeCounts }) {
  const rows = Object.entries(outcomeCounts)
    .map(([code, count]) => ({ code, name: OUTCOME_LABELS[code] ?? code, count }))
    .sort((a, b) => b.count - a.count);

  if (!rows.length) return null;

  return (
    <ChartBlock
      title="Call Outcomes"
      sub="Results of all logged calls"
      height={Math.max(260, rows.length * 40 + 40)}
      columns={['Outcome', 'Calls']}
      rows={rows.map((r) => [r.name, r.count])}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 50, bottom: 4, left: 4 }}
          barCategoryGap={8}
        >
          <CartesianGrid horizontal={false} stroke={RULE} strokeDasharray="0" />
          <XAxis type="number" tick={AXIS} axisLine={{ stroke: RULE }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={140} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'var(--color-panel)' }}
            content={(p) => <TooltipBox {...p} render={(d) => <p><strong>{d.count}</strong> calls</p>} />}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.code} fill={r.code === 'language_barrier' ? INK : DATA} />
            ))}
            <LabelList dataKey="count" position="right" fontSize={14} fill={INK_2} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBlock>
  );
}

export function PipelineBar({ statusCounts }) {
  const order = [
    { key: 'new', color: DATA_LIGHTER, label: 'Waiting' },
    { key: 'assigned', color: DATA_LIGHT, label: 'Assigned' },
    { key: 'contacted', color: DATA, label: 'Contacted' },
    { key: 'unroutable', color: INK, label: 'No BD' },
  ];
  const total = order.reduce((s, o) => s + (statusCounts[o.key] ?? 0), 0);
  if (!total) return null;

  return (
    <div className="rounded-xl border border-rule bg-white p-6">
      {/* Bar */}
      <div className="flex h-6 w-full gap-1 overflow-hidden rounded-full">
        {order.map((o) => {
          const count = statusCounts[o.key] ?? 0;
          if (!count) return null;
          return (
            <div
              key={o.key}
              style={{ width: (count / total) * 100 + '%', background: o.color }}
              className="transition-all"
              title={STATUS_LABELS[o.key] + ': ' + count}
            />
          );
        })}
      </div>
      
      {/* Legend */}
      <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
        {order.map((o) => {
          const count = statusCounts[o.key] ?? 0;
          return (
            <li key={o.key} className="flex items-center gap-3">
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ background: o.color }}
                aria-hidden="true"
              />
              <span className="text-[15px] text-ink-2">{o.label || STATUS_LABELS[o.key]}</span>
              <span className="text-[17px] font-bold text-ink">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
