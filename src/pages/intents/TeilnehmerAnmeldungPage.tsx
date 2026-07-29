/**
 * Intent: Teilnehmer-Anmeldung — 4-Schritt-Wizard für die vollständige Anmeldungserfassung.
 * Steps:
 *   1) Teilnehmer wählen oder neu anlegen
 *   2) Kurs wählen (aktive/geplante Kurse mit Platzinfo)
 *   3) Anmeldung bestätigen & erstellen
 *   4) Erste Zahlung erfassen
 * Reads: teilnehmer, kurseWorkshops, anmeldungen, raeume, dozenten.
 * Writes: teilnehmer (createTeilnehmerEntry), anmeldungen (createAnmeldungenEntry), zahlungen (createZahlungenEntry).
 * Composes: IntentWizardShell, EntitySelectStep, StatusBadge.
 */

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import type { Teilnehmer, KurseWorkshops } from '@/types/app';
import { enrichKurseWorkshops } from '@/lib/enrich';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  IconUserPlus,
  IconBook,
  IconCheck,
  IconCurrencyEuro,
  IconCalendar,
  IconUser,
  IconSchool,
  IconRefresh,
} from '@tabler/icons-react';

const STEPS = [
  { label: 'Teilnehmer' },
  { label: 'Kurs' },
  { label: 'Anmeldung' },
  { label: 'Zahlung' },
];

const TODAY = format(new Date(), 'yyyy-MM-dd');

function formatEuro(value?: number): string {
  if (value == null) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDate(value?: string): string {
  if (!value) return '–';
  try {
    return format(new Date(value), 'dd.MM.yyyy');
  } catch {
    return value;
  }
}

export default function TeilnehmerAnmeldungPage() {
  const {
    teilnehmer,
    kurseWorkshops,
    anmeldungen,
    raeumeMap,
    dozentenMap,
    loading,
    error,
    fetchAll,
  } = useDashboardData();

  const [step, setStep] = useState(1);

  // Step 1: Teilnehmer
  const [selectedTeilnehmer, setSelectedTeilnehmer] = useState<Teilnehmer | null>(null);
  const [showCreateTeilnehmer, setShowCreateTeilnehmer] = useState(false);
  const [tnVorname, setTnVorname] = useState('');
  const [tnNachname, setTnNachname] = useState('');
  const [tnEmail, setTnEmail] = useState('');
  const [tnTelefon, setTnTelefon] = useState('');
  const [tnSaving, setTnSaving] = useState(false);
  const [tnError, setTnError] = useState<string | null>(null);

  // Step 2: Kurs
  const [selectedKurs, setSelectedKurs] = useState<KurseWorkshops | null>(null);

  // Step 3: Anmeldung
  const [anmeldedatum, setAnmeldedatum] = useState(TODAY);
  const [statusAnmeldung, setStatusAnmeldung] = useState(
    LOOKUP_OPTIONS['anmeldungen']?.['status_anmeldung']?.[0]?.key ?? 'angemeldet'
  );
  const [bemerkungenAnmeldung, setBemerkungenAnmeldung] = useState('');
  const [anmeldungSaving, setAnmeldungSaving] = useState(false);
  const [anmeldungError, setAnmeldungError] = useState<string | null>(null);
  const [createdAnmeldungId, setCreatedAnmeldungId] = useState<string | null>(null);

  // Step 4: Zahlung
  const [betrag, setBetrag] = useState('');
  const [zahlungsdatum, setZahlungsdatum] = useState(TODAY);
  const [zahlungsart, setZahlungsart] = useState(
    LOOKUP_OPTIONS['zahlungen']?.['zahlungsart']?.[0]?.key ?? 'ueberweisung'
  );
  const [zahlungsstatus, setZahlungsstatus] = useState(
    LOOKUP_OPTIONS['zahlungen']?.['zahlungsstatus']?.[0]?.key ?? 'ausstehend'
  );
  const [zahlungSaving, setZahlungSaving] = useState(false);
  const [zahlungError, setZahlungError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Derived data
  const enrichedKurse = useMemo(
    () => enrichKurseWorkshops(kurseWorkshops, { raeumeMap, dozentenMap }),
    [kurseWorkshops, raeumeMap, dozentenMap]
  );

  const anmeldungenByKurs = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of anmeldungen) {
      const kursId = extractRecordId(a.fields.kurs);
      if (kursId) m.set(kursId, (m.get(kursId) ?? 0) + 1);
    }
    return m;
  }, [anmeldungen]);

  const activeKurse = useMemo(
    () =>
      enrichedKurse.filter(
        k =>
          k.fields.status_kurs?.key === 'aktiv' || k.fields.status_kurs?.key === 'geplant'
      ),
    [enrichedKurse]
  );

  // --- Handlers ---

  async function handleCreateTeilnehmer() {
    if (!tnVorname.trim() || !tnNachname.trim()) {
      setTnError('Vor- und Nachname sind Pflichtfelder.');
      return;
    }
    setTnSaving(true);
    setTnError(null);
    try {
      const result = await LivingAppsService.createTeilnehmerEntry({
        vorname: tnVorname.trim(),
        nachname: tnNachname.trim(),
        email: tnEmail.trim() || undefined,
        telefon: tnTelefon.trim() || undefined,
      });
      await fetchAll();
      // Auto-select the newly created record
      setSelectedTeilnehmer({
        record_id: result.record_id,
        created_at: result.created_at ?? '',
        updated_at: result.updated_at ?? null,
        createdat: result.created_at ?? '',
        updatedat: result.updated_at ?? null,
        fields: {
          vorname: tnVorname.trim(),
          nachname: tnNachname.trim(),
          email: tnEmail.trim() || undefined,
          telefon: tnTelefon.trim() || undefined,
        },
      });
      setShowCreateTeilnehmer(false);
      setTnVorname('');
      setTnNachname('');
      setTnEmail('');
      setTnTelefon('');
      setStep(2);
    } catch (e) {
      setTnError(e instanceof Error ? e.message : 'Fehler beim Anlegen des Teilnehmers.');
    } finally {
      setTnSaving(false);
    }
  }

  function handleSelectTeilnehmer(id: string) {
    const found = teilnehmer.find(t => t.record_id === id) ?? null;
    setSelectedTeilnehmer(found);
    setStep(2);
  }

  function handleSelectKurs(id: string) {
    const found = kurseWorkshops.find(k => k.record_id === id) ?? null;
    setSelectedKurs(found);
    if (found?.fields.preis != null) {
      setBetrag(String(found.fields.preis));
    }
    setStep(3);
  }

  async function handleCreateAnmeldung() {
    if (!selectedTeilnehmer || !selectedKurs) return;
    setAnmeldungSaving(true);
    setAnmeldungError(null);
    try {
      const result = await LivingAppsService.createAnmeldungenEntry({
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, selectedTeilnehmer.record_id),
        kurs: createRecordUrl(APP_IDS.KURSE_WORKSHOPS, selectedKurs.record_id),
        anmeldedatum: anmeldedatum,
        status_anmeldung: statusAnmeldung,
        bemerkungen_anmeldung: bemerkungenAnmeldung.trim() || undefined,
      });
      setCreatedAnmeldungId(result.record_id);
      await fetchAll();
      setStep(4);
    } catch (e) {
      setAnmeldungError(e instanceof Error ? e.message : 'Fehler beim Erstellen der Anmeldung.');
    } finally {
      setAnmeldungSaving(false);
    }
  }

  async function handleCreateZahlung() {
    if (!createdAnmeldungId) return;
    const betragNum = parseFloat(betrag.replace(',', '.'));
    if (isNaN(betragNum)) {
      setZahlungError('Bitte einen gültigen Betrag eingeben.');
      return;
    }
    setZahlungSaving(true);
    setZahlungError(null);
    try {
      await LivingAppsService.createZahlungenEntry({
        anmeldung: createRecordUrl(APP_IDS.ANMELDUNGEN, createdAnmeldungId),
        betrag: betragNum,
        zahlungsdatum: zahlungsdatum,
        zahlungsart: zahlungsart,
        zahlungsstatus: zahlungsstatus,
      });
      await fetchAll();
      setDone(true);
    } catch (e) {
      setZahlungError(e instanceof Error ? e.message : 'Fehler beim Speichern der Zahlung.');
    } finally {
      setZahlungSaving(false);
    }
  }

  function handleReset() {
    setStep(1);
    setSelectedTeilnehmer(null);
    setSelectedKurs(null);
    setShowCreateTeilnehmer(false);
    setTnVorname('');
    setTnNachname('');
    setTnEmail('');
    setTnTelefon('');
    setTnError(null);
    setAnmeldedatum(TODAY);
    setStatusAnmeldung(LOOKUP_OPTIONS['anmeldungen']?.['status_anmeldung']?.[0]?.key ?? 'angemeldet');
    setBemerkungenAnmeldung('');
    setAnmeldungError(null);
    setCreatedAnmeldungId(null);
    setBetrag('');
    setZahlungsdatum(TODAY);
    setZahlungsart(LOOKUP_OPTIONS['zahlungen']?.['zahlungsart']?.[0]?.key ?? 'ueberweisung');
    setZahlungsstatus(LOOKUP_OPTIONS['zahlungen']?.['zahlungsstatus']?.[0]?.key ?? 'ausstehend');
    setZahlungError(null);
    setDone(false);
  }

  const anmeldungStatusOptions = LOOKUP_OPTIONS['anmeldungen']?.['status_anmeldung'] ?? [];
  const zahlungsartOptions = LOOKUP_OPTIONS['zahlungen']?.['zahlungsart'] ?? [];
  const zahlungsstatusOptions = LOOKUP_OPTIONS['zahlungen']?.['zahlungsstatus'] ?? [];

  return (
    <IntentWizardShell
      title="Teilnehmer-Anmeldung"
      subtitle="Neuen Teilnehmer anmelden und erste Zahlung erfassen"
      steps={STEPS}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ──────────────────────────── STEP 1: Teilnehmer ──────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <EntitySelectStep
            items={teilnehmer.map(t => ({
              id: t.record_id,
              title: `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim() || '(Kein Name)',
              subtitle: t.fields.email ?? undefined,
              stats: t.fields.ort ? [{ label: 'Ort', value: t.fields.ort }] : undefined,
              icon: <IconUser size={20} className="text-primary" />,
            }))}
            onSelect={handleSelectTeilnehmer}
            searchPlaceholder="Teilnehmer suchen..."
            emptyIcon={<IconUser size={32} />}
            emptyText="Keine Teilnehmer gefunden. Lege einen neuen an."
            createLabel="Neuen Teilnehmer anlegen"
            onCreateNew={() => setShowCreateTeilnehmer(prev => !prev)}
            createDialog={
              showCreateTeilnehmer ? (
                <div className="rounded-2xl border bg-card p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <IconUserPlus size={18} className="text-primary" />
                    <span className="font-semibold text-sm">Neuen Teilnehmer anlegen</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="tn-vorname">Vorname *</Label>
                      <Input
                        id="tn-vorname"
                        value={tnVorname}
                        onChange={e => setTnVorname(e.target.value)}
                        placeholder="Vorname"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tn-nachname">Nachname *</Label>
                      <Input
                        id="tn-nachname"
                        value={tnNachname}
                        onChange={e => setTnNachname(e.target.value)}
                        placeholder="Nachname"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tn-email">E-Mail</Label>
                      <Input
                        id="tn-email"
                        type="email"
                        value={tnEmail}
                        onChange={e => setTnEmail(e.target.value)}
                        placeholder="E-Mail-Adresse"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tn-telefon">Telefon</Label>
                      <Input
                        id="tn-telefon"
                        type="tel"
                        value={tnTelefon}
                        onChange={e => setTnTelefon(e.target.value)}
                        placeholder="Telefonnummer"
                      />
                    </div>
                  </div>
                  {tnError && (
                    <p className="text-sm text-destructive">{tnError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateTeilnehmer}
                      disabled={tnSaving}
                      className="gap-1.5"
                    >
                      <IconUserPlus size={15} />
                      {tnSaving ? 'Wird angelegt...' : 'Anlegen & weiter'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateTeilnehmer(false)}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : null
            }
          />
        </div>
      )}

      {/* ──────────────────────────── STEP 2: Kurs ──────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {selectedTeilnehmer && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary text-sm text-muted-foreground">
              <IconUser size={15} className="shrink-0" />
              <span>
                Teilnehmer:{' '}
                <span className="font-medium text-foreground">
                  {selectedTeilnehmer.fields.vorname} {selectedTeilnehmer.fields.nachname}
                </span>
              </span>
            </div>
          )}

          <EntitySelectStep
            items={activeKurse.map(k => {
              const belegt = anmeldungenByKurs.get(k.record_id) ?? 0;
              const max = k.fields.max_teilnehmer ?? 0;
              const freie = Math.max(0, max - belegt);
              return {
                id: k.record_id,
                title: k.fields.titel ?? '(Kein Titel)',
                subtitle: [
                  k.fields.niveau?.label,
                  k.fields.kurstyp?.label,
                ]
                  .filter(Boolean)
                  .join(' · '),
                status: k.fields.status_kurs
                  ? { key: k.fields.status_kurs.key, label: k.fields.status_kurs.label }
                  : undefined,
                stats: [
                  { label: 'Preis', value: formatEuro(k.fields.preis) },
                  ...(max > 0 ? [{ label: 'Freie Plätze', value: freie }] : []),
                ],
                icon: <IconBook size={20} className="text-primary" />,
              };
            })}
            onSelect={handleSelectKurs}
            searchPlaceholder="Kurs suchen..."
            emptyIcon={<IconBook size={32} />}
            emptyText="Keine aktiven oder geplanten Kurse gefunden."
          />

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Zurück
            </Button>
          </div>
        </div>
      )}

      {/* ──────────────────────────── STEP 3: Anmeldung ──────────────────────────── */}
      {step === 3 && selectedTeilnehmer && selectedKurs && (
        <div className="space-y-5">
          {/* Summary card */}
          <div className="rounded-2xl border bg-card p-5 space-y-3 overflow-hidden">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Zusammenfassung
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IconUser size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Teilnehmer</p>
                  <p className="font-medium text-sm truncate">
                    {selectedTeilnehmer.fields.vorname} {selectedTeilnehmer.fields.nachname}
                  </p>
                  {selectedTeilnehmer.fields.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedTeilnehmer.fields.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IconBook size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Kurs</p>
                  <p className="font-medium text-sm truncate">{selectedKurs.fields.titel}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEuro(selectedKurs.fields.preis)}
                  </p>
                </div>
              </div>
            </div>

            {/* Kurs-Details */}
            {(() => {
              const enriched = enrichedKurse.find(k => k.record_id === selectedKurs.record_id);
              return enriched ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t text-xs">
                  <div>
                    <p className="text-muted-foreground">Start</p>
                    <p className="font-medium">{formatDate(enriched.fields.startdatum)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dozent</p>
                    <p className="font-medium">{enriched.dozentName || '–'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Raum</p>
                    <p className="font-medium">{enriched.raumName || '–'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preis</p>
                    <p className="font-medium">{formatEuro(enriched.fields.preis)}</p>
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          {/* Anmeldung form */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 overflow-hidden">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Anmeldung erfassen
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="anmeldedatum">
                  <IconCalendar size={13} className="inline mr-1" />
                  Anmeldedatum
                </Label>
                <Input
                  id="anmeldedatum"
                  type="date"
                  value={anmeldedatum}
                  onChange={e => setAnmeldedatum(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="status-anmeldung">Status</Label>
                <select
                  id="status-anmeldung"
                  value={statusAnmeldung}
                  onChange={e => setStatusAnmeldung(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {anmeldungStatusOptions.map(opt => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bemerkungen-anmeldung">Bemerkungen (optional)</Label>
              <Textarea
                id="bemerkungen-anmeldung"
                value={bemerkungenAnmeldung}
                onChange={e => setBemerkungenAnmeldung(e.target.value)}
                placeholder="Hinweise zur Anmeldung..."
                rows={3}
              />
            </div>

            {anmeldungError && (
              <p className="text-sm text-destructive">{anmeldungError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateAnmeldung}
              disabled={anmeldungSaving}
              className="gap-1.5"
            >
              <IconCheck size={15} />
              {anmeldungSaving ? 'Wird erstellt...' : 'Anmeldung erstellen'}
            </Button>
            <Button variant="outline" onClick={() => setStep(2)}>
              Zurück
            </Button>
          </div>
        </div>
      )}

      {/* ──────────────────────────── STEP 4: Zahlung ──────────────────────────── */}
      {step === 4 && !done && selectedTeilnehmer && selectedKurs && (
        <div className="space-y-5">
          {/* Summary banner */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-secondary text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <IconUser size={14} className="shrink-0" />
              <span className="font-medium text-foreground">
                {selectedTeilnehmer.fields.vorname} {selectedTeilnehmer.fields.nachname}
              </span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <IconSchool size={14} className="shrink-0" />
              <span className="font-medium text-foreground">{selectedKurs.fields.titel}</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <IconCurrencyEuro size={14} className="shrink-0" />
              <span className="font-medium text-foreground">{formatEuro(selectedKurs.fields.preis)}</span>
            </span>
          </div>

          {/* Zahlung form */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 overflow-hidden">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Zahlung erfassen
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="betrag">
                  <IconCurrencyEuro size={13} className="inline mr-1" />
                  Betrag (€) *
                </Label>
                <Input
                  id="betrag"
                  type="number"
                  min="0"
                  step="0.01"
                  value={betrag}
                  onChange={e => setBetrag(e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="zahlungsdatum">
                  <IconCalendar size={13} className="inline mr-1" />
                  Zahlungsdatum
                </Label>
                <Input
                  id="zahlungsdatum"
                  type="date"
                  value={zahlungsdatum}
                  onChange={e => setZahlungsdatum(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="zahlungsart">Zahlungsart</Label>
                <select
                  id="zahlungsart"
                  value={zahlungsart}
                  onChange={e => setZahlungsart(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {zahlungsartOptions.map(opt => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Zahlungsstatus als Radio-Tiles */}
            <div className="space-y-2">
              <Label>Zahlungsstatus</Label>
              <div className="flex flex-wrap gap-2">
                {zahlungsstatusOptions.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setZahlungsstatus(opt.key)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      zahlungsstatus === opt.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {zahlungError && (
              <p className="text-sm text-destructive">{zahlungError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateZahlung}
              disabled={zahlungSaving}
              className="gap-1.5"
            >
              <IconCheck size={15} />
              {zahlungSaving ? 'Wird gespeichert...' : 'Zahlung speichern'}
            </Button>
            <Button variant="outline" onClick={() => setStep(3)}>
              Zurück
            </Button>
          </div>
        </div>
      )}

      {/* ──────────────────────────── SUCCESS ──────────────────────────── */}
      {done && (
        <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <IconCheck size={32} className="text-primary" stroke={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Anmeldung abgeschlossen!</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {selectedTeilnehmer?.fields.vorname} {selectedTeilnehmer?.fields.nachname} wurde
              erfolgreich für{' '}
              <span className="font-medium text-foreground">
                {selectedKurs?.fields.titel}
              </span>{' '}
              angemeldet und die Zahlung wurde erfasst.
            </p>
          </div>

          {/* Status overview */}
          <div className="flex flex-wrap gap-3 justify-center">
            <StatusBadge statusKey={statusAnmeldung} label={
              anmeldungStatusOptions.find(o => o.key === statusAnmeldung)?.label ?? statusAnmeldung
            } />
            <StatusBadge statusKey={zahlungsstatus} label={
              zahlungsstatusOptions.find(o => o.key === zahlungsstatus)?.label ?? zahlungsstatus
            } />
          </div>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Button onClick={handleReset} className="gap-1.5">
              <IconRefresh size={15} />
              Neue Anmeldung
            </Button>
            <a href="#/">
              <Button variant="outline">Zurück zum Dashboard</Button>
            </a>
          </div>
        </div>
      )}
    </IntentWizardShell>
  );
}
