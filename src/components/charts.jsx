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

/*
 * Chart conventions used throughout this file:
 *   - one measure per plot and one axis - never two y-scales;
 *   - thin marks, hairline grid, recessive axes; no dashed rules anywhere;
 *   - a single series needs no legend (the heading names it);
 *   - the accent carries data, red carries the one problem state, and red is
 *     always paired with a word so colour is never doing the work alone;
 *   - every chart has a table-view twin, so no value is reachable by hover only.
 */

const AXIS = { fill: 'var(--color-ink-3)', fontSize: 11 };
const RULE = 'var(--color-rule)';
const DATA = 'var(--color-accent)';
const PROBLEM = 'var(--color-critical)';

/** A chart block: heading, plot, and a text toggle to its table equivalent. */
export function ChartBlock({ title, sub, height = 260, columns, rows, footnote, children }) {
  const [view, setView] = useState('chart');

  return (
    <section className="border-t border-rule pt-6">
      <div className="mb-5 flex items-start justify-between gap-6">
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
          {sub && <p className="mt-0.5 max-w-xl text-[12px] leading-relaxed text-ink-3">{sub}</p>}
        </div>
        {columns && (
          <button
            type="button"
            onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
            className="shrink-0 text-[12px] text-ink-3 transition-colors hover:text-ink"
          >
            {view === 'chart' ? 'Table' : 'Chart'}
          </button>
        )}
      </div>

      {view === 'chart' ? (
        <div style={{ height }}>{children}</div>
      ) : (
        <div className="max-h-[340px] overflow-auto">
          <table className="w-full">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c} className="th">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={'td ' + (j ? 'tabular' : 'text-ink')}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {footnote && <p className="mt-4 text-[12px] text-ink-3">{footnote}</p>}
    </section>
  );
}

function TooltipBox({ active, payload, label, render }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-rule bg-paper px-3 py-2 text-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
      <p className="font-medium text-ink">{label}</p>
      <div className="mt-0.5 space-y-0.5 text-ink-2">{render(payload[0].payload)}</div>
    </div>
  );
}

/**
 * Lead demand per language, one measure on one axis. The BD headcount rides
 * along as a direct label rather than as a second y-scale, and a language
 * nobody can serve is red AND reads "no BD".
 */
export function LanguageCoverageChart({ data }) {
  const rows = data
    .filter((d) => d.leads > 0)
    .slice(0, 9)
    .map((d) => ({
      ...d,
      name: languageLabel(d.code),
      // Precomputed, because a bar label formatter only reliably sees its own value.
      bdLabel: d.bds ? d.bds + (d.bds > 1 ? ' BDs' : ' BD') : 'no BD',
    }));

  return (
    <ChartBlock
      title="Languages our leads are asking for"
      sub="Leads per language, with the number of BDs who speak it"
      height={Math.max(220, rows.length * 32 + 36)}
      columns={['Language', 'Leads', 'BDs who speak it', 'Daily capacity']}
      rows={rows.map((r) => [r.name, r.leads, r.bds, r.capacity])}
      footnote="Red marks a language with nobody on the roster to call it."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 2, right: 64, bottom: 2, left: 2 }}
          barCategoryGap={7}
        >
          <CartesianGrid horizontal={false} stroke={RULE} strokeDasharray="0" />
          <XAxis type="number" tick={AXIS} axisLine={{ stroke: RULE }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={92} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'var(--color-panel)' }}
            content={(p) => (
              <TooltipBox
                {...p}
                render={(d) => (
                  <>
                    <p>{d.leads} leads</p>
                    <p>
                      {d.bds
                        ? d.bds + ' BD' + (d.bds > 1 ? 's' : '') + ' speak it · ' + d.capacity + ' calls/day'
                        : 'No BD speaks this language'}
                    </p>
                  </>
                )}
              />
            )}
          />
          <Bar dataKey="leads" radius={[0, 3, 3, 0]} barSize={13} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.code} fill={r.bds ? DATA : PROBLEM} />
            ))}
            <LabelList dataKey="bdLabel" position="right" fontSize={11} fill="var(--color-ink-3)" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBlock>
  );
}

/** Measured language-barrier rate over time. One series, so no legend. */
export function BarrierTrendChart({ data }) {
  const rows = data.map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  }));

  return (
    <ChartBlock
      title="Calls lost to a language barrier"
      sub="Share of logged calls that ended because the learner and the BD had no language in common"
      columns={['Day', 'Calls', 'Language barriers', 'Barrier rate %']}
      rows={rows.map((r) => [r.label, r.calls, r.barriers, r.barrierRate])}
      footnote="Measured from the call log - not a projection."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 44, bottom: 2, left: 0 }}>
          <CartesianGrid vertical={false} stroke={RULE} strokeDasharray="0" />
          <XAxis dataKey="label" tick={AXIS} axisLine={{ stroke: RULE }} tickLine={false} minTickGap={20} />
          <YAxis
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            width={40}
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
                    <p>{d.barrierRate}% hit a language barrier</p>
                    <p>
                      {d.barriers} of {d.calls} calls
                    </p>
                  </>
                )}
              />
            )}
          />
          <Line
            type="linear"
            dataKey="barrierRate"
            stroke={DATA}
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-paper)', stroke: DATA, strokeWidth: 2 }}
            activeDot={{ r: 4.5, strokeWidth: 2 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="barrierRate"
              position="right"
              fontSize={11}
              fill="var(--color-ink-3)"
              content={({ index, x, y, value }) =>
                index === rows.length - 1 ? (
                  <text x={x + 8} y={y + 4} fill="var(--color-ink-3)" fontSize={11}>
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

/** Assigned leads against each BD's daily capacity - one unit, one axis. */
export function BdLoadChart({ data }) {
  const rows = data.map((d) => ({ ...d, headroom: Math.max(0, d.capacity - d.assigned) }));

  return (
    <ChartBlock
      title="How the work is spread"
      sub="Leads currently assigned against each BD's capacity for the day"
      height={Math.max(240, rows.length * 28 + 36)}
      columns={['BD', 'Assigned', 'Capacity', 'Utilisation %']}
      rows={rows.map((r) => [r.name, r.assigned, r.capacity, r.utilisation])}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 2, right: 12, bottom: 2, left: 2 }}
          barCategoryGap={5}
        >
          <CartesianGrid horizontal={false} stroke={RULE} strokeDasharray="0" />
          <XAxis type="number" tick={AXIS} axisLine={{ stroke: RULE }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={150} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'var(--color-panel)' }}
            content={(p) => (
              <TooltipBox
                {...p}
                render={(d) => (
                  <>
                    <p>
                      {d.assigned} of {d.capacity} slots used · {d.utilisation}%
                    </p>
                    <p>{d.languages.map(languageLabel).join(' · ')}</p>
                  </>
                )}
              />
            )}
          />
          {/* Stacked against remaining headroom: the same unit, so this is a
              capacity track rather than a second scale. */}
          <Bar dataKey="assigned" stackId="load" fill={DATA} barSize={11} isAnimationActive={false} />
          <Bar
            dataKey="headroom"
            stackId="load"
            fill="var(--color-rule)"
            stroke="var(--color-paper)"
            strokeWidth={2}
            barSize={11}
            radius={[0, 3, 3, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartBlock>
  );
}

/** Call outcomes. One colour, with the outcome that matters flagged in red. */
export function OutcomeChart({ outcomeCounts }) {
  const rows = Object.entries(outcomeCounts)
    .map(([code, count]) => ({ code, name: OUTCOME_LABELS[code] ?? code, count }))
    .sort((a, b) => b.count - a.count);

  if (!rows.length) return null;

  return (
    <ChartBlock
      title="What happened on the calls"
      sub="Every logged call outcome"
      height={Math.max(200, rows.length * 32 + 36)}
      columns={['Outcome', 'Calls']}
      rows={rows.map((r) => [r.name, r.count])}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 2, right: 28, bottom: 2, left: 2 }}
          barCategoryGap={7}
        >
          <CartesianGrid horizontal={false} stroke={RULE} strokeDasharray="0" />
          <XAxis type="number" tick={AXIS} axisLine={{ stroke: RULE }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={118} tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'var(--color-panel)' }}
            content={(p) => <TooltipBox {...p} render={(d) => <p>{d.count} calls</p>} />}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={13} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.code} fill={r.code === 'language_barrier' ? PROBLEM : DATA} />
            ))}
            <LabelList dataKey="count" position="right" fontSize={11} fill="var(--color-ink-3)" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBlock>
  );
}

/**
 * Part-to-whole across the pipeline: a single stacked bar, not a donut.
 * The three pipeline stages are ordered, so they take an ordinal one-hue ramp;
 * "no BD available" is a problem state, so it is red. Every segment is
 * direct-labelled below with its count.
 */
export function PipelineBar({ statusCounts }) {
  const order = [
    { key: 'new', color: 'var(--color-stage-1)' },
    { key: 'assigned', color: 'var(--color-stage-2)' },
    { key: 'contacted', color: 'var(--color-stage-3)' },
    { key: 'unroutable', color: PROBLEM },
  ];
  const total = order.reduce((s, o) => s + (statusCounts[o.key] ?? 0), 0);
  if (!total) return null;

  return (
    <div>
      <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full">
        {order.map((o) => {
          const count = statusCounts[o.key] ?? 0;
          if (!count) return null;
          return (
            <div
              key={o.key}
              style={{ width: (count / total) * 100 + '%', background: o.color }}
              title={STATUS_LABELS[o.key] + ': ' + count}
            />
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-2">
        {order.map((o) => {
          const count = statusCounts[o.key] ?? 0;
          return (
            <li key={o.key} className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: o.color }}
                aria-hidden="true"
              />
              <span className="text-ink-2">{STATUS_LABELS[o.key]}</span>
              <span className="tabular font-medium text-ink">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
