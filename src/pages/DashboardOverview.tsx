import { useState, useMemo } from 'react';
import { de } from 'date-fns/locale';
import { format, parseISO, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichKurseWorkshops, enrichAnmeldungen, enrichZahlungen } from '@/lib/enrich';
import type { EnrichedKurseWorkshops, EnrichedAnmeldungen, EnrichedZahlungen } from '@/types/enriched';
import type { Raeume, Dozenten, KurseWorkshops, Teilnehmer, Anmeldungen, Zahlungen } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { DashboardSkeleton, DashboardError } from '@/components/DashboardStates';
import { DashboardGrid } from '@/components/DashboardGrid';
import { HeroBanner } from '@/components/HeroBanner';
import { WorkList } from '@/components/WorkList';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import {
  RecordOverlayHost,
  RecordHeader,
  RecordAttachments,
  useRecordOverlayStack,
} from '@/components/widgets/RecordView';
import { CalendarWidget, type CalendarEvent } from '@/components/widgets/CalendarWidget';
import { KurseWorkshopsDialog, type KurseWorkshopsDialogDefaults } from '@/components/dialogs/KurseWorkshopsDialog';
import { AnmeldungenDialog, type AnmeldungenDialogDefaults } from '@/components/dialogs/AnmeldungenDialog';
import { ZahlungenDialog, type ZahlungenDialogDefaults } from '@/components/dialogs/ZahlungenDialog';
import { KurseWorkshopsDetails } from '@/components/details/KurseWorkshopsDetails';
import { AnmeldungenDetails } from '@/components/details/AnmeldungenDetails';
import { ZahlungenDetails } from '@/components/details/ZahlungenDetails';
import { DozentenDetails } from '@/components/details/DozentenDetails';
import { RaeumeDetails } from '@/components/details/RaeumeDetails';
import { TeilnehmerDetails } from '@/components/details/TeilnehmerDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import {
  IconMusic,
  IconPlus,
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react';

import { makeT } from '@/i18n';

const tt = makeT({
  de: {
    kurs: 'Kurs',
    anmeldung_abgeschlossen: 'Anmeldung abgeschlossen',
    zahlung_als_bezahlt_markiert: 'Zahlung als bezahlt markiert',
    diese_woche_startet: 'Diese Woche startet {p0}.',
    diese_woche_starten: 'Diese Woche starten {p0}.',
    aktive_anmeldungen_im_system: '{p0} aktive Anmeldungen im System.',
    aktive_anmeldung_im_system: '{p0} aktive Anmeldung im System.',
    noch_keine_kurse_geplant_leg_gle: 'Noch keine Kurse geplant — leg gleich los!',
    kurs_anlegen: 'Kurs anlegen',
    dozent_zuweisen: 'Dozent zuweisen',
    diese_woche_ohne_dozent: 'diese Woche ohne Dozent.',
    aktive_kurse: 'Aktive Kurse',
    anmeldungen: 'Anmeldungen',
    ausstehende_zahlungen: 'Ausstehende Zahlungen',
    diese_woche: 'Diese Woche',
    kurs_verschoben: 'Kurs verschoben',
    neue_anmeldungen: 'Neue Anmeldungen',
    unbekannt: 'Unbekannt',
    abschliessen: '✓ Abschließen',
    keine_neuen_anmeldungen_in_den_l: 'Keine neuen Anmeldungen in den letzten 7 Tagen',
    anmeldung_erfassen: 'Anmeldung erfassen',
    bezahlt: '✓ Bezahlt',
    alle_zahlungen_beglichen_super: 'Alle Zahlungen beglichen — super!',
    zahlung: 'Zahlung',
    raum: 'Raum',
    personen: '{p0} Personen',
    als_bezahlt_markieren: '✓ Als bezahlt markieren',
  },
  en: {
    kurs: 'Course',
    anmeldung_abgeschlossen: 'Registration Completed',
    zahlung_als_bezahlt_markiert: 'Payment Marked as Paid',
    diese_woche_startet: 'This week {p0} starts.',
    diese_woche_starten: 'This week {p0} start.',
    aktive_anmeldungen_im_system: '{p0} active registrations in the system.',
    aktive_anmeldung_im_system: '{p0} active registration in the system.',
    noch_keine_kurse_geplant_leg_gle: 'No courses scheduled yet — get started!',
    kurs_anlegen: 'Create Course',
    dozent_zuweisen: 'Assign Instructor',
    diese_woche_ohne_dozent: 'this week without an instructor.',
    aktive_kurse: 'Active Courses',
    anmeldungen: 'Registrations',
    ausstehende_zahlungen: 'Pending Payments',
    diese_woche: 'This Week',
    kurs_verschoben: 'Course Rescheduled',
    neue_anmeldungen: 'New Registrations',
    unbekannt: 'Unknown',
    abschliessen: '✓ Complete',
    keine_neuen_anmeldungen_in_den_l: 'No new registrations in the last 7 days',
    anmeldung_erfassen: 'Record Registration',
    bezahlt: '✓ Paid',
    alle_zahlungen_beglichen_super: 'All payments settled — great!',
    zahlung: 'Payment',
    raum: 'Room',
    personen: '{p0} Persons',
    als_bezahlt_markieren: '✓ Mark as Paid',
  },
});

// Overlay item type
type OverlayItem =
  | { type: 'kurs'; id: string }
  | { type: 'anmeldung'; id: string }
  | { type: 'zahlung'; id: string }
  | { type: 'dozent'; id: string }
  | { type: 'raum'; id: string }
  | { type: 'teilnehmer'; id: string };

export default function DashboardOverview() {
  const clock = useClock();

  const {
    raeume, dozenten, kurseWorkshops, teilnehmer, anmeldungen, zahlungen,
    raeumeMap, dozentenMap, kurseWorkshopsMap, teilnehmerMap, anmeldungenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedKurseWorkshops = enrichKurseWorkshops(kurseWorkshops, { raeumeMap, dozentenMap });
  const enrichedAnmeldungen = enrichAnmeldungen(anmeldungen, { teilnehmerMap, kurseWorkshopsMap });
  const enrichedZahlungen = enrichZahlungen(zahlungen, { anmeldungenMap });

  // Dialog state
  const [kursDialog, setKursDialog] = useState<{ open: boolean; defaults?: KurseWorkshopsDialogDefaults; recordId?: string }>({ open: false });
  const [anmeldungDialog, setAnmeldungDialog] = useState<{ open: boolean; defaults?: AnmeldungenDialogDefaults; recordId?: string }>({ open: false });
  const [zahlungDialog, setZahlungDialog] = useState<{ open: boolean; defaults?: ZahlungenDialogDefaults; recordId?: string }>({ open: false });

  // Overlay stack
  const overlay = useRecordOverlayStack<OverlayItem>();

  // Calendar events — ALL hooks MUST be before early returns
  const events = useMemo<CalendarEvent[]>(() => {
    return enrichedKurseWorkshops
      .filter(k => !!k.fields.startdatum)
      .map(k => {
        const statusKey = k.fields.status_kurs?.key;
        const tone: CalendarEvent['tone'] =
          statusKey === 'aktiv' ? 'success' :
          statusKey === 'abgesagt' ? 'destructive' :
          statusKey === 'abgeschlossen' ? 'default' :
          'primary';
        return {
          id: `kurs:${k.record_id}`,
          start: k.fields.startdatum!,
          end: k.fields.enddatum,
          title: k.fields.titel ?? tt('kurs'),
          subtitle: k.dozentName ?? k.fields.uhrzeit_beginn,
          tone,
        };
      });
  }, [enrichedKurseWorkshops]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  // Derived data
  const today = startOfDay(clock);
  const nextWeek = addDays(today, 7);

  const activeKurse = enrichedKurseWorkshops.filter(k =>
    k.fields.status_kurs?.key === 'aktiv' || k.fields.status_kurs?.key === 'geplant'
  );

  const aktuelleAnmeldungen = enrichedAnmeldungen.filter(a =>
    a.fields.status_anmeldung?.key === 'angemeldet'
  );

  // Ausstehende Zahlungen (not bezahlt)
  const ausstehendZahlungen = enrichedZahlungen.filter(z =>
    z.fields.zahlungsstatus?.key === 'ausstehend' || z.fields.zahlungsstatus?.key === 'teilbezahlt'
  );

  // Kurse starting this week
  const kurseThisWeek = enrichedKurseWorkshops.filter(k => {
    if (!k.fields.startdatum) return false;
    const start = parseISO(k.fields.startdatum);
    return !isBefore(start, today) && isBefore(start, nextWeek);
  });

  // Neue Anmeldungen (last 7 days)
  const neueAnmeldungen = enrichedAnmeldungen.filter(a => {
    if (!a.fields.anmeldedatum) return false;
    const d = parseISO(a.fields.anmeldedatum);
    return !isBefore(d, addDays(today, -7));
  }).sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? ''));

  // Hero: Kurse soon without a Dozent
  const ohneDozent = kurseThisWeek.filter(k => !k.fields.dozent);

  // Advance: mark Anmeldung as abgeschlossen
  const advanceAnmeldung = async (a: EnrichedAnmeldungen) => {
    const prev = a.fields.status_anmeldung?.key;
    // optimistic
    fetchAll();
    try {
      await LivingAppsService.updateAnmeldungenEntry(a.record_id, { status_anmeldung: 'abgeschlossen' });
      undoToast(tt('anmeldung_abgeschlossen'), async () => {
        await LivingAppsService.updateAnmeldungenEntry(a.record_id, { status_anmeldung: prev ?? 'angemeldet' });
        fetchAll();
      });
      fetchAll();
    } catch {
      fetchAll();
    }
  };

  // Mark Zahlung as bezahlt
  const markZahlungBezahlt = async (z: EnrichedZahlungen) => {
    const prev = z.fields.zahlungsstatus?.key;
    try {
      await LivingAppsService.updateZahlungenEntry(z.record_id, { zahlungsstatus: 'bezahlt' });
      undoToast(tt('zahlung_als_bezahlt_markiert'), async () => {
        await LivingAppsService.updateZahlungenEntry(z.record_id, { zahlungsstatus: prev ?? 'ausstehend' });
        fetchAll();
      });
      fetchAll();
    } catch {
      fetchAll();
    }
  };

  // Rescue: assign a dozent to the first kurs without one
  const rescueKurs = async () => {
    if (ohneDozent.length === 0) return;
    const k = ohneDozent[0];
    setKursDialog({ open: true, defaults: { titel: k.fields.titel, startdatum: k.fields.startdatum, status_kurs: k.fields.status_kurs?.key }, recordId: k.record_id });
  };

  // Context line
  const kursNamen = namen(kurseThisWeek.map(k => k.fields.titel ?? ''));
  const contextLine = kurseThisWeek.length > 0
    ? (kurseThisWeek.length === 1 ? tt('diese_woche_startet', { p0: kursNamen }) : tt('diese_woche_starten', { p0: kursNamen }))
    : (aktuelleAnmeldungen.length > 0 ? aktuelleAnmeldungen.length !== 1 ? tt('aktive_anmeldungen_im_system', { p0: aktuelleAnmeldungen.length }) : tt('aktive_anmeldung_im_system', { p0: aktuelleAnmeldungen.length }) : tt('noch_keine_kurse_geplant_leg_gle'));

  // Lookup helpers for overlay rendering
  const findKurs = (id: string) => kurseWorkshops.find(k => k.record_id === id);
  const findAnmeldung = (id: string) => anmeldungen.find(a => a.record_id === id);
  const findZahlung = (id: string) => zahlungen.find(z => z.record_id === id);
  const findDozent = (id: string) => dozenten.find(d => d.record_id === id);
  const findRaum = (id: string) => raeume.find(r => r.record_id === id);
  const findTeilnehmer = (id: string) => teilnehmer.find(t => t.record_id === id);

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{gruss(clock)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{contextLine}</p>
        <div className="mt-3">
          <button
            onClick={() => setKursDialog({ open: true })}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <IconPlus size={16} className="shrink-0" />
            {tt('kurs_anlegen')}
          </button>
        </div>
      </div>

      <DashboardGrid
        variant="wide"
        hero={
          ohneDozent.length > 0 ? (
            <HeroBanner
              icon={<IconAlertTriangle size={18} />}
              action={{ label: tt('dozent_zuweisen'), onClick: rescueKurs }}
            >
              <b>{namen(ohneDozent.map(k => k.fields.titel ?? ''))}</b>{' '}
              {ohneDozent.length === 1 ? 'startet' : 'starten'} {tt('diese_woche_ohne_dozent')}
            </HeroBanner>
          ) : undefined
        }
        kpis={
          <StatStrip>
            <StatStripItem
              title={tt('aktive_kurse')}
              value={activeKurse.length}
              icon={<IconMusic size={16} />}
              tone="default"
            />
            <StatStripItem
              title={tt('anmeldungen')}
              value={aktuelleAnmeldungen.length}
              icon={<IconCheck size={16} />}
              tone={aktuelleAnmeldungen.length > 0 ? 'success' : 'default'}
            />
            <StatStripItem
              title={tt('ausstehende_zahlungen')}
              value={ausstehendZahlungen.length}
              tone={ausstehendZahlungen.length > 0 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={tt('diese_woche')}
              value={kurseThisWeek.length}
              tone={kurseThisWeek.length > 0 ? 'primary' : 'default'}
            />
          </StatStrip>
        }
        primary={
          <CalendarWidget
            events={events}
            defaultView="week"
            locale={de}
            weekDays={5}
            dayStartHour={7}
            dayEndHour={22}
            onEventClick={ev => {
              const id = ev.id.split(':')[1];
              if (id) overlay.replace({ type: 'kurs', id });
            }}
            onRangeCreate={(start, end) => {
              setKursDialog({
                open: true,
                defaults: {
                  startdatum: format(start, "yyyy-MM-dd'T'HH:mm"),
                  enddatum: format(end, "yyyy-MM-dd'T'HH:mm"),
                  status_kurs: 'geplant',
                },
              });
            }}
            onEventDrop={async (eventId, newStart, newEnd) => {
              const rid = eventId.split(':')[1];
              if (!rid) return;
              try {
                await LivingAppsService.updateKurseWorkshop(rid, {
                  startdatum: newStart,
                  ...(newEnd ? { enddatum: newEnd } : {}),
                });
                undoToast(tt('kurs_verschoben'), async () => {
                  const orig = findKurs(rid);
                  if (orig) {
                    await LivingAppsService.updateKurseWorkshop(rid, {
                      startdatum: orig.fields.startdatum,
                      enddatum: orig.fields.enddatum,
                    });
                    fetchAll();
                  }
                });
                fetchAll();
              } catch {
                fetchAll();
              }
            }}
          />
        }
        aside={
          <>
            <WorkList
              title={tt('neue_anmeldungen')}
              max={6}
              items={neueAnmeldungen.map(a => {
                const tnName = [
                  teilnehmer.find(t => t.record_id === extractRecordId(a.fields.teilnehmer))?.fields.vorname,
                  teilnehmer.find(t => t.record_id === extractRecordId(a.fields.teilnehmer))?.fields.nachname,
                ].filter(Boolean).join(' ') || tt('unbekannt');
                const kursTitle = kurseWorkshops.find(k => k.record_id === extractRecordId(a.fields.kurs))?.fields.titel ?? tt('kurs');
                return {
                  id: a.record_id,
                  title: tnName,
                  secondLine: (
                    <>
                      <span className="text-muted-foreground">{kursTitle}</span>
                      {a.fields.anmeldedatum && (
                        <span className="text-muted-foreground"> · {formatDate(a.fields.anmeldedatum)}</span>
                      )}
                    </>
                  ),
                  action: {
                    label: tt('abschliessen'),
                    onClick: () => advanceAnmeldung(a),
                  },
                };
              })}
              onItemClick={id => overlay.replace({ type: 'anmeldung', id })}
              empty={{
                text: tt('keine_neuen_anmeldungen_in_den_l'),
                action: { label: tt('anmeldung_erfassen'), onClick: () => setAnmeldungDialog({ open: true }) },
              }}
            />
            <WorkList
              title={tt('ausstehende_zahlungen')}
              max={5}
              items={ausstehendZahlungen.map(z => {
                const anmeldung = anmeldungen.find(a => a.record_id === extractRecordId(z.fields.anmeldung));
                const tnId = anmeldung ? extractRecordId(anmeldung.fields.teilnehmer) : null;
                const tnName = tnId
                  ? [
                    teilnehmer.find(t => t.record_id === tnId)?.fields.vorname,
                    teilnehmer.find(t => t.record_id === tnId)?.fields.nachname,
                  ].filter(Boolean).join(' ') || tt('unbekannt')
                  : 'Unbekannt';
                const betrag = z.fields.betrag != null ? `${z.fields.betrag} €` : '';
                return {
                  id: z.record_id,
                  title: tnName,
                  secondLine: (
                    <>
                      <span className={z.fields.zahlungsstatus?.key === 'ausstehend' ? 'font-medium text-warning' : 'font-medium text-muted-foreground'}>
                        {z.fields.zahlungsstatus?.label}
                      </span>
                      {betrag && <span className="text-muted-foreground"> · {betrag}</span>}
                    </>
                  ),
                  action: {
                    label: tt('bezahlt'),
                    onClick: () => markZahlungBezahlt(z),
                  },
                };
              })}
              onItemClick={id => overlay.replace({ type: 'zahlung', id })}
              empty={{
                text: tt('alle_zahlungen_beglichen_super'),
              }}
            />
          </>
        }
      />

      {/* Dialogs */}
      <KurseWorkshopsDialog
        open={kursDialog.open}
        onClose={() => setKursDialog({ open: false })}
        onSubmit={async (fields) => {
          if (kursDialog.recordId) {
            await LivingAppsService.updateKurseWorkshop(kursDialog.recordId, fields);
          } else {
            await LivingAppsService.createKurseWorkshop(fields);
          }
          fetchAll();
        }}
        defaultValues={kursDialog.defaults}
        recordId={kursDialog.recordId}
        raeumeList={raeume}
        dozentenList={dozenten}
        enablePhotoScan={AI_PHOTO_SCAN['KurseWorkshops']}
        enablePhotoLocation={AI_PHOTO_LOCATION['KurseWorkshops']}
      />

      <AnmeldungenDialog
        open={anmeldungDialog.open}
        onClose={() => setAnmeldungDialog({ open: false })}
        onSubmit={async (fields) => {
          if (anmeldungDialog.recordId) {
            await LivingAppsService.updateAnmeldungenEntry(anmeldungDialog.recordId, fields);
          } else {
            await LivingAppsService.createAnmeldungenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={anmeldungDialog.defaults}
        recordId={anmeldungDialog.recordId}
        teilnehmerList={teilnehmer}
        kurseWorkshopsList={kurseWorkshops}
        enablePhotoScan={AI_PHOTO_SCAN['Anmeldungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Anmeldungen']}
      />

      <ZahlungenDialog
        open={zahlungDialog.open}
        onClose={() => setZahlungDialog({ open: false })}
        onSubmit={async (fields) => {
          if (zahlungDialog.recordId) {
            await LivingAppsService.updateZahlungenEntry(zahlungDialog.recordId, fields);
          } else {
            await LivingAppsService.createZahlungenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={zahlungDialog.defaults}
        recordId={zahlungDialog.recordId}
        anmeldungenList={anmeldungen}
        enablePhotoScan={AI_PHOTO_SCAN['Zahlungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Zahlungen']}
      />

      {/* ONE overlay host for the whole page */}
      <RecordOverlayHost
        overlay={overlay}
        render={top => {
          if (top.type === 'kurs') {
            const k = findKurs(top.id);
            if (!k) return null;
            return (
              <>
                <RecordHeader
                  title={k.fields.titel ?? tt('kurs')}
                  subtitle={k.fields.kurstyp?.label}
                  meta={k.fields.startdatum ? formatDate(k.fields.startdatum) : undefined}
                  badges={
                    k.fields.status_kurs?.label ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {k.fields.status_kurs.label}
                      </span>
                    ) : undefined
                  }
                />
                <KurseWorkshopsDetails
                  record={k}
                  raeumeList={raeume}
                  onOpenRaeume={r => overlay.push({ type: 'raum', id: r.record_id })}
                  dozentenList={dozenten}
                  onOpenDozenten={d => overlay.push({ type: 'dozent', id: d.record_id })}
                  anmeldungenList={anmeldungen}
                  onOpenAnmeldungen={a => overlay.push({ type: 'anmeldung', id: a.record_id })}
                  onAddAnmeldungen={() => setAnmeldungDialog({ open: true, defaults: { kurs: k.record_id } })}
                />
              </>
            );
          }
          if (top.type === 'anmeldung') {
            const a = findAnmeldung(top.id);
            if (!a) return null;
            const tnId = extractRecordId(a.fields.teilnehmer);
            const tn = tnId ? teilnehmer.find(t => t.record_id === tnId) : undefined;
            return (
              <>
                <RecordHeader
                  title={tn ? `${tn.fields.vorname ?? ''} ${tn.fields.nachname ?? ''}`.trim() : 'Anmeldung'}
                  subtitle={kurseWorkshops.find(k => k.record_id === extractRecordId(a.fields.kurs))?.fields.titel}
                  meta={a.fields.anmeldedatum ? formatDate(a.fields.anmeldedatum) : undefined}
                />
                <AnmeldungenDetails
                  record={a}
                  teilnehmerList={teilnehmer}
                  onOpenTeilnehmer={t => overlay.push({ type: 'teilnehmer', id: t.record_id })}
                  kurseWorkshopsList={kurseWorkshops}
                  onOpenKurseWorkshops={k => overlay.push({ type: 'kurs', id: k.record_id })}
                  zahlungenList={zahlungen}
                  onOpenZahlungen={z => overlay.push({ type: 'zahlung', id: z.record_id })}
                  onAddZahlungen={() => setZahlungDialog({ open: true, defaults: { anmeldung: a.record_id } })}
                />
              </>
            );
          }
          if (top.type === 'zahlung') {
            const z = findZahlung(top.id);
            if (!z) return null;
            return (
              <>
                <RecordHeader
                  title={z.fields.rechnungsnummer ?? tt('zahlung')}
                  subtitle={z.fields.zahlungsart?.label}
                  meta={z.fields.zahlungsdatum ? formatDate(z.fields.zahlungsdatum) : undefined}
                />
                <ZahlungenDetails
                  record={z}
                  anmeldungenList={anmeldungen}
                  onOpenAnmeldungen={a => overlay.push({ type: 'anmeldung', id: a.record_id })}
                />
              </>
            );
          }
          if (top.type === 'dozent') {
            const d = findDozent(top.id);
            if (!d) return null;
            return (
              <>
                <RecordHeader
                  title={`${d.fields.vorname ?? ''} ${d.fields.nachname ?? ''}`.trim()}
                  subtitle={d.fields.beschaeftigungsart?.label}
                />
                <DozentenDetails
                  record={d}
                  kurseWorkshopsList={kurseWorkshops}
                  onOpenKurseWorkshops={k => overlay.push({ type: 'kurs', id: k.record_id })}
                  onAddKurseWorkshops={() => setKursDialog({ open: true, defaults: { dozent: d.record_id } })}
                />
              </>
            );
          }
          if (top.type === 'raum') {
            const r = findRaum(top.id);
            if (!r) return null;
            return (
              <>
                <RecordHeader
                  title={r.fields.raumname ?? tt('raum')}
                  subtitle={r.fields.etage}
                  meta={r.fields.kapazitaet != null ? tt('personen', { p0: r.fields.kapazitaet }) : undefined}
                />
                <RaeumeDetails
                  record={r}
                  kurseWorkshopsList={kurseWorkshops}
                  onOpenKurseWorkshops={k => overlay.push({ type: 'kurs', id: k.record_id })}
                  onAddKurseWorkshops={() => setKursDialog({ open: true, defaults: { raum: r.record_id } })}
                />
              </>
            );
          }
          if (top.type === 'teilnehmer') {
            const t = findTeilnehmer(top.id);
            if (!t) return null;
            return (
              <>
                <RecordHeader
                  title={`${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.trim()}
                  subtitle={t.fields.email}
                  meta={t.fields.telefon}
                />
                <TeilnehmerDetails
                  record={t}
                  anmeldungenList={anmeldungen}
                  onOpenAnmeldungen={a => overlay.push({ type: 'anmeldung', id: a.record_id })}
                  onAddAnmeldungen={() => setAnmeldungDialog({ open: true, defaults: { teilnehmer: t.record_id } })}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={top => {
          if (top.type === 'kurs') {
            const k = findKurs(top.id);
            if (k) setKursDialog({ open: true, defaults: k.fields as KurseWorkshopsDialogDefaults, recordId: k.record_id });
          } else if (top.type === 'anmeldung') {
            const a = findAnmeldung(top.id);
            if (a) setAnmeldungDialog({ open: true, defaults: a.fields as AnmeldungenDialogDefaults, recordId: a.record_id });
          } else if (top.type === 'zahlung') {
            const z = findZahlung(top.id);
            if (z) setZahlungDialog({ open: true, defaults: z.fields as ZahlungenDialogDefaults, recordId: z.record_id });
          }
        }}
        footer={top => {
          if (top.type === 'anmeldung') {
            const a = findAnmeldung(top.id);
            if (a && a.fields.status_anmeldung?.key === 'angemeldet') {
              return { label: tt('abschliessen'), onClick: () => { void advanceAnmeldung(enrichedAnmeldungen.find(ea => ea.record_id === a.record_id)!); overlay.close(); } };
            }
          }
          if (top.type === 'zahlung') {
            const z = findZahlung(top.id);
            if (z && (z.fields.zahlungsstatus?.key === 'ausstehend' || z.fields.zahlungsstatus?.key === 'teilbezahlt')) {
              return { label: tt('als_bezahlt_markieren'), onClick: () => { void markZahlungBezahlt(enrichedZahlungen.find(ez => ez.record_id === z.record_id)!); overlay.close(); } };
            }
          }
          return undefined;
        }}
      />
    </>
  );
}
