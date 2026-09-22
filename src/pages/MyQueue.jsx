import { useState } from 'react';
import { api } from '../api.js';
import { useRole } from '../context/RoleContext.jsx';
import { useAsync } from '../lib/useAsync.js';
import { Empty, Languages, Loading, Modal, Note, PageHeader, Source } from '../components/ui.jsx';
import { effectiveLanguages, languageLabel, OUTCOME_LABELS } from '../lib/format.js';

const OUTCOMES = ['connected', 'converted', 'not_interested', 'no_answer', 'language_barrier'];

function LogCallModal({ lead, bdId, onClose, onLogged }) {
  const [outcome, setOutcome] = useState('connected');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.logCall({ leadId: lead._id, bdId, outcome, notes });
      onLogged(outcome);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={'Log a call with ' + lead.name} sub={lead.phone || 'no phone on file'}>
      <form onSubmit={submit} className="space-y-5">
        {error && <Note tone="critical">{error}</Note>}
        <fieldset>
          <legend className="label">How did the call go?</legend>
          <div className="mt-3 divide-y divide-rule border-y border-rule">
            {OUTCOMES.map((code) => (
              <label
                key={code}
                className="flex cursor-pointer items-center gap-3 py-2.5 text-[13px] text-ink"
              >
                <input
                  type="radio"
                  name="outcome"
                  value={code}
                  checked={outcome === code}
                  onChange={() => setOutcome(code)}
                  className="accent-ink"
                />
                {OUTCOME_LABELS[code]}
                {code === 'language_barrier' && (
                  <span className="ml-auto text-[12px] text-ink-3">
                    sends the lead back for re-routing
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="label block">
          Notes
          <textarea
            className="field mt-1.5 h-auto py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2 border-t border-rule pt-4">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save outcome'}
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
    <div className={'transition-opacity ' + (refreshing ? 'opacity-50' : '')}>
      <PageHeader
        title={isAdmin ? bd.name + '’s queue' : 'My queue'}
        sub={
          'Every learner here shares a language with you: ' +
          bd.languages.map((l) => languageLabel(l.code)).join(', ') +
          '.'
        }
      />

      {isAdmin && (
        <div className="mb-8">
          <Note title="You are viewing a BD’s queue as the admin">
            Switch to {bd.name} from the menu at the top right to see it as they do.
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
              ? 'That lead has been returned to the pool so routing can try a different BD.'
              : 'It is now in the call log and on the overview.'}
          </Note>
        </div>
      )}

      {!leads.length ? (
        <Empty title="Nothing in your queue">
          Nothing is assigned to you right now. An admin can run routing to distribute the waiting
          leads.
        </Empty>
      ) : (
        <ul className="border-t border-rule">
          {leads.map((lead) => (
            /* A grid, not flex-wrap: the columns must line up down the list
               rather than shifting with the length of each learner's name. */
            <li
              key={lead._id}
              className="grid items-start gap-x-8 gap-y-4 border-b border-rule py-6 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto]"
            >
              <div>
                <p className="text-[15px] font-medium text-ink">
                  {lead.name}
                  {lead.status === 'contacted' && (
                    <span className="ml-2 text-[11px] font-normal uppercase tracking-[0.07em] text-ink-3">
                      called
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-3">
                  {[lead.city, lead.state].filter(Boolean).join(', ') || 'location unknown'}
                  {lead.course ? ' · ' + lead.course : ''}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.07em] text-ink-3">Open the call in</p>
                <p className="mt-1 text-[15px] font-medium text-ink">
                  {languageLabel(lead.speakInLanguage)}
                </p>
                <p className="mt-1 flex items-baseline gap-2">
                  <Languages codes={effectiveLanguages(lead)} />
                  <Source source={lead.languageSource} />
                </p>
                {lead.languageSource !== 'explicit' && (
                  <p className="mt-1.5 max-w-sm text-[12px] leading-snug text-critical">
                    Their language was inferred, not declared — confirm it when they pick up.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 sm:justify-end">
                <a className="btn" href={'tel:' + (lead.phone || '')}>
                  {lead.phone || 'No number'}
                </a>
                <button type="button" className="btn btn-primary" onClick={() => setLogging(lead)}>
                  Log call
                </button>
              </div>
            </li>
          ))}
        </ul>
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
