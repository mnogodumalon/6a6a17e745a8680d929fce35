import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Raeume {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    raumname?: string;
    kapazitaet?: number;
    etage?: string;
    ausstattung?: LookupValue[];
    verfuegbarkeit?: LookupValue;
    bemerkungen_raum?: string;
  };
}

export interface Dozenten {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    instrumente?: LookupValue[];
    qualifikationen?: string;
    beschaeftigungsart?: LookupValue;
    foto?: string;
  };
}

export interface KurseWorkshops {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    kurstyp?: LookupValue;
    beschreibung?: string;
    niveau?: LookupValue;
    startdatum?: string; // Format: YYYY-MM-DD oder ISO String
    enddatum?: string; // Format: YYYY-MM-DD oder ISO String
    wochentag?: LookupValue[];
    uhrzeit_beginn?: string;
    uhrzeit_ende?: string;
    raum?: string; // applookup -> URL zu 'Raeume' Record
    dozent?: string; // applookup -> URL zu 'Dozenten' Record
    max_teilnehmer?: number;
    preis?: number;
    status_kurs?: LookupValue;
  };
}

export interface Teilnehmer {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    email?: string;
    telefon?: string;
    strasse?: string;
    hausnummer?: string;
    postleitzahl?: string;
    ort?: string;
    notfall_name?: string;
    notfall_telefon?: string;
    bemerkungen_tn?: string;
  };
}

export interface Anmeldungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    teilnehmer?: string; // applookup -> URL zu 'Teilnehmer' Record
    kurs?: string; // applookup -> URL zu 'KurseWorkshops' Record
    anmeldedatum?: string; // Format: YYYY-MM-DD oder ISO String
    status_anmeldung?: LookupValue;
    bemerkungen_anmeldung?: string;
  };
}

export interface Zahlungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    anmeldung?: string; // applookup -> URL zu 'Anmeldungen' Record
    betrag?: number;
    zahlungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    zahlungsart?: LookupValue;
    zahlungsstatus?: LookupValue;
    rechnungsnummer?: string;
    bemerkungen_zahlung?: string;
  };
}

export const APP_IDS = {
  RAEUME: '6a6a1795f17d72e9333055ce',
  DOZENTEN: '6a6a17a1511a1b43fc949808',
  KURSE_WORKSHOPS: '6a6a17a21f93a5d088df79ed',
  TEILNEHMER: '6a6a17a3df7b044206a1a8e8',
  ANMELDUNGEN: '6a6a17a3f4ef3570bc1a1a9c',
  ZAHLUNGEN: '6a6a17a4f0c0fd747c867c95',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'raeume': {
    ausstattung: [{ key: "klavier", get label() { return lookupLabel('raeume', 'ausstattung', "klavier") ?? "Klavier"; } }, { key: "fluegel", get label() { return lookupLabel('raeume', 'ausstattung', "fluegel") ?? "Flügel"; } }, { key: "schlagzeug", get label() { return lookupLabel('raeume', 'ausstattung', "schlagzeug") ?? "Schlagzeug"; } }, { key: "gitarren_verstaerker", get label() { return lookupLabel('raeume', 'ausstattung', "gitarren_verstaerker") ?? "Gitarren-Verstärker"; } }, { key: "pa_anlage", get label() { return lookupLabel('raeume', 'ausstattung', "pa_anlage") ?? "PA-Anlage"; } }, { key: "whiteboard", get label() { return lookupLabel('raeume', 'ausstattung', "whiteboard") ?? "Whiteboard"; } }, { key: "notenstander", get label() { return lookupLabel('raeume', 'ausstattung', "notenstander") ?? "Notenständer"; } }, { key: "aufnahmetechnik", get label() { return lookupLabel('raeume', 'ausstattung', "aufnahmetechnik") ?? "Aufnahmetechnik"; } }],
    verfuegbarkeit: [{ key: "verfuegbar", get label() { return lookupLabel('raeume', 'verfuegbarkeit', "verfuegbar") ?? "Verfügbar"; } }, { key: "belegt", get label() { return lookupLabel('raeume', 'verfuegbarkeit', "belegt") ?? "Belegt"; } }, { key: "in_wartung", get label() { return lookupLabel('raeume', 'verfuegbarkeit', "in_wartung") ?? "In Wartung"; } }],
  },
  'dozenten': {
    instrumente: [{ key: "klavier", get label() { return lookupLabel('dozenten', 'instrumente', "klavier") ?? "Klavier"; } }, { key: "gitarre", get label() { return lookupLabel('dozenten', 'instrumente', "gitarre") ?? "Gitarre"; } }, { key: "schlagzeug", get label() { return lookupLabel('dozenten', 'instrumente', "schlagzeug") ?? "Schlagzeug"; } }, { key: "geige", get label() { return lookupLabel('dozenten', 'instrumente', "geige") ?? "Geige"; } }, { key: "cello", get label() { return lookupLabel('dozenten', 'instrumente', "cello") ?? "Cello"; } }, { key: "querfloete", get label() { return lookupLabel('dozenten', 'instrumente', "querfloete") ?? "Querflöte"; } }, { key: "klarinette", get label() { return lookupLabel('dozenten', 'instrumente', "klarinette") ?? "Klarinette"; } }, { key: "trompete", get label() { return lookupLabel('dozenten', 'instrumente', "trompete") ?? "Trompete"; } }, { key: "gesang", get label() { return lookupLabel('dozenten', 'instrumente', "gesang") ?? "Gesang"; } }, { key: "musiktheorie", get label() { return lookupLabel('dozenten', 'instrumente', "musiktheorie") ?? "Musiktheorie"; } }, { key: "sonstiges", get label() { return lookupLabel('dozenten', 'instrumente', "sonstiges") ?? "Sonstiges"; } }],
    beschaeftigungsart: [{ key: "festangestellt", get label() { return lookupLabel('dozenten', 'beschaeftigungsart', "festangestellt") ?? "Festangestellt"; } }, { key: "honorarbasis", get label() { return lookupLabel('dozenten', 'beschaeftigungsart', "honorarbasis") ?? "Honorarbasis"; } }, { key: "ehrenamtlich", get label() { return lookupLabel('dozenten', 'beschaeftigungsart', "ehrenamtlich") ?? "Ehrenamtlich"; } }],
  },
  'kurse_workshops': {
    kurstyp: [{ key: "kurs", get label() { return lookupLabel('kurse_workshops', 'kurstyp', "kurs") ?? "Kurs"; } }, { key: "workshop", get label() { return lookupLabel('kurse_workshops', 'kurstyp', "workshop") ?? "Workshop"; } }, { key: "einzelunterricht", get label() { return lookupLabel('kurse_workshops', 'kurstyp', "einzelunterricht") ?? "Einzelunterricht"; } }],
    niveau: [{ key: "anfaenger", get label() { return lookupLabel('kurse_workshops', 'niveau', "anfaenger") ?? "Anfänger"; } }, { key: "fortgeschrittene", get label() { return lookupLabel('kurse_workshops', 'niveau', "fortgeschrittene") ?? "Fortgeschrittene"; } }, { key: "experten", get label() { return lookupLabel('kurse_workshops', 'niveau', "experten") ?? "Experten"; } }, { key: "alle_niveaus", get label() { return lookupLabel('kurse_workshops', 'niveau', "alle_niveaus") ?? "Alle Niveaus"; } }],
    wochentag: [{ key: "montag", get label() { return lookupLabel('kurse_workshops', 'wochentag', "montag") ?? "Montag"; } }, { key: "dienstag", get label() { return lookupLabel('kurse_workshops', 'wochentag', "dienstag") ?? "Dienstag"; } }, { key: "mittwoch", get label() { return lookupLabel('kurse_workshops', 'wochentag', "mittwoch") ?? "Mittwoch"; } }, { key: "donnerstag", get label() { return lookupLabel('kurse_workshops', 'wochentag', "donnerstag") ?? "Donnerstag"; } }, { key: "freitag", get label() { return lookupLabel('kurse_workshops', 'wochentag', "freitag") ?? "Freitag"; } }, { key: "samstag", get label() { return lookupLabel('kurse_workshops', 'wochentag', "samstag") ?? "Samstag"; } }, { key: "sonntag", get label() { return lookupLabel('kurse_workshops', 'wochentag', "sonntag") ?? "Sonntag"; } }],
    status_kurs: [{ key: "geplant", get label() { return lookupLabel('kurse_workshops', 'status_kurs', "geplant") ?? "Geplant"; } }, { key: "aktiv", get label() { return lookupLabel('kurse_workshops', 'status_kurs', "aktiv") ?? "Aktiv"; } }, { key: "abgeschlossen", get label() { return lookupLabel('kurse_workshops', 'status_kurs', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "abgesagt", get label() { return lookupLabel('kurse_workshops', 'status_kurs', "abgesagt") ?? "Abgesagt"; } }],
  },
  'anmeldungen': {
    status_anmeldung: [{ key: "angemeldet", get label() { return lookupLabel('anmeldungen', 'status_anmeldung', "angemeldet") ?? "Angemeldet"; } }, { key: "warteliste", get label() { return lookupLabel('anmeldungen', 'status_anmeldung', "warteliste") ?? "Warteliste"; } }, { key: "storniert", get label() { return lookupLabel('anmeldungen', 'status_anmeldung', "storniert") ?? "Storniert"; } }, { key: "abgeschlossen", get label() { return lookupLabel('anmeldungen', 'status_anmeldung', "abgeschlossen") ?? "Abgeschlossen"; } }],
  },
  'zahlungen': {
    zahlungsart: [{ key: "ueberweisung", get label() { return lookupLabel('zahlungen', 'zahlungsart', "ueberweisung") ?? "Überweisung"; } }, { key: "barzahlung", get label() { return lookupLabel('zahlungen', 'zahlungsart', "barzahlung") ?? "Barzahlung"; } }, { key: "lastschrift", get label() { return lookupLabel('zahlungen', 'zahlungsart', "lastschrift") ?? "Lastschrift"; } }, { key: "paypal", get label() { return lookupLabel('zahlungen', 'zahlungsart', "paypal") ?? "PayPal"; } }, { key: "kreditkarte", get label() { return lookupLabel('zahlungen', 'zahlungsart', "kreditkarte") ?? "Kreditkarte"; } }],
    zahlungsstatus: [{ key: "ausstehend", get label() { return lookupLabel('zahlungen', 'zahlungsstatus', "ausstehend") ?? "Ausstehend"; } }, { key: "bezahlt", get label() { return lookupLabel('zahlungen', 'zahlungsstatus', "bezahlt") ?? "Bezahlt"; } }, { key: "teilbezahlt", get label() { return lookupLabel('zahlungen', 'zahlungsstatus', "teilbezahlt") ?? "Teilbezahlt"; } }, { key: "erstattet", get label() { return lookupLabel('zahlungen', 'zahlungsstatus', "erstattet") ?? "Erstattet"; } }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'raeume': {
    'raumname': 'string/text',
    'kapazitaet': 'number',
    'etage': 'string/text',
    'ausstattung': 'multiplelookup/checkbox',
    'verfuegbarkeit': 'lookup/select',
    'bemerkungen_raum': 'string/textarea',
  },
  'dozenten': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'instrumente': 'multiplelookup/checkbox',
    'qualifikationen': 'string/textarea',
    'beschaeftigungsart': 'lookup/radio',
    'foto': 'file',
  },
  'kurse_workshops': {
    'titel': 'string/text',
    'kurstyp': 'lookup/radio',
    'beschreibung': 'string/textarea',
    'niveau': 'lookup/select',
    'startdatum': 'date/datetimeminute',
    'enddatum': 'date/datetimeminute',
    'wochentag': 'multiplelookup/checkbox',
    'uhrzeit_beginn': 'string/text',
    'uhrzeit_ende': 'string/text',
    'raum': 'applookup/select',
    'dozent': 'applookup/select',
    'max_teilnehmer': 'number',
    'preis': 'number',
    'status_kurs': 'lookup/select',
  },
  'teilnehmer': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'email': 'string/email',
    'telefon': 'string/tel',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'postleitzahl': 'string/text',
    'ort': 'string/text',
    'notfall_name': 'string/text',
    'notfall_telefon': 'string/tel',
    'bemerkungen_tn': 'string/textarea',
  },
  'anmeldungen': {
    'teilnehmer': 'applookup/select',
    'kurs': 'applookup/select',
    'anmeldedatum': 'date/date',
    'status_anmeldung': 'lookup/select',
    'bemerkungen_anmeldung': 'string/textarea',
  },
  'zahlungen': {
    'anmeldung': 'applookup/select',
    'betrag': 'number',
    'zahlungsdatum': 'date/date',
    'zahlungsart': 'lookup/select',
    'zahlungsstatus': 'lookup/radio',
    'rechnungsnummer': 'string/text',
    'bemerkungen_zahlung': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

// Aliases for the pre-0.0.279 app keys (see 4c).
LOOKUP_OPTIONS['kurse_&_workshops'] = LOOKUP_OPTIONS['kurse_workshops'];
FIELD_TYPES['kurse_&_workshops'] = FIELD_TYPES['kurse_workshops'];

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateRaeume = StripLookup<Raeume['fields']>;
export type CreateDozenten = StripLookup<Dozenten['fields']>;
export type CreateKurseWorkshops = StripLookup<KurseWorkshops['fields']>;
export type CreateTeilnehmer = StripLookup<Teilnehmer['fields']>;
export type CreateAnmeldungen = StripLookup<Anmeldungen['fields']>;
export type CreateZahlungen = StripLookup<Zahlungen['fields']>;