/**
 * Intent: Kurs-Planung — 4-Schritt-Wizard für Musikschul-Personal.
 * Steps: 1) Kurs-Details eingeben → 2) Dozent zuweisen → 3) Raum auswählen → 4) Kurs veröffentlichen.
 * Reads: dozenten, raeume. Writes: kurse_workshops (createKurseWorkshopsEntry).
 * Composes: IntentWizardShell, EntitySelectStep, StatusBadge.
 */
import { useState, useCallback } from 'react';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import type { Dozenten, Raeume } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  IconMusic,
  IconUser,
  IconDoor,
  IconCheck,
  IconAlertTriangle,
  IconCalendarPlus,
  IconRefresh,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

import { makeT } from '@/i18n';

const tt = makeT({
  de: {
    kurs_details: 'Kurs-Details',
    dozent: 'Dozent',
    raum: 'Raum',
    veroeffentlichen: 'Veröffentlichen',
    vor_und_nachname_sind_erforderli: 'Vor- und Nachname sind erforderlich.',
    raumname_ist_erforderlich: 'Raumname ist erforderlich.',
    kurs_planen: 'Kurs planen',
    neuen_kurs_oder_workshop_schritt: 'Neuen Kurs oder Workshop Schritt für Schritt anlegen und veröffentlichen',
    grundlegende_informationen_zum_k: 'Grundlegende Informationen zum Kurs eingeben',
    titel: 'Titel',
    z_b_klavierkurs_fuer_anfaenger: 'z.B. Klavierkurs für Anfänger',
    kurstyp: 'Kurstyp',
    niveau: 'Niveau',
    startdatum: 'Startdatum',
    enddatum: 'Enddatum',
    wochentage: 'Wochentage',
    uhrzeit_beginn: 'Uhrzeit Beginn',
    uhrzeit_ende: 'Uhrzeit Ende',
    max_teilnehmer: 'Max. Teilnehmer',
    preis: 'Preis (€)',
    beschreibung_optional: 'Beschreibung (optional)',
    kurzbeschreibung_des_angebots: 'Kurzbeschreibung des Angebots...',
    weiter_dozent_waehlen: 'Weiter: Dozent wählen',
    dozent_zuweisen: 'Dozent zuweisen',
    wer_leitet_diesen_kurs: 'Wer leitet diesen Kurs?',
    kein_name: '(Kein Name)',
    dozenten_suchen: 'Dozenten suchen...',
    kein_dozent_gefunden: 'Kein Dozent gefunden.',
    neuen_dozenten_anlegen: 'Neuen Dozenten anlegen',
    vorname: 'Vorname *',
    vorname_2: 'Vorname',
    nachname: 'Nachname *',
    nachname_2: 'Nachname',
    e_mail: 'E-Mail',
    email_beispiel_de: 'email@beispiel.de',
    instrumente: 'Instrumente',
    beschaeftigungsart: 'Beschäftigungsart',
    speichern: 'Speichern...',
    dozent_anlegen: 'Dozent anlegen',
    abbrechen: 'Abbrechen',
    zurueck: 'Zurück',
    weiter_raum_waehlen: 'Weiter: Raum wählen',
    raum_auswaehlen: 'Raum auswählen',
    wo_findet_der_kurs_statt: 'Wo findet der Kurs statt?',
    benoetigte_kapazitaet: 'Benötigte Kapazität:',
    personen: 'Personen.',
    etage: 'Etage: {p0}',
    kapazitaet: 'Kapazität',
    raum_suchen: 'Raum suchen...',
    kein_raum_gefunden: 'Kein Raum gefunden.',
    neuen_raum_anlegen: 'Neuen Raum anlegen',
    raumname: 'Raumname *',
    z_b_uebungsraum_1: 'z.B. Übungsraum 1',
    personenanzahl: 'Personenanzahl',
    etage_2: 'Etage',
    z_b_1_og: 'z.B. 1. OG',
    raum_anlegen: 'Raum anlegen',
    kapazitaet_2: 'Kapazität:',
    etage_3: ' · Etage: {p0}',
    raum_zu_klein_kapazitaet: 'Raum zu klein — Kapazität (',
    liegt_unter_der_teilnehmerzahl: ') liegt unter der Teilnehmerzahl (',
    weiter_veroeffentlichen: 'Weiter: Veröffentlichen',
    zusammenfassung: 'Zusammenfassung',
    bitte_alles_ueberpruefen_dann_de: 'Bitte alles überprüfen, dann den Kurs anlegen',
    typ: 'Typ',
    zeitraum: 'Zeitraum',
    zeiten: 'Zeiten',
    uhr: 'Uhr',
    preis_2: 'Preis',
    beschreibung: 'Beschreibung',
    status_beim_anlegen: 'Status beim Anlegen',
    wird_angelegt: 'Wird angelegt...',
    kurs_anlegen: 'Kurs anlegen',
    kurs_angelegt: 'Kurs angelegt!',
    wurde_erfolgreich_erstellt_und_g: 'wurde erfolgreich erstellt und gespeichert.',
    weiteren_kurs_planen: 'Weiteren Kurs planen',
    zurueck_zum_dashboard: 'Zurück zum Dashboard',
  },
  en: {
    kurs_details: 'Course Details',
    dozent: 'Instructor',
    raum: 'Room',
    veroeffentlichen: 'Publish',
    vor_und_nachname_sind_erforderli: 'First and last name are required.',
    raumname_ist_erforderlich: 'Room name is required.',
    kurs_planen: 'Schedule Course',
    neuen_kurs_oder_workshop_schritt: 'Create and publish a new course or workshop step by step',
    grundlegende_informationen_zum_k: 'Enter basic course information',
    titel: 'Title',
    z_b_klavierkurs_fuer_anfaenger: 'e.g. Piano Course for Beginners',
    kurstyp: 'Course Type',
    niveau: 'Level',
    startdatum: 'Start Date',
    enddatum: 'End Date',
    wochentage: 'Weekdays',
    uhrzeit_beginn: 'Start Time',
    uhrzeit_ende: 'End Time',
    max_teilnehmer: 'Max. Participants',
    preis: 'Price (€)',
    beschreibung_optional: 'Description (optional)',
    kurzbeschreibung_des_angebots: 'Brief description of the offer...',
    weiter_dozent_waehlen: 'Next: Select Instructor',
    dozent_zuweisen: 'Assign Instructor',
    wer_leitet_diesen_kurs: 'Who leads this course?',
    kein_name: '(No Name)',
    dozenten_suchen: 'Search instructors...',
    kein_dozent_gefunden: 'No instructor found.',
    neuen_dozenten_anlegen: 'Add New Instructor',
    vorname: 'First Name *',
    vorname_2: 'First Name',
    nachname: 'Last Name *',
    nachname_2: 'Last Name',
    e_mail: 'E-Mail',
    email_beispiel_de: 'email@example.com',
    instrumente: 'Instruments',
    beschaeftigungsart: 'Employment Type',
    speichern: 'Saving...',
    dozent_anlegen: 'Create Instructor',
    abbrechen: 'Cancel',
    zurueck: 'Back',
    weiter_raum_waehlen: 'Next: Select Room',
    raum_auswaehlen: 'Select Room',
    wo_findet_der_kurs_statt: 'Where does the course take place?',
    benoetigte_kapazitaet: 'Required Capacity:',
    personen: 'Persons.',
    etage: 'Floor: {p0}',
    kapazitaet: 'Capacity',
    raum_suchen: 'Search rooms...',
    kein_raum_gefunden: 'No room found.',
    neuen_raum_anlegen: 'Add New Room',
    raumname: 'Room Name *',
    z_b_uebungsraum_1: 'e.g. Practice Room 1',
    personenanzahl: 'Number of Persons',
    etage_2: 'Floor',
    z_b_1_og: 'e.g. 1st Floor',
    raum_anlegen: 'Create Room',
    kapazitaet_2: 'Capacity:',
    etage_3: ' · Floor: {p0}',
    raum_zu_klein_kapazitaet: 'Room too small — capacity (',
    liegt_unter_der_teilnehmerzahl: ') is below the participant count (',
    weiter_veroeffentlichen: 'Next: Publish',
    zusammenfassung: 'Summary',
    bitte_alles_ueberpruefen_dann_de: 'Please review everything, then create the course',
    typ: 'Type',
    zeitraum: 'Period',
    zeiten: 'Times',
    uhr: 'o\'clock',
    preis_2: 'Price',
    beschreibung: 'Description',
    status_beim_anlegen: 'Status on Creation',
    wird_angelegt: 'Creating...',
    kurs_anlegen: 'Create Course',
    kurs_angelegt: 'Course Created!',
    wurde_erfolgreich_erstellt_und_g: 'was successfully created and saved.',
    weiteren_kurs_planen: 'Schedule Another Course',
    zurueck_zum_dashboard: 'Back to Dashboard',
  },
});

interface KursForm {
  titel: string;
  kursTypKey: string;
  beschreibung: string;
  niveauKey: string;
  startdatum: string;
  enddatum: string;
  wochentag: string[];
  uhrzeit_beginn: string;
  uhrzeit_ende: string;
  max_teilnehmer: number | '';
  preis: number | '';
}

const DEFAULT_FORM: KursForm = {
  titel: '',
  kursTypKey: '',
  beschreibung: '',
  niveauKey: '',
  startdatum: '',
  enddatum: '',
  wochentag: [],
  uhrzeit_beginn: '',
  uhrzeit_ende: '',
  max_teilnehmer: '',
  preis: '',
};

const KURSTYP_OPTIONS = LOOKUP_OPTIONS['kurse_workshops']['kurstyp'] ?? [];
const NIVEAU_OPTIONS = LOOKUP_OPTIONS['kurse_workshops']['niveau'] ?? [];
const WOCHENTAG_OPTIONS = LOOKUP_OPTIONS['kurse_workshops']['wochentag'] ?? [];
const STATUS_KURS_OPTIONS = LOOKUP_OPTIONS['kurse_workshops']['status_kurs'] ?? [];

// --- New Dozent mini-form state type ---
interface NewDozentForm {
  vorname: string;
  nachname: string;
  email: string;
  instrumente: string[];
  beschaeftigungsartKey: string;
}

const DEFAULT_DOZENT_FORM: NewDozentForm = {
  vorname: '',
  nachname: '',
  email: '',
  instrumente: [],
  beschaeftigungsartKey: '',
};

// --- New Raum mini-form state type ---
interface NewRaumForm {
  raumname: string;
  kapazitaet: number | '';
  etage: string;
}

const DEFAULT_RAUM_FORM: NewRaumForm = {
  raumname: '',
  kapazitaet: '',
  etage: '',
};

const INSTRUMENTE_OPTIONS = LOOKUP_OPTIONS['dozenten']['instrumente'] ?? [];
const BESCHAEFTIGUNGSART_OPTIONS = LOOKUP_OPTIONS['dozenten']['beschaeftigungsart'] ?? [];

export default function KursPlanungPage() {
  const WIZARD_STEPS = [
  { label: tt('kurs_details') },
  { label: tt('dozent') },
  { label: tt('raum') },
  { label: tt('veroeffentlichen') },
];

  const { dozenten, raeume, loading, error, fetchAll } = useDashboardData();

  const [step, setStep] = useState(1);
  const [kursForm, setKursForm] = useState<KursForm>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof KursForm, string>>>({});

  const [selectedDozent, setSelectedDozent] = useState<Dozenten | null>(null);
  const [showNewDozent, setShowNewDozent] = useState(false);
  const [newDozentForm, setNewDozentForm] = useState<NewDozentForm>(DEFAULT_DOZENT_FORM);
  const [dozentSaving, setDozentSaving] = useState(false);
  const [dozentError, setDozentError] = useState<string | null>(null);

  const [selectedRaum, setSelectedRaum] = useState<Raeume | null>(null);
  const [showNewRaum, setShowNewRaum] = useState(false);
  const [newRaumForm, setNewRaumForm] = useState<NewRaumForm>(DEFAULT_RAUM_FORM);
  const [raumSaving, setRaumSaving] = useState(false);
  const [raumError, setRaumError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<string>(STATUS_KURS_OPTIONS[0]?.key ?? 'geplant');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedTitel, setSavedTitel] = useState<string | null>(null);

  // --- Step 1: Validation ---
  const validateStep1 = useCallback((): boolean => {
    const errors: Partial<Record<keyof KursForm, string>> = {};
    if (!kursForm.titel.trim()) errors.titel = 'Titel ist erforderlich.';
    if (!kursForm.kursTypKey) errors.kursTypKey = 'Bitte einen Kurstyp wählen.';
    if (!kursForm.startdatum) errors.startdatum = 'Startdatum ist erforderlich.';
    if (!kursForm.enddatum) errors.enddatum = 'Enddatum ist erforderlich.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [kursForm]);

  const handleWochentag = (key: string) => {
    setKursForm(prev => ({
      ...prev,
      wochentag: prev.wochentag.includes(key)
        ? prev.wochentag.filter(k => k !== key)
        : [...prev.wochentag, key],
    }));
  };

  // --- Step 2: Dozent creation ---
  const handleCreateDozent = async () => {
    if (!newDozentForm.vorname.trim() || !newDozentForm.nachname.trim()) {
      setDozentError(tt('vor_und_nachname_sind_erforderli'));
      return;
    }
    setDozentSaving(true);
    setDozentError(null);
    try {
      const result = await LivingAppsService.createDozentenEntry({
        vorname: newDozentForm.vorname,
        nachname: newDozentForm.nachname,
        email: newDozentForm.email || undefined,
        instrumente: newDozentForm.instrumente.length > 0 ? newDozentForm.instrumente : undefined,
        beschaeftigungsart: newDozentForm.beschaeftigungsartKey || undefined,
      });
      await fetchAll();
      // Auto-select newly created dozent
      const newId = result.record_id;
      setSelectedDozent({
        record_id: newId,
        created_at: '',
        updated_at: null,
        createdat: '',
        updatedat: null,
        fields: {
          vorname: newDozentForm.vorname,
          nachname: newDozentForm.nachname,
          email: newDozentForm.email || undefined,
        },
      });
      setShowNewDozent(false);
      setNewDozentForm(DEFAULT_DOZENT_FORM);
    } catch (e) {
      setDozentError(e instanceof Error ? e.message : 'Fehler beim Anlegen des Dozenten.');
    } finally {
      setDozentSaving(false);
    }
  };

  const handleSelectDozent = useCallback((id: string) => {
    const found = dozenten.find(d => d.record_id === id) ?? null;
    setSelectedDozent(found);
    setStep(3);
  }, [dozenten]);

  // --- Step 3: Raum creation ---
  const handleCreateRaum = async () => {
    if (!newRaumForm.raumname.trim()) {
      setRaumError(tt('raumname_ist_erforderlich'));
      return;
    }
    setRaumSaving(true);
    setRaumError(null);
    try {
      const result = await LivingAppsService.createRaeumeEntry({
        raumname: newRaumForm.raumname,
        kapazitaet: newRaumForm.kapazitaet !== '' ? Number(newRaumForm.kapazitaet) : undefined,
        etage: newRaumForm.etage || undefined,
      });
      await fetchAll();
      const newId = result.record_id;
      setSelectedRaum({
        record_id: newId,
        created_at: '',
        updated_at: null,
        createdat: '',
        updatedat: null,
        fields: {
          raumname: newRaumForm.raumname,
          kapazitaet: newRaumForm.kapazitaet !== '' ? Number(newRaumForm.kapazitaet) : undefined,
          etage: newRaumForm.etage || undefined,
        },
      });
      setShowNewRaum(false);
      setNewRaumForm(DEFAULT_RAUM_FORM);
    } catch (e) {
      setRaumError(e instanceof Error ? e.message : 'Fehler beim Anlegen des Raums.');
    } finally {
      setRaumSaving(false);
    }
  };

  const handleSelectRaum = useCallback((id: string) => {
    const found = raeume.find(r => r.record_id === id) ?? null;
    setSelectedRaum(found);
    setStep(4);
  }, [raeume]);

  // --- Step 4: Create Kurs ---
  const handleCreateKurs = async () => {
    if (!selectedDozent || !selectedRaum) return;
    setSaving(true);
    setSaveError(null);
    try {
      await LivingAppsService.createKurseWorkshop({
        titel: kursForm.titel,
        kurstyp: kursForm.kursTypKey || undefined,
        beschreibung: kursForm.beschreibung || undefined,
        niveau: kursForm.niveauKey || undefined,
        startdatum: kursForm.startdatum || undefined,
        enddatum: kursForm.enddatum || undefined,
        wochentag: kursForm.wochentag.length > 0 ? kursForm.wochentag : undefined,
        uhrzeit_beginn: kursForm.uhrzeit_beginn || undefined,
        uhrzeit_ende: kursForm.uhrzeit_ende || undefined,
        raum: createRecordUrl(APP_IDS.RAEUME, selectedRaum.record_id),
        dozent: createRecordUrl(APP_IDS.DOZENTEN, selectedDozent.record_id),
        max_teilnehmer: kursForm.max_teilnehmer !== '' ? Number(kursForm.max_teilnehmer) : undefined,
        preis: kursForm.preis !== '' ? Number(kursForm.preis) : undefined,
        status_kurs: selectedStatus,
      });
      setSavedTitel(kursForm.titel);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler beim Anlegen des Kurses.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setKursForm(DEFAULT_FORM);
    setFormErrors({});
    setSelectedDozent(null);
    setSelectedRaum(null);
    setSelectedStatus(STATUS_KURS_OPTIONS[0]?.key ?? 'geplant');
    setSavedTitel(null);
    setSaveError(null);
    setShowNewDozent(false);
    setNewDozentForm(DEFAULT_DOZENT_FORM);
    setShowNewRaum(false);
    setNewRaumForm(DEFAULT_RAUM_FORM);
  };

  const maxTeilnehmer = kursForm.max_teilnehmer !== '' ? Number(kursForm.max_teilnehmer) : 0;

  return (
    <IntentWizardShell
      title={tt('kurs_planen')}
      subtitle={tt('neuen_kurs_oder_workshop_schritt')}
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ── STEP 1: Kurs-Details ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconMusic size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{tt('kurs_details')}</h2>
                <p className="text-sm text-muted-foreground">{tt('grundlegende_informationen_zum_k')}</p>
              </div>
            </div>

            {/* Titel */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {tt('titel')} <span className="text-destructive">*</span>
              </label>
              <Input
                value={kursForm.titel}
                onChange={e => setKursForm(prev => ({ ...prev, titel: e.target.value }))}
                placeholder={tt('z_b_klavierkurs_fuer_anfaenger')}
                className={formErrors.titel ? 'border-destructive' : ''}
              />
              {formErrors.titel && <p className="text-xs text-destructive">{formErrors.titel}</p>}
            </div>

            {/* Kurstyp */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {tt('kurstyp')} <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {KURSTYP_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setKursForm(prev => ({ ...prev, kursTypKey: opt.key }))}
                    className={cn(
                      'px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                      kursForm.kursTypKey === opt.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:border-primary/50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {formErrors.kursTypKey && <p className="text-xs text-destructive">{formErrors.kursTypKey}</p>}
            </div>

            {/* Niveau */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{tt('niveau')}</label>
              <div className="flex flex-wrap gap-2">
                {NIVEAU_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setKursForm(prev => ({ ...prev, niveauKey: opt.key === prev.niveauKey ? '' : opt.key }))}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm transition-colors',
                      kursForm.niveauKey === opt.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zeitraum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {tt('startdatum')} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={kursForm.startdatum}
                  onChange={e => setKursForm(prev => ({ ...prev, startdatum: e.target.value }))}
                  className={formErrors.startdatum ? 'border-destructive' : ''}
                />
                {formErrors.startdatum && <p className="text-xs text-destructive">{formErrors.startdatum}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {tt('enddatum')} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={kursForm.enddatum}
                  onChange={e => setKursForm(prev => ({ ...prev, enddatum: e.target.value }))}
                  className={formErrors.enddatum ? 'border-destructive' : ''}
                />
                {formErrors.enddatum && <p className="text-xs text-destructive">{formErrors.enddatum}</p>}
              </div>
            </div>

            {/* Wochentage */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{tt('wochentage')}</label>
              <div className="flex flex-wrap gap-2">
                {WOCHENTAG_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleWochentag(opt.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-sm transition-colors',
                      kursForm.wochentag.includes(opt.key)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Uhrzeiten */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{tt('uhrzeit_beginn')}</label>
                <Input
                  type="text"
                  value={kursForm.uhrzeit_beginn}
                  onChange={e => setKursForm(prev => ({ ...prev, uhrzeit_beginn: e.target.value }))}
                  placeholder="09:00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{tt('uhrzeit_ende')}</label>
                <Input
                  type="text"
                  value={kursForm.uhrzeit_ende}
                  onChange={e => setKursForm(prev => ({ ...prev, uhrzeit_ende: e.target.value }))}
                  placeholder="10:30"
                />
              </div>
            </div>

            {/* Max. Teilnehmer & Preis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{tt('max_teilnehmer')}</label>
                <Input
                  type="number"
                  min={1}
                  value={kursForm.max_teilnehmer}
                  onChange={e => setKursForm(prev => ({ ...prev, max_teilnehmer: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder="z.B. 10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{tt('preis')}</label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={kursForm.preis}
                  onChange={e => setKursForm(prev => ({ ...prev, preis: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder="z.B. 120"
                />
              </div>
            </div>

            {/* Beschreibung */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{tt('beschreibung_optional')}</label>
              <textarea
                value={kursForm.beschreibung}
                onChange={e => setKursForm(prev => ({ ...prev, beschreibung: e.target.value }))}
                placeholder={tt('kurzbeschreibung_des_angebots')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className="gap-2"
            >
              {tt('weiter_dozent_waehlen')}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Dozent zuweisen ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconUser size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{tt('dozent_zuweisen')}</h2>
                <p className="text-sm text-muted-foreground">{tt('wer_leitet_diesen_kurs')}</p>
              </div>
            </div>

            <EntitySelectStep
              items={dozenten.map(d => ({
                id: d.record_id,
                title: [d.fields.vorname, d.fields.nachname].filter(Boolean).join(' ') || tt('kein_name'),
                subtitle: d.fields.instrumente && d.fields.instrumente.length > 0
                  ? d.fields.instrumente.map(i => i.label).join(', ')
                  : undefined,
                status: d.fields.beschaeftigungsart
                  ? { key: d.fields.beschaeftigungsart.key, label: d.fields.beschaeftigungsart.label }
                  : undefined,
                icon: <IconUser size={18} className="text-primary" />,
              }))}
              onSelect={handleSelectDozent}
              searchPlaceholder={tt('dozenten_suchen')}
              emptyText={tt('kein_dozent_gefunden')}
              createLabel={tt('neuen_dozenten_anlegen')}
              onCreateNew={() => { setShowNewDozent(v => !v); }}
              createDialog={showNewDozent ? (
                <div className="rounded-2xl border bg-secondary p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{tt('neuen_dozenten_anlegen')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{tt('vorname')}</label>
                      <Input
                        value={newDozentForm.vorname}
                        onChange={e => setNewDozentForm(prev => ({ ...prev, vorname: e.target.value }))}
                        placeholder={tt('vorname_2')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{tt('nachname')}</label>
                      <Input
                        value={newDozentForm.nachname}
                        onChange={e => setNewDozentForm(prev => ({ ...prev, nachname: e.target.value }))}
                        placeholder={tt('nachname_2')}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{tt('e_mail')}</label>
                    <Input
                      type="email"
                      value={newDozentForm.email}
                      onChange={e => setNewDozentForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={tt('email_beispiel_de')}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{tt('instrumente')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {INSTRUMENTE_OPTIONS.map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setNewDozentForm(prev => ({
                            ...prev,
                            instrumente: prev.instrumente.includes(opt.key)
                              ? prev.instrumente.filter(k => k !== opt.key)
                              : [...prev.instrumente, opt.key],
                          }))}
                          className={cn(
                            'px-2.5 py-1 rounded-lg border text-xs transition-colors',
                            newDozentForm.instrumente.includes(opt.key)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{tt('beschaeftigungsart')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {BESCHAEFTIGUNGSART_OPTIONS.map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setNewDozentForm(prev => ({
                            ...prev,
                            beschaeftigungsartKey: prev.beschaeftigungsartKey === opt.key ? '' : opt.key,
                          }))}
                          className={cn(
                            'px-2.5 py-1 rounded-lg border text-xs transition-colors',
                            newDozentForm.beschaeftigungsartKey === opt.key
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {dozentError && (
                    <p className="text-xs text-destructive">{dozentError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateDozent}
                      disabled={dozentSaving}
                      className="gap-1.5"
                    >
                      {(dozentSaving ? tt('speichern') : tt('dozent_anlegen'))}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setShowNewDozent(false); setNewDozentForm(DEFAULT_DOZENT_FORM); setDozentError(null); }}
                    >
                      {tt('abbrechen')}
                    </Button>
                  </div>
                </div>
              ) : undefined}
            />

            {/* Selected Dozent confirmation card */}
            {selectedDozent && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <IconCheck size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {[selectedDozent.fields.vorname, selectedDozent.fields.nachname].filter(Boolean).join(' ')}
                  </p>
                  {selectedDozent.fields.qualifikationen && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {selectedDozent.fields.qualifikationen}
                    </p>
                  )}
                  {selectedDozent.fields.beschaeftigungsart && (
                    <div className="mt-1.5">
                      <StatusBadge
                        statusKey={selectedDozent.fields.beschaeftigungsart.key}
                        label={selectedDozent.fields.beschaeftigungsart.label}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>{tt('zurueck')}</Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedDozent}
              className="gap-2"
            >
              {tt('weiter_raum_waehlen')}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Raum auswählen ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconDoor size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{tt('raum_auswaehlen')}</h2>
                <p className="text-sm text-muted-foreground">
                  {tt('wo_findet_der_kurs_statt')}
                  {maxTeilnehmer > 0 && (
                    <span className="ml-1">{tt('benoetigte_kapazitaet')} <strong>{maxTeilnehmer}</strong> {tt('personen')}</span>
                  )}
                </p>
              </div>
            </div>

            <EntitySelectStep
              items={raeume.map(r => {
                const tooSmall = maxTeilnehmer > 0 && (r.fields.kapazitaet ?? 0) < maxTeilnehmer; /* i18n-exempt */
                return {
                  id: r.record_id,
                  title: r.fields.raumname ?? tt('kein_name'),
                  subtitle: r.fields.etage ? tt('etage', { p0: r.fields.etage }) : undefined,
                  stats: [
                    { label: tt('kapazitaet'), value: r.fields.kapazitaet ?? '–' },
                    ...(tooSmall ? [{ label: '', value: '⚠ Zu klein' }] : []),
                  ],
                  status: r.fields.verfuegbarkeit
                    ? { key: r.fields.verfuegbarkeit.key, label: r.fields.verfuegbarkeit.label }
                    : undefined,
                  icon: <IconDoor size={18} className={tooSmall ? 'text-amber-500' : 'text-primary'} />,
                };
              })}
              onSelect={handleSelectRaum}
              searchPlaceholder={tt('raum_suchen')}
              emptyText={tt('kein_raum_gefunden')}
              createLabel={tt('neuen_raum_anlegen')}
              onCreateNew={() => { setShowNewRaum(v => !v); }}
              createDialog={showNewRaum ? (
                <div className="rounded-2xl border bg-secondary p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{tt('neuen_raum_anlegen')}</h3>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{tt('raumname')}</label>
                    <Input
                      value={newRaumForm.raumname}
                      onChange={e => setNewRaumForm(prev => ({ ...prev, raumname: e.target.value }))}
                      placeholder={tt('z_b_uebungsraum_1')}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{tt('kapazitaet')}</label>
                      <Input
                        type="number"
                        min={1}
                        value={newRaumForm.kapazitaet}
                        onChange={e => setNewRaumForm(prev => ({ ...prev, kapazitaet: e.target.value === '' ? '' : Number(e.target.value) }))}
                        placeholder={tt('personenanzahl')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{tt('etage_2')}</label>
                      <Input
                        value={newRaumForm.etage}
                        onChange={e => setNewRaumForm(prev => ({ ...prev, etage: e.target.value }))}
                        placeholder={tt('z_b_1_og')}
                      />
                    </div>
                  </div>
                  {raumError && (
                    <p className="text-xs text-destructive">{raumError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateRaum}
                      disabled={raumSaving}
                      className="gap-1.5"
                    >
                      {(raumSaving ? tt('speichern') : tt('raum_anlegen'))}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setShowNewRaum(false); setNewRaumForm(DEFAULT_RAUM_FORM); setRaumError(null); }}
                    >
                      {tt('abbrechen')}
                    </Button>
                  </div>
                </div>
              ) : undefined}
            />

            {/* Selected Raum confirmation */}
            {selectedRaum && (() => {
              const tooSmall = maxTeilnehmer > 0 && (selectedRaum.fields.kapazitaet ?? 0) < maxTeilnehmer; /* i18n-exempt */
              return (
                <div className={cn(
                  'rounded-xl border p-4 flex items-start gap-3',
                  tooSmall
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-primary/20 bg-primary/5'
                )}>
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    tooSmall ? 'bg-amber-100' : 'bg-primary/15'
                  )}>
                    {tooSmall
                      ? <IconAlertTriangle size={16} className="text-amber-600" />
                      : <IconCheck size={16} className="text-primary" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{selectedRaum.fields.raumname}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tt('kapazitaet_2')} {selectedRaum.fields.kapazitaet ?? '–'}
                      {selectedRaum.fields.etage && tt('etage_3', { p0: selectedRaum.fields.etage })}
                    </p>
                    {tooSmall && (
                      <p className="text-xs font-medium text-amber-700 mt-1">
                        {tt('raum_zu_klein_kapazitaet')}{selectedRaum.fields.kapazitaet ?? 0}{tt('liegt_unter_der_teilnehmerzahl')}{maxTeilnehmer})
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>{tt('zurueck')}</Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!selectedRaum}
              className="gap-2"
            >
              {tt('weiter_veroeffentlichen')}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Kurs veröffentlichen ── */}
      {step === 4 && !savedTitel && (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconCalendarPlus size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{tt('zusammenfassung')}</h2>
                <p className="text-sm text-muted-foreground">{tt('bitte_alles_ueberpruefen_dann_de')}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('titel')}</dt>
                <dd className="font-semibold text-foreground mt-0.5 truncate">{kursForm.titel || '–'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('typ')}</dt>
                <dd className="text-foreground mt-0.5">
                  {KURSTYP_OPTIONS.find(o => o.key === kursForm.kursTypKey)?.label ?? '–'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('niveau')}</dt>
                <dd className="text-foreground mt-0.5">
                  {NIVEAU_OPTIONS.find(o => o.key === kursForm.niveauKey)?.label ?? '–'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('zeitraum')}</dt>
                <dd className="text-foreground mt-0.5">
                  {kursForm.startdatum ? kursForm.startdatum.replace('T', ' ') : '–'}
                  {kursForm.enddatum ? ` – ${kursForm.enddatum.replace('T', ' ')}` : ''}
                </dd>
              </div>
              {kursForm.wochentag.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('wochentage')}</dt>
                  <dd className="text-foreground mt-0.5">
                    {kursForm.wochentag.map(k => WOCHENTAG_OPTIONS.find(o => o.key === k)?.label ?? k).join(', ')}
                  </dd>
                </div>
              )}
              {(kursForm.uhrzeit_beginn || kursForm.uhrzeit_ende) && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('zeiten')}</dt>
                  <dd className="text-foreground mt-0.5">
                    {kursForm.uhrzeit_beginn || '?'} – {kursForm.uhrzeit_ende || '?'} {tt('uhr')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('dozent')}</dt>
                <dd className="text-foreground mt-0.5 font-medium">
                  {selectedDozent
                    ? [selectedDozent.fields.vorname, selectedDozent.fields.nachname].filter(Boolean).join(' ')
                    : '–'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('raum')}</dt>
                <dd className="text-foreground mt-0.5 font-medium">{selectedRaum?.fields.raumname ?? '–'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('preis_2')}</dt>
                <dd className="text-foreground mt-0.5">
                  {kursForm.preis !== '' ? `${kursForm.preis} €` : '–'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('max_teilnehmer')}</dt>
                <dd className="text-foreground mt-0.5">
                  {kursForm.max_teilnehmer !== '' ? kursForm.max_teilnehmer : '–'}
                </dd>
              </div>
            </dl>

            {kursForm.beschreibung && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tt('beschreibung')}</dt>
                <dd className="text-sm text-foreground mt-1 whitespace-pre-wrap">{kursForm.beschreibung}</dd>
              </div>
            )}
          </div>

          {/* Status-Auswahl */}
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{tt('status_beim_anlegen')}</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_KURS_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedStatus(opt.key)}
                  className={cn(
                    'px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                    selectedStatus === opt.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-center gap-2">
              <IconAlertTriangle size={16} className="text-destructive shrink-0" />
              <p className="text-sm text-destructive">{saveError}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>{tt('zurueck')}</Button>
            <Button
              onClick={handleCreateKurs}
              disabled={saving || !selectedDozent || !selectedRaum}
              className="gap-2"
            >
              {(saving ? tt('wird_angelegt') : tt('kurs_anlegen'))}
            </Button>
          </div>
        </div>
      )}

      {/* ── SUCCESS STATE ── */}
      {step === 4 && savedTitel && (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
            <IconCheck size={28} className="text-green-600" stroke={2.5} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{tt('kurs_angelegt')}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              <strong>„{savedTitel}"</strong> {tt('wurde_erfolgreich_erstellt_und_g')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleReset} className="gap-2">
              <IconRefresh size={16} />
              {tt('weiteren_kurs_planen')}
            </Button>
            <a href="#/">
              <Button variant="outline" className="w-full gap-2">
                {tt('zurueck_zum_dashboard')}
              </Button>
            </a>
          </div>
        </div>
      )}
    </IntentWizardShell>
  );
}
