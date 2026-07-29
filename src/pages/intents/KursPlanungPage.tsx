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

const WIZARD_STEPS = [
  { label: 'Kurs-Details' },
  { label: 'Dozent' },
  { label: 'Raum' },
  { label: 'Veröffentlichen' },
];

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
      setDozentError('Vor- und Nachname sind erforderlich.');
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
      setRaumError('Raumname ist erforderlich.');
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
      title="Kurs planen"
      subtitle="Neuen Kurs oder Workshop Schritt für Schritt anlegen und veröffentlichen"
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
                <h2 className="font-semibold text-foreground">Kurs-Details</h2>
                <p className="text-sm text-muted-foreground">Grundlegende Informationen zum Kurs eingeben</p>
              </div>
            </div>

            {/* Titel */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Titel <span className="text-destructive">*</span>
              </label>
              <Input
                value={kursForm.titel}
                onChange={e => setKursForm(prev => ({ ...prev, titel: e.target.value }))}
                placeholder="z.B. Klavierkurs für Anfänger"
                className={formErrors.titel ? 'border-destructive' : ''}
              />
              {formErrors.titel && <p className="text-xs text-destructive">{formErrors.titel}</p>}
            </div>

            {/* Kurstyp */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Kurstyp <span className="text-destructive">*</span>
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
              <label className="text-sm font-medium text-foreground">Niveau</label>
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
                  Startdatum <span className="text-destructive">*</span>
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
                  Enddatum <span className="text-destructive">*</span>
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
              <label className="text-sm font-medium text-foreground">Wochentage</label>
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
                <label className="text-sm font-medium text-foreground">Uhrzeit Beginn</label>
                <Input
                  type="text"
                  value={kursForm.uhrzeit_beginn}
                  onChange={e => setKursForm(prev => ({ ...prev, uhrzeit_beginn: e.target.value }))}
                  placeholder="09:00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Uhrzeit Ende</label>
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
                <label className="text-sm font-medium text-foreground">Max. Teilnehmer</label>
                <Input
                  type="number"
                  min={1}
                  value={kursForm.max_teilnehmer}
                  onChange={e => setKursForm(prev => ({ ...prev, max_teilnehmer: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder="z.B. 10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Preis (€)</label>
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
              <label className="text-sm font-medium text-foreground">Beschreibung (optional)</label>
              <textarea
                value={kursForm.beschreibung}
                onChange={e => setKursForm(prev => ({ ...prev, beschreibung: e.target.value }))}
                placeholder="Kurzbeschreibung des Angebots..."
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
              Weiter: Dozent wählen
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
                <h2 className="font-semibold text-foreground">Dozent zuweisen</h2>
                <p className="text-sm text-muted-foreground">Wer leitet diesen Kurs?</p>
              </div>
            </div>

            <EntitySelectStep
              items={dozenten.map(d => ({
                id: d.record_id,
                title: [d.fields.vorname, d.fields.nachname].filter(Boolean).join(' ') || '(Kein Name)',
                subtitle: d.fields.instrumente && d.fields.instrumente.length > 0
                  ? d.fields.instrumente.map(i => i.label).join(', ')
                  : undefined,
                status: d.fields.beschaeftigungsart
                  ? { key: d.fields.beschaeftigungsart.key, label: d.fields.beschaeftigungsart.label }
                  : undefined,
                icon: <IconUser size={18} className="text-primary" />,
              }))}
              onSelect={handleSelectDozent}
              searchPlaceholder="Dozenten suchen..."
              emptyText="Kein Dozent gefunden."
              createLabel="Neuen Dozenten anlegen"
              onCreateNew={() => { setShowNewDozent(v => !v); }}
              createDialog={showNewDozent ? (
                <div className="rounded-2xl border bg-secondary p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Neuen Dozenten anlegen</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Vorname *</label>
                      <Input
                        value={newDozentForm.vorname}
                        onChange={e => setNewDozentForm(prev => ({ ...prev, vorname: e.target.value }))}
                        placeholder="Vorname"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Nachname *</label>
                      <Input
                        value={newDozentForm.nachname}
                        onChange={e => setNewDozentForm(prev => ({ ...prev, nachname: e.target.value }))}
                        placeholder="Nachname"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">E-Mail</label>
                    <Input
                      type="email"
                      value={newDozentForm.email}
                      onChange={e => setNewDozentForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@beispiel.de"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Instrumente</label>
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
                    <label className="text-xs font-medium text-muted-foreground">Beschäftigungsart</label>
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
                      {dozentSaving ? 'Speichern...' : 'Dozent anlegen'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setShowNewDozent(false); setNewDozentForm(DEFAULT_DOZENT_FORM); setDozentError(null); }}
                    >
                      Abbrechen
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
            <Button variant="outline" onClick={() => setStep(1)}>Zurück</Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedDozent}
              className="gap-2"
            >
              Weiter: Raum wählen
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
                <h2 className="font-semibold text-foreground">Raum auswählen</h2>
                <p className="text-sm text-muted-foreground">
                  Wo findet der Kurs statt?
                  {maxTeilnehmer > 0 && (
                    <span className="ml-1">Benötigte Kapazität: <strong>{maxTeilnehmer}</strong> Personen.</span>
                  )}
                </p>
              </div>
            </div>

            <EntitySelectStep
              items={raeume.map(r => {
                const tooSmall = maxTeilnehmer > 0 && (r.fields.kapazitaet ?? 0) < maxTeilnehmer;
                return {
                  id: r.record_id,
                  title: r.fields.raumname ?? '(Kein Name)',
                  subtitle: r.fields.etage ? `Etage: ${r.fields.etage}` : undefined,
                  stats: [
                    { label: 'Kapazität', value: r.fields.kapazitaet ?? '–' },
                    ...(tooSmall ? [{ label: '', value: '⚠ Zu klein' }] : []),
                  ],
                  status: r.fields.verfuegbarkeit
                    ? { key: r.fields.verfuegbarkeit.key, label: r.fields.verfuegbarkeit.label }
                    : undefined,
                  icon: <IconDoor size={18} className={tooSmall ? 'text-amber-500' : 'text-primary'} />,
                };
              })}
              onSelect={handleSelectRaum}
              searchPlaceholder="Raum suchen..."
              emptyText="Kein Raum gefunden."
              createLabel="Neuen Raum anlegen"
              onCreateNew={() => { setShowNewRaum(v => !v); }}
              createDialog={showNewRaum ? (
                <div className="rounded-2xl border bg-secondary p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Neuen Raum anlegen</h3>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Raumname *</label>
                    <Input
                      value={newRaumForm.raumname}
                      onChange={e => setNewRaumForm(prev => ({ ...prev, raumname: e.target.value }))}
                      placeholder="z.B. Übungsraum 1"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Kapazität</label>
                      <Input
                        type="number"
                        min={1}
                        value={newRaumForm.kapazitaet}
                        onChange={e => setNewRaumForm(prev => ({ ...prev, kapazitaet: e.target.value === '' ? '' : Number(e.target.value) }))}
                        placeholder="Personenanzahl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Etage</label>
                      <Input
                        value={newRaumForm.etage}
                        onChange={e => setNewRaumForm(prev => ({ ...prev, etage: e.target.value }))}
                        placeholder="z.B. 1. OG"
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
                      {raumSaving ? 'Speichern...' : 'Raum anlegen'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setShowNewRaum(false); setNewRaumForm(DEFAULT_RAUM_FORM); setRaumError(null); }}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : undefined}
            />

            {/* Selected Raum confirmation */}
            {selectedRaum && (() => {
              const tooSmall = maxTeilnehmer > 0 && (selectedRaum.fields.kapazitaet ?? 0) < maxTeilnehmer;
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
                      Kapazität: {selectedRaum.fields.kapazitaet ?? '–'}
                      {selectedRaum.fields.etage && ` · Etage: ${selectedRaum.fields.etage}`}
                    </p>
                    {tooSmall && (
                      <p className="text-xs font-medium text-amber-700 mt-1">
                        Raum zu klein — Kapazität ({selectedRaum.fields.kapazitaet ?? 0}) liegt unter der Teilnehmerzahl ({maxTeilnehmer})
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Zurück</Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!selectedRaum}
              className="gap-2"
            >
              Weiter: Veröffentlichen
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
                <h2 className="font-semibold text-foreground">Zusammenfassung</h2>
                <p className="text-sm text-muted-foreground">Bitte alles überprüfen, dann den Kurs anlegen</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Titel</dt>
                <dd className="font-semibold text-foreground mt-0.5 truncate">{kursForm.titel || '–'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typ</dt>
                <dd className="text-foreground mt-0.5">
                  {KURSTYP_OPTIONS.find(o => o.key === kursForm.kursTypKey)?.label ?? '–'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Niveau</dt>
                <dd className="text-foreground mt-0.5">
                  {NIVEAU_OPTIONS.find(o => o.key === kursForm.niveauKey)?.label ?? '–'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zeitraum</dt>
                <dd className="text-foreground mt-0.5">
                  {kursForm.startdatum ? kursForm.startdatum.replace('T', ' ') : '–'}
                  {kursForm.enddatum ? ` – ${kursForm.enddatum.replace('T', ' ')}` : ''}
                </dd>
              </div>
              {kursForm.wochentag.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wochentage</dt>
                  <dd className="text-foreground mt-0.5">
                    {kursForm.wochentag.map(k => WOCHENTAG_OPTIONS.find(o => o.key === k)?.label ?? k).join(', ')}
                  </dd>
                </div>
              )}
              {(kursForm.uhrzeit_beginn || kursForm.uhrzeit_ende) && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zeiten</dt>
                  <dd className="text-foreground mt-0.5">
                    {kursForm.uhrzeit_beginn || '?'} – {kursForm.uhrzeit_ende || '?'} Uhr
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dozent</dt>
                <dd className="text-foreground mt-0.5 font-medium">
                  {selectedDozent
                    ? [selectedDozent.fields.vorname, selectedDozent.fields.nachname].filter(Boolean).join(' ')
                    : '–'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Raum</dt>
                <dd className="text-foreground mt-0.5 font-medium">{selectedRaum?.fields.raumname ?? '–'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preis</dt>
                <dd className="text-foreground mt-0.5">
                  {kursForm.preis !== '' ? `${kursForm.preis} €` : '–'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max. Teilnehmer</dt>
                <dd className="text-foreground mt-0.5">
                  {kursForm.max_teilnehmer !== '' ? kursForm.max_teilnehmer : '–'}
                </dd>
              </div>
            </dl>

            {kursForm.beschreibung && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Beschreibung</dt>
                <dd className="text-sm text-foreground mt-1 whitespace-pre-wrap">{kursForm.beschreibung}</dd>
              </div>
            )}
          </div>

          {/* Status-Auswahl */}
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Status beim Anlegen</h3>
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
            <Button variant="outline" onClick={() => setStep(3)}>Zurück</Button>
            <Button
              onClick={handleCreateKurs}
              disabled={saving || !selectedDozent || !selectedRaum}
              className="gap-2"
            >
              {saving ? 'Wird angelegt...' : 'Kurs anlegen'}
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
            <h2 className="text-xl font-bold text-foreground">Kurs angelegt!</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              <strong>„{savedTitel}"</strong> wurde erfolgreich erstellt und gespeichert.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleReset} className="gap-2">
              <IconRefresh size={16} />
              Weiteren Kurs planen
            </Button>
            <a href="#/">
              <Button variant="outline" className="w-full gap-2">
                Zurück zum Dashboard
              </Button>
            </a>
          </div>
        </div>
      )}
    </IntentWizardShell>
  );
}
