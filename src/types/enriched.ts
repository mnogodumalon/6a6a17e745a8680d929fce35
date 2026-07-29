import type { Anmeldungen, KurseWorkshops, Zahlungen } from './app';

export type EnrichedKurseWorkshops = KurseWorkshops & {
  raumName: string;
  dozentName: string;
};

export type EnrichedAnmeldungen = Anmeldungen & {
  teilnehmerName: string;
  kursName: string;
};

export type EnrichedZahlungen = Zahlungen & {
  anmeldungName: string;
};
