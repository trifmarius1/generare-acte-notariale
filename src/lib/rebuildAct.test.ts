import { describe, expect, it } from 'vitest';
import { templateById } from '@/modules/templates';
import { restoreDiacritics } from './diacritics';
import { extractActValues } from './rebuildAct';

const SALE = `CONTRACT DE VANZARE
Astazi, 14.10.2026, in municipiul Cluj-Napoca.
Vanzator: POPESCU ION, CNP 1960101410018, CI seria KX nr. 123456, domiciliat in Cluj-Napoca, casatorit.
Cumparator: IONESCU MARIA, CNP 2970202410023, CI seria CJ nr. 654321, domiciliata in Floresti, necasatorita.
Imobilul apartament situat in municipiul Cluj-Napoca, judetul Cluj, inscris in cartea funciara nr. 123456, numar cadastral 123456, suprafata de 54 mp.
Pretul vanzarii este de 250000 lei.
Vanzatorul declara ca imobilul este bun propriu.
Pretul se achita integral la autentificare.
`;

describe('reconstrucția actului verificat', () => {
  it('pune diacriticele pe cuvintele notariale', () => {
    expect(restoreDiacritics('vanzatorul si cumparatorul, judetul, pretul')).toBe(
      'vânzătorul și cumpărătorul, județul, prețul',
    );
  });

  it('preia părțile, imobilul și prețul și lasă gol ce nu este scris', () => {
    const template = templateById('vanzare-imobil');
    expect(template).toBeTruthy();
    if (!template) return;
    const values = extractActValues(SALE, template);
    expect(values.vNume).toBe('POPESCU ION');
    expect(values.cNume).toBe('IONESCU MARIA');
    expect(values.vCnp).toBe('1960101410018');
    expect(values.cCnp).toBe('2970202410023');
    expect(values.vCiSerie).toBe('KX');
    expect(values.vCiNr).toBe('123456');
    expect(values.cCiSerie).toBe('CJ');
    expect(values.cCiNr).toBe('654321');
    expect(values.vStare).toBe('căsătorit');
    expect(values.cStare).toBe('necăsătorită');
    expect(values.cf).toBe('123456');
    expect(values.cadastral).toBe('123456');
    expect(values.judet).toBe('Cluj');
    expect(values.uat).toBe('Cluj-Napoca');
    expect(values.pret).toBe('250000');
    expect(values.dataAct).toBe('2026-10-14');
    expect(values.vRegim).toBe('propriu');
    expect(values.plata).toBe('integral');
    expect(values.imobil).toContain('județul');
    expect(values.dobandire).toBeUndefined();

    const draft = template.generate(values, {
      notaryName: '',
      chamber: '',
      address: '',
      license: '',
      circumscription: '',
      vatPayer: false,
    });
    expect(draft.plainText).toContain('PROIECT DE LUCRU — NU ESTE ÎNSCRIS AUTENTIC');
    expect(draft.plainText).toContain('Capitolul I');
    expect(draft.plainText).toContain('art. 1674');
    expect(draft.plainText).toContain('art. 111');
    expect(draft.plainText).toContain('POPESCU ION');
    expect(draft.plainText).toContain('C.I. seria KX nr. 123456');
    expect(draft.plainText).toContain('C.I. seria CJ nr. 654321');
    expect(draft.plainText).toContain('250.000,00 lei');
  });

  it('nu declară bunul propriu și plata integrală dacă textul nu le spune', () => {
    const template = templateById('vanzare-imobil');
    if (!template) return;
    const values = extractActValues('Vanzare. Vanzator: POPA ION, CNP 1960101410018. Cumparator: POPA ANA.', template);
    expect(values.vRegim).toBeUndefined();
    expect(values.plata).toBeUndefined();
    const draft = template.generate(values, {
      notaryName: '',
      chamber: '',
      address: '',
      license: '',
      circumscription: '',
      vatPayer: false,
    });
    expect(draft.plainText).toContain('nu rezultă din datele proiectului');
    expect(draft.plainText).toContain('nu presupune încasarea');
  });

  it('reface vânzarea cu doi soți de fiecare parte și cu ipotecă legală, fără să inventeze suma ștearsă', () => {
    const template = templateById('vanzare-imobil');
    if (!template) return;
    const source = `CONTRACT DE VÂNZARE-CUMPĂRARE cu constituire de ipotecă legală pentru diferența de preț. Data: 14 Octombrie 2026.
1. VÂNZĂTORI (COPROPRIETARI DEVĂLMAȘI): TRIF MARIUS-COSMIN, cetățean român, domiciliat în Mun. Cluj-Napoca, jud. Cluj, identificat cu C.I. seria [___] nr. [______], C.N.P. [____________], și TRIF COANA-ADELINA, cetățean român, domiciliată în Mun. Cluj-Napoca, jud. Cluj, identificată cu C.I. seria [___] nr. [______], C.N.P. [____________], soți, căsătoriți sub regimul comunității legale de bunuri.
2. CUMPĂRĂTORI (ACHIZITORI ÎN DEVĂLMĂȘIE): POP LIVIU, cetățean român, domiciliat în Mun. Cluj-Napoca, jud. Cluj, identificat cu C.I. seria [___] nr. [______], C.N.P. [____________], și POP FLORICA, cetățean român, domiciliată în Mun. Cluj-Napoca, jud. Cluj, identificată cu C.I. seria [___] nr. [______], C.N.P. [____________], soți, căsătoriți sub regimul comunității legale de bunuri.
ART. 1. OBIECTUL CONTRACTULUI Vânzătorii vând dreptul de proprietate deplină asupra imobilului situat în Municipiul Cluj-Napoca, Str. Aurel Vlaicu nr. 58, ap. 12, Județul Cluj, înscris în Cartea Funciară nr. [______] Cluj-Napoca, nr. cadastral [______]-C1-U12. Imobilul constă în apartament cu dependințe, împreună cu cota-parte indiviză din părțile comune.`;
    const values = extractActValues(source, template);
    expect(values.vNume).toBe('TRIF MARIUS-COSMIN și TRIF COANA-ADELINA');
    expect(values.cNume).toBe('POP LIVIU și POP FLORICA');
    expect(values.vCiSerie).toBeUndefined();
    expect(values.vCiNr).toBeUndefined();
    expect(values.cCiSerie).toBeUndefined();
    expect(values.cCiNr).toBeUndefined();
    const afterDomicile = extractActValues(
      'Vanzator: POPA ION, domiciliat in Cluj-Napoca, CI seria ZX nr. 112233, casatorit. Cumparator: POPA ANA, domiciliata in Floresti, C.I. seria MM nr. 445566.',
      template,
    );
    expect(afterDomicile.vCiSerie).toBe('ZX');
    expect(afterDomicile.vCiNr).toBe('112233');
    expect(afterDomicile.cCiSerie).toBe('MM');
    expect(afterDomicile.cCiNr).toBe('445566');
    expect(values.vRegim).toBe('comun');
    expect(values.plata).toBe('partial');
    expect(values.ipoteca).toBe('da');
    expect(values.cadastral).toBe('C1-U12');
    expect(values.cf).toBeUndefined();
    expect(values.pret).toBeUndefined();
    expect(values.dataAct).toBe('2026-10-14');
    expect(values.uat).toBe('Cluj-Napoca');
    expect(values.imobil).toContain('Aurel Vlaicu');
    expect(values.imobil).toContain('……');

    const draft = template.generate(values, {
      notaryName: '',
      chamber: '',
      address: '',
      license: '',
      circumscription: '',
      vatPayer: false,
    });
    expect(draft.plainText).toContain('Vânzătorii');
    expect(draft.plainText).toContain('TRIF COANA-ADELINA');
    expect(draft.plainText).toContain('POP FLORICA');
    expect(draft.plainText).toContain('art. 2386 pct. 1');
    expect(draft.plainText).toContain('art. 1244');
    expect(draft.plainText).toContain('nu a fost citită în cifre');
  });
});
