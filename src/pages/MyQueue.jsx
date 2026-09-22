import { useState } from 'react';
import { api } from '../api.js';
import { useRole } from '../context/RoleContext.jsx';
import { useAsync } from '../lib/useAsync.js';
import { Empty, Languages, Loading, Modal, Note, PageHeader, Source } from '../components/ui.jsx';
import { effectiveLanguages, languageLabel, LANGUAGE_LABELS, OUTCOME_LABELS } from '../lib/format.js';

const OUTCOMES = ['connected', 'converted', 'not_interested', 'no_answer', 'language_barrier'];
const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS);

function LogCallModal({ lead, bdId, onClose, onLogged }) {
  const [outcome, setOutcome] = useState('connected');
  const [observed, setObserved] = useState([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const barrier = outcome === 'language_barrier';

  function toggleObserved(code) {
    setObserved((current) =>
      current.includes(code) ? current.filter((c) => c !== code) : [...current, code],
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (barrier && !observed.length) {
      setError('Please select the language the learner actually speaks.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.logCall({ leadId: lead._id, bdId, outcome, notes, observedLanguages: observed });
      onLogged(outcome);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={'Log a call with ' + lead.name} sub={lead.phone || 'No phone number'}>
      <form onSubmit={submit} className="space-y-6">
        {error && <Note tone="critical">{error}</Note>}
        
        <fieldset>
          <legend className="label">How did the call go?</legend>
          <div className="mt-3 space-y-1 rounded-xl border border-rule bg-white p-2">
            {OUTCOMES.map((code) => (
              <label
                key={code}
                className={
                  'flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-colors ' +
                  (outcome === code ? 'bg-accent-light' : 'hover:bg-panel')
                }
              >
                <input
                  type="radio"
                  name="outcome"
                  value={code}
                  checked={outcome === code}
                  onChange={() => setOutcome(code)}
                  className="h-5 w-5 accent-accent"
                />
                <div className="flex-1">
                  <span className="text-[15px] font-medium text-ink">{OUTCOME_LABELS[code]}</span>
                  {code === 'language_barrier' && (
                    <span className="ml-2 text-[13px] text-ink">(sends back for re-routing)</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">
            {barrier ? 'What language did they speak?' : 'Language heard on the call'}
          </legend>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
            {barrier
              ? 'Required. This helps route them to the right BD next time.'
              : 'Optional - record if different from what we have.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(([code, label]) => {
              const on = observed.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleObserved(code)}
                  className={
                    'rounded-lg px-4 py-2 text-[14px] font-medium transition-all ' +
                    (on
                      ? 'bg-accent text-white'
                      : 'border border-rule bg-white text-ink-2 hover:border-accent')
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="label">Notes (optional)</span>
          <textarea
            className="field mt-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about the call..."
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-rule pt-5">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving...' : 'Save Outcome'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function MyQueue() {
  const { actor, isAdmin, bds } = useRole();
  const bdId = isAdmin ? bds[0]?._id : actor.bdId;
  const { data, error, loading, refreshing, reload } = useAsync(
    () => (bdId ? api.queue(bdId) : Promise.resolve(null)),
    [bdId],
  );
  const [logging, setLogging] = useState(null);
  const [notice, setNotice] = useState(null);

  if (!bdId || loading) return <Loading label="Loading your queue" />;
  if (error) {
    return (
      <Note tone="critical" title="Could not load the queue">
        {error}
      </Note>
    );
  }

  const { bd, leads } = data;

  return (
    <div className={'transition-opacity duration-200 ' + (refreshing ? 'opacity-50' : '')}>
      <PageHeader
        title={isAdmin ? bd.name + "'s Queue" : 'My Queue'}
        sub={'Every learner here shares a language with you: ' + bd.languages.map((l) => languageLabel(l.code)).join(', ') + '.'}
      />

      {isAdmin && (
        <div className="mb-8">
          <Note title="You are viewing a BD's queue as the admin">
            Switch to {bd.name} from the menu at the top right.
          </Note>
        </div>
      )}

      {notice && (
        <div className="mb-8">
          <Note
            tone={notice.outcome === 'language_barrier' ? 'critical' : 'neutral'}
            title={notice.outcome === 'language_barrier' ? 'Sent back for re-routing' : 'Call logged'}
            onClose={() => setNotice(null)}
          >
            {notice.outcome === 'language_barrier'
              ? 'Lead returned to the pool for re-routing.'
              : 'Call logged successfully.'}
          </Note>
        </div>
      )}

      {!leads.length ? (
        <Empty title="Nothing in your queue">
          Nothing is assigned to you right now. An admin can run routing to distribute leads.
        </Empty>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div
              key={lead._id}
              className="rounded-xl border border-rule bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-bold text-ink">{lead.name}</h3>
                    {lead.status === 'contacted' && (
                      <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-[12px] font-semibold text-accent">
                        Called
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[14px] text-ink-3">
                    {[lead.city, lead.state].filter(Boolean).join(', ') || 'Location unknown'}
                    {lead.course ? ' · ' + lead.course : ''}
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-accent bg-white px-3 py-2">
                    <span className="text-[13px] font-semibold text-ink">Speak in:</span>
                    <span className="text-[16px] font-bold text-accent">
                      {languageLabel(lead.speakInLanguage)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Languages codes={effectiveLanguages(lead)} />
                    <Source source={lead.languageSource} />
                  </div>
                  {lead.languageSource !== 'explicit' && lead.languageSource !== 'confirmed' && (
                    <p className="mt-2 text-[13px] text-ink-3">
                      Language was inferred - please confirm on call.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <a className="btn inline-flex items-center justify-center" href={'tel:' + (lead.phone || '')}>
                    <span className="text-[16px]">📞</span>
                    <span>{lead.phone || 'No number'}</span>
                  </a>
                  <button type="button" className="btn btn-primary" onClick={() => setLogging(lead)}>
                    Log Call
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {logging && (
        <LogCallModal
          lead={logging}
          bdId={bdId}
          onClose={() => setLogging(null)}
          onLogged={(outcome) => {
            setNotice({ outcome });
            reload();
          }}
        />
      )}
    </div>
  );
}
