import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  FileText,
  Heart,
  ImageDown,
  LockKeyhole,
  Printer,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  displayDate,
  displayMonth,
  downloadRecord,
  validateRecord,
} from './record.js';
import './App.css';

const emptyRecord = () => ({
  name: '',
  date: '',
  unsure: false,
  delivery: '',
  location: '',
  confirmed: false,
});

function App() {
  const [record, setRecord] = useState(emptyRecord);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);
  const cardRef = useRef(null);
  const valid = Object.keys(validateRecord(record)).length === 0;
  const today = new Date();
  const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const clear = () => {
      setRecord(emptyRecord());
      setErrors({});
      setStatus('');
      formRef.current?.reset();
    };
    const onShow = (event) => {
      if (event.persisted) clear();
    };
    window.addEventListener('pagehide', clear);
    window.addEventListener('pageshow', onShow);
    return () => {
      window.removeEventListener('pagehide', clear);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);

  function update(key, value) {
    setRecord((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'unsure' && value ? { date: '' } : {}),
    }));
    setErrors({});
    setStatus('');
  }
  function checkDetails() {
    const next = validateRecord(record);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return false;
    }
    return true;
  }
  async function save(format) {
    if (!checkDetails()) return;
    setBusy(true);
    setStatus('Preparing your record on this device…');
    try {
      await downloadRecord(record, format);
      setStatus(
        `${format === 'pdf' ? 'PDF' : 'Image'} prepared. Check your downloads or your browser’s save menu, and make sure you can find it before closing this page.`,
      );
    } catch {
      setStatus(
        'The download could not be prepared. Please try again, or use Print card and choose Save as PDF.',
      );
    } finally {
      setBusy(false);
    }
  }
  function clearDetails() {
    if (
      !window.confirm(
        'Clear the details on this page? Any files you already saved will stay on your device.',
      )
    )
      return;
    setRecord(emptyRecord());
    setErrors({});
    setStatus('Your details have been cleared from this page.');
    document.getElementById('name')?.focus();
  }
  const error = (key) =>
    errors[key] && (
      <span className="field-error" id={`${key}-error`}>
        {errors[key]}
      </span>
    );

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#" aria-label="My RSV vaccine record home">
          <span className="brand-icon">
            <Heart size={21} strokeWidth={1.8} />
          </span>
          <span>
            My RSV <strong>vaccine record</strong>
          </span>
        </a>
        <span className="header-note">
          <LockKeyhole size={14} /> Private by design
        </span>
      </header>
      <main>
        <section className="intro">
          <h1>
            A record for you RSV vaccine.
            <br />
            <span>Ready when you need it.</span>
          </h1>
          <p>
            Keep your maternal RSV vaccination details in one simple card.
            <br className="desktop-break" /> Save it to your phone and show your
            care team when your baby arrives.
          </p>
          <div className="intro-tags">
            <span>
              <Check size={15} /> No account needed
            </span>
            <span>
              <Check size={15} /> Details stay on your device
            </span>
            <span>
              <Check size={15} /> Free to save & print
            </span>
          </div>
        </section>
        <div className="workspace">
          <section className="form-panel" aria-labelledby="details-title">
            <div className="section-heading">
              <span className="step">1</span>
              <div>
                <h2 id="details-title">Add your details</h2>
                <p>Use your vaccination receipt if you have it.</p>
              </div>
            </div>
            <form
              ref={formRef}
              autoComplete="off"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (checkDetails()) {
                  cardRef.current?.focus();
                  cardRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
                }
              }}
            >
              <div className="field">
                <label htmlFor="name">
                  Patient name <span className="required-label">Required</span>
                </label>
                <input
                  id="name"
                  value={record.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="Your full name"
                  maxLength={100}
                  autoComplete="off"
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {error('name')}
              </div>
              <div className="field">
                <span className="field-label" id="vaccine-label">
                  Vaccine received
                </span>
                <div className="vaccine-type" aria-labelledby="vaccine-label">
                  <span className="vaccine-dot">
                    <Check size={15} />
                  </span>
                  <div>
                    <strong>Abrysvo</strong>
                    <span>RSVpreF · maternal RSV vaccine</span>
                  </div>
                </div>
                <label className="checkbox-row" htmlFor="confirmed">
                  <input
                    type="checkbox"
                    id="confirmed"
                    checked={record.confirmed}
                    onChange={(event) =>
                      update('confirmed', event.target.checked)
                    }
                    aria-invalid={!!errors.confirmed}
                    aria-describedby={
                      errors.confirmed ? 'confirmed-error' : undefined
                    }
                  />
                  <span>I received Abrysvo during this pregnancy.</span>
                </label>
                {error('confirmed')}
                <p className="field-help">
                  Unsure which vaccine you received? Check your receipt or ask
                  the vaccination provider before creating this card.
                </p>
              </div>
              <div className="field">
                <label htmlFor="date">
                  Vaccination date{' '}
                  <span className="required-label">
                    Required, or select unsure
                  </span>
                </label>
                <input
                  type="date"
                  id="date"
                  value={record.date}
                  onChange={(event) => update('date', event.target.value)}
                  max={maxDate}
                  min="2023-01-01"
                  disabled={record.unsure}
                  required={!record.unsure}
                  aria-invalid={!!errors.date}
                  aria-describedby={errors.date ? 'date-error' : undefined}
                />
                <label className="checkbox-row" htmlFor="unsure">
                  <input
                    type="checkbox"
                    id="unsure"
                    checked={record.unsure}
                    onChange={(event) => update('unsure', event.target.checked)}
                  />
                  <span>I’m unsure of the exact date.</span>
                </label>
                {error('date')}
              </div>
              <div className="field">
                <label htmlFor="delivery">
                  Expected delivery month & year{' '}
                  <span className="required-label">Required</span>
                </label>
                <input
                  type="month"
                  id="delivery"
                  value={record.delivery}
                  onChange={(event) => update('delivery', event.target.value)}
                  min="2023-01"
                  max="2100-12"
                  placeholder="YYYY-MM"
                  required
                  aria-invalid={!!errors.delivery}
                  aria-describedby={`delivery-help${errors.delivery ? ' delivery-error' : ''}`}
                />
                <p className="field-help" id="delivery-help">
                  This connects the record to this pregnancy.
                </p>
                {error('delivery')}
              </div>
              <div className="field">
                <label htmlFor="location">
                  Vaccination location{' '}
                  <span className="required-label">Optional</span>
                </label>
                <input
                  id="location"
                  value={record.location}
                  onChange={(event) => update('location', event.target.value)}
                  placeholder="Pharmacy, clinic or provider name"
                  maxLength={140}
                  autoComplete="off"
                />
              </div>
              <button className="review-button" type="submit">
                Review my card <ArrowRight size={17} />
              </button>
              <p className="form-footnote">
                <LockKeyhole size={14} /> Your entries aren’t sent to or stored
                by this website.
              </p>
            </form>
          </section>
          <section className="preview-panel" aria-labelledby="preview-title">
            <div className="section-heading preview-heading">
              <span className="step">2</span>
              <div>
                <h2 id="preview-title">Keep it close</h2>
                <p>Review your card, then save a copy.</p>
              </div>
              <span className="live-tag">
                <span /> Live preview
              </span>
            </div>
            <article
              className="record-card"
              ref={cardRef}
              tabIndex={-1}
              aria-label="Vaccination card preview"
            >
              <div className="card-top">
                <span className="card-symbol">
                  <Heart size={24} />
                </span>
                <span className="record-badge">PATIENT-ENTERED RECORD</span>
              </div>
              <div className="card-title">
                Maternal RSV
                <br />
                vaccination record
              </div>
              <p className="card-subtitle">
                A personal record to share with your care team.
              </p>
              {!valid && (
                <span className="draft-label">
                  DRAFT · Complete your details before saving
                </span>
              )}
              <div className="card-name">
                <span className="card-label">PATIENT NAME</span>
                <strong className={!record.name.trim() ? 'placeholder' : ''}>
                  {record.name.trim() || 'Your name here'}
                </strong>
              </div>
              <div className="card-date">
                <span className="card-label">VACCINATION DATE</span>
                <strong
                  className={
                    !record.date && !record.unsure ? 'placeholder' : ''
                  }
                >
                  {record.unsure
                    ? 'Date unsure'
                    : displayDate(record.date) || 'Add your vaccine date'}
                </strong>
                <span>
                  {record.unsure
                    ? 'Exact date needs clarification with the vaccination provider.'
                    : 'Abrysvo (RSVpreF)'}
                </span>
              </div>
              {record.unsure && (
                <p className="unsure-vaccine">Abrysvo (RSVpreF)</p>
              )}
              <div className="card-detail">
                <span className="card-label">EXPECTED DELIVERY</span>
                <strong>
                  {displayMonth(record.delivery) || 'Month and year'}
                </strong>
              </div>
              <div className="card-detail">
                <span className="card-label">VACCINATION LOCATION</span>
                <strong>{record.location.trim() || 'Not provided'}</strong>
              </div>
              <div className="card-disclaimer">
                <FileText size={16} />
                <p>
                  Entered by the patient. Not independently verified.
                  <br />
                  Your care team will review this alongside your vaccination
                  history.
                </p>
              </div>
              <div className="card-footer">
                <span>My RSV vaccine record</span>
                <span>Personal copy</span>
              </div>
            </article>
            <div className="save-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => save('pdf')}
                disabled={busy}
              >
                <ArrowDownToLine size={18} /> Save PDF
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => save('png')}
                disabled={busy}
              >
                <ImageDown size={18} /> Save image
              </button>
              <button
                type="button"
                className="print-button"
                onClick={() => {
                  if (checkDetails()) window.print();
                }}
                disabled={busy}
              >
                <Printer size={17} /> Print card
              </button>
            </div>
            <p className="status-message" role="status" aria-live="polite">
              {status}
            </p>
            <div className="save-tip">
              <span className="tip-icon">
                <CheckCheck size={20} />
              </span>
              <div>
                <strong>Save now. Find it easily later.</strong>
                <p>
                  Keep the PDF in Files or save the image to Photos. Open your
                  saved copy to check it, then bring it to delivery. A photo of
                  your original vaccination receipt is helpful too.
                </p>
                <p>This website cannot retrieve your record after you leave.</p>
              </div>
            </div>
          </section>
        </div>
        <section
          className="privacy-section"
          aria-label="Privacy and helpful information"
        >
          <div className="privacy-intro">
            <ShieldCheck size={23} />
            <div>
              <h2>Your details are yours.</h2>
              <p>No account. No patient database. No uploads.</p>
            </div>
          </div>
          <details>
            <summary>
              How is my information kept private?
              <ChevronDown size={18} />
            </summary>
            <p>
              Your card is created in your browser. This website does not send
              or store your name or vaccination details, and it has no analytics
              or advertising. Entries clear when you leave or reload this page.
              Your saved file may sync to your own cloud storage, depending on
              your device settings. Anyone with access to the saved file can
              read it.
            </p>
          </details>
          <details>
            <summary>
              What if I don’t know the date or can’t save a file?
              <ChevronDown size={18} />
            </summary>
            <p>
              Select “I’m unsure of the exact date” if you know you received
              Abrysvo but cannot confirm when. You can ask the vaccination
              provider for a receipt. If downloads aren’t available, print your
              completed card or take a screenshot. Keep a paper copy if that is
              easier.
            </p>
          </details>
          <details>
            <summary>
              Does this card decide what my baby needs?
              <ChevronDown size={18} />
            </summary>
            <p>
              No. This is a patient-entered memory aid, not proof of vaccination
              or a treatment recommendation. Your care team will review your
              history and the current Ontario guidance. Not having a card does
              not mean you were not vaccinated.
            </p>
          </details>
          <button type="button" className="clear-button" onClick={clearDetails}>
            <Trash2 size={15} /> Clear my details from this page
          </button>
        </section>
      </main>
      <footer className="site-footer">
        <span>
          <Heart size={14} /> A little preparation for a big arrival.
        </span>
        <span>Independent prototype · Not an official Ontario record</span>
      </footer>
    </>
  );
}
export default App;
