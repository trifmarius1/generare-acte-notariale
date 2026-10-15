import type { Localized } from '@/domain/types';

/**
 * Electronic manuals for the codes a notary meets most often.
 * The full articles stay on the official pages. A copy saved here would go stale.
 * Facts below were read on 15 October 2026 from the two URLs of each card.
 * The consolidation is informative. The citable text is Monitorul Oficial.
 */
export interface CodeManual {
  id: string;
  title: Localized;
  citation: string;
  summary: Localized;
  body: string;
  portalUrl: string;
  secondUrl: string;
  secondLabel: Localized;
}

export const codesCheckedOn = '15 octombrie 2026';

export const codeManuals: CodeManual[] = [
  {
    id: 'cpc',
    title: {
      ro: 'Codul de procedură civilă',
      en: 'Code of Civil Procedure',
      hu: 'Polgári perrendtartás',
    },
    citation: 'Legea nr. 134/2010, republicată în M.Of. nr. 247 din 10 aprilie 2015',
    summary: {
      ro: 'Codul în vigoare. Republicarea din 2015 este completată în pagină, inclusiv cu Legea nr. 216/2025.',
      en: 'The code in force. The 2015 republication is updated on the page, including by Law 216/2025.',
      hu: 'A hatályos törvénykönyv. A 2015-ös újra közzététel a lapon ki van egészítve, a 216/2025. törvénnyel is.',
    },
    body: 'Pagina este forma consolidată de după republicare. Republicarea s-a făcut în temeiul art. XIV din Legea nr. 138/2014. La control, art. 150 alin. (2) este modificat prin Legea nr. 216/2025, publicată în Monitorul Oficial nr. 1151 din 11 decembrie 2025, cu efect din 14 decembrie 2025: copiile transmise electronic pot fi certificate de parte prin semnătură electronică. Fișa aceleiași legi, deschisă separat, repetă republicarea în Monitorul Oficial nr. 247 din 10 aprilie 2015. În pagină nu am găsit o modificare marcată cu o dată din 2026. Nu am recitit fiecare articol. Forma consolidată nu ține loc de Monitorul Oficial.',
    portalUrl: 'https://legislatie.just.ro/Public/DetaliiDocument/140271',
    secondUrl: 'https://legislatie.just.ro/Public/DetaliiDocumentAfis/305141',
    secondLabel: {
      ro: 'Legea nr. 216/2025, actul de modificare',
      en: 'Law 216/2025, the amending act',
      hu: 'A 216/2025. törvény, a módosító jogszabály',
    },
  },
  {
    id: 'cpp',
    title: {
      ro: 'Codul de procedură penală',
      en: 'Code of Criminal Procedure',
      hu: 'Büntetőeljárási törvény',
    },
    citation: 'Legea nr. 135/2010, publicată în M.Of. nr. 486 din 15 iulie 2010',
    summary: {
      ro: 'Codul în vigoare, ne-republicat în antet. Istoricul consolidării de pe pagină ajunge la 13 iunie 2026.',
      en: 'The code in force. The header does not show a republication. The page history reaches 13 June 2026.',
      hu: 'A hatályos törvénykönyv. A fejléc nem újra közzététel. A lap előzménye 2026. június 13-ig ér.',
    },
    body: 'Antetul nu marchează o republicare. Istoricul consolidărilor afișat pe pagină ajunge la 13 iunie 2026. În text, art. 438 alin. (1) pct. 8 este modificat prin Legea nr. 94/2026, publicată în Monitorul Oficial nr. 482 din 10 iunie 2026. Fișa acestei legi confirmă că modifică Legea nr. 135/2010. În aceeași formă consolidată sunt înscrise și Legea nr. 75/2026, Monitorul Oficial nr. 431 din 21 mai 2026, și Legea nr. 53/2026, Monitorul Oficial nr. 323 din 23 aprilie 2026. Nu am recitit fiecare articol. În fața unei autorități se citează Monitorul Oficial.',
    portalUrl: 'https://legislatie.just.ro/Public/DetaliiDocument/120611',
    secondUrl: 'https://legislatie.just.ro/Public/DetaliiDocumentAfis/311297',
    secondLabel: {
      ro: 'Legea nr. 94/2026, actul de modificare',
      en: 'Law 94/2026, the amending act',
      hu: 'A 94/2026. törvény, a módosító jogszabály',
    },
  },
  {
    id: 'civil',
    title: {
      ro: 'Codul civil',
      en: 'Civil Code',
      hu: 'Polgári törvénykönyv',
    },
    citation: 'Legea nr. 287/2009, republicată în M.Of. nr. 505 din 15 iulie 2011',
    summary: {
      ro: 'Codul în vigoare din 1 octombrie 2011. Nu este Codul civil din 1864.',
      en: 'The code in force since 1 October 2011. It is not the Civil Code of 1864.',
      hu: 'A törvénykönyv 2011. október 1-jétől hatályos. Nem az 1864-es polgári törvénykönyv.',
    },
    body: 'Republicat în temeiul art. 218 din Legea nr. 71/2011. Pe pagină scrie că intră în vigoare la 1 octombrie 2011, potrivit art. 220 alin. (1) din Legea nr. 71/2011. Nu este Codul civil din 1864. Ultima modificare marcată în text cu o dată din 2026 este Legea nr. 57/2026, Monitorul Oficial nr. 364 din 30 aprilie 2026, asupra art. 375, cu efect din 3 mai 2026. Fișa legii, deschisă separat, confirmă și republicarea în Monitorul Oficial nr. 505 din 15 iulie 2011. Nu am recitit fiecare articol. Forma consolidată nu ține loc de Monitorul Oficial.',
    portalUrl: 'https://legislatie.just.ro/Public/DetaliiDocument/109884',
    secondUrl: 'https://legislatie.just.ro/Public/DetaliiDocumentAfis/310182',
    secondLabel: {
      ro: 'Legea nr. 57/2026, actul de modificare',
      en: 'Law 57/2026, the amending act',
      hu: 'Az 57/2026. törvény, a módosító jogszabály',
    },
  },
  {
    id: 'penal',
    title: {
      ro: 'Codul penal',
      en: 'Criminal Code',
      hu: 'Büntető törvénykönyv',
    },
    citation: 'Legea nr. 286/2009, publicată în M.Of. nr. 510 din 24 iulie 2009',
    summary: {
      ro: 'Codul în vigoare. Istoricul paginii arată consolidarea din 23 iulie 2026. Nu este Codul penal din 1969.',
      en: 'The code in force. The page history shows the 23 July 2026 consolidation. It is not the 1969 Criminal Code.',
      hu: 'A hatályos törvénykönyv. A lap előzménye a 2026. július 23-i egységes szerkezet. Nem az 1969-es büntető törvénykönyv.',
    },
    body: 'Deschideți forma al cărei istoric de consolidare ajunge la 23 iulie 2026. Nu folosiți forma etichetată „COD PENAL (A) 01/04/2018”: în ea nu apar modificările din 2025 și din 2026. În textul actual, art. 117 alin. (1) este modificat la 23 iulie 2026 prin Legea nr. 158 din 20 iulie 2026. Legea nr. 116/2025, deschisă separat, confirmă publicarea codului în Monitorul Oficial nr. 510 din 24 iulie 2009 și că legea se modifică în continuare; nu este ultima modificare. Potrivit art. 246 din Legea nr. 187/2012, codul intră în vigoare la 1 februarie 2014. Nu este Codul penal din 1969. Nu am recitit fiecare articol. În fața unei autorități se citează Monitorul Oficial.',
    portalUrl: 'https://legislatie.just.ro/Public/DetaliiDocument/109855',
    secondUrl: 'https://legislatie.just.ro/Public/DetaliiDocumentAfis/299228',
    secondLabel: {
      ro: 'Legea nr. 116/2025, confirmă publicarea',
      en: 'Law 116/2025, confirms the publication',
      hu: 'A 116/2025. törvény, megerősíti a közzétételt',
    },
  },
  {
    id: 'fiscal',
    title: {
      ro: 'Codul fiscal',
      en: 'Fiscal Code',
      hu: 'Adótörvény',
    },
    citation: 'Legea nr. 227/2015, publicată în M.Of. nr. 688 din 10 septembrie 2015',
    summary: {
      ro: 'Codul în vigoare. Portalul și ANAF se întâlnesc la Legea nr. 170/2026. Nu este Legea nr. 571/2003.',
      en: 'The code in force. The portal and ANAF meet on Law 170/2026. It is not Law 571/2003.',
      hu: 'A hatályos törvénykönyv. A portál és az ANAF a 170/2026. törvénynél találkozik. Nem az 571/2003. törvény.',
    },
    body: 'Pagina de portal pornește de la titlu și de la art. 1. Istoricul consolidărilor ajunge la 8 august 2026. Art. 294 este completat, cu efect din 8 august 2026, prin art. II al Legii nr. 170 din 5 august 2026, Monitorul Oficial nr. 648 din 5 august 2026. Pagina ANAF scrie „ultima actualizare: Legea nr. 170/2026” și că textul este actualizat prin mijloace informatice și nu reprezintă o republicare. Tot acolo, art. 501 indică intrarea în vigoare la 1 ianuarie 2016, iar art. 502 abrogă Legea nr. 571/2003. Nu folosiți forma de portal marcată „actualizată la 1 ianuarie 2016”. Nu am recitit fiecare articol.',
    portalUrl: 'https://legislatie.just.ro/Public/DetaliiDocument/192984',
    secondUrl: 'https://static.anaf.ro/static/10/Anaf/legislatie/Cod_fiscal_norme_2023.htm',
    secondLabel: {
      ro: 'ANAF, Codul fiscal actualizat informatic',
      en: 'ANAF, the informatically updated Fiscal Code',
      hu: 'ANAF, informatikai eszközzel frissített adótörvény',
    },
  },
  {
    id: 'proc-fiscal',
    title: {
      ro: 'Codul de procedură fiscală',
      en: 'Code of Fiscal Procedure',
      hu: 'Adóeljárási törvény',
    },
    citation: 'Legea nr. 207/2015, publicată în M.Of. nr. 547 din 23 iulie 2015',
    summary: {
      ro: 'Codul în vigoare. Nu este Ordonanța Guvernului nr. 92/2003. Portalul și ANAF nu numesc la fel ultima modificare.',
      en: 'The code in force. It is not Government Ordinance 92/2003. The portal and ANAF do not name the same last amendment.',
      hu: 'A hatályos törvénykönyv. Nem a 92/2003. kormányrendelet. A portál és az ANAF nem ugyanazt az utolsó módosítást nevezi meg.',
    },
    body: 'Pagina trimite către acest cod trimiterile făcute la Ordonanța Guvernului nr. 92/2003. Nu folosiți forma de portal actualizată doar până la 6 decembrie 2016. Istoricul consolidărilor arată 8 august 2026. Ultima modificare citită în text, marcată cu dată, este completarea Titlului IV prin Ordonanța nr. 6 din 30 ianuarie 2026, Monitorul Oficial nr. 77 din 30 ianuarie 2026, cu efect din 2 februarie 2026. Pagina ANAF scrie „ultima actualizare: Legea nr. 170/2026” și că textul informatic nu este o republicare. Șirul „170/2026” nu apare în pagina de portal deschisă la control. Cele două pagini oficiale nu spun același lucru despre ultima modificare: se deschid amândouă în ziua actului. Nu am recitit fiecare articol.',
    portalUrl: 'https://legislatie.just.ro/Public/DetaliiDocument/306111',
    secondUrl: 'https://static.anaf.ro/static/10/Anaf/cod_procedura/Cod_Procedura_Fiscala_2023.htm',
    secondLabel: {
      ro: 'ANAF, procedura fiscală actualizată informatic',
      en: 'ANAF, the informatically updated fiscal procedure',
      hu: 'ANAF, informatikai eszközzel frissített adóeljárás',
    },
  },
  {
    id: 'munca',
    title: {
      ro: 'Codul muncii',
      en: 'Labour Code',
      hu: 'Munka törvénykönyve',
    },
    citation: 'Legea nr. 53/2003, republicată în M.Of. nr. 345 din 18 mai 2011',
    summary: {
      ro: 'Codul în vigoare, republicat. Istoricul portalului se oprește la 27 aprilie 2026. Nu este Legea nr. 10/1972.',
      en: 'The republished code in force. The portal history stops at 27 April 2026. It is not Law 10/1972.',
      hu: 'A hatályos, újra közzétett törvénykönyv. A portál előzménye 2026. április 27-én áll meg. Nem a 10/1972. törvény.',
    },
    body: 'Art. 1, pe pagina de portal, reglementează domeniul raporturilor de muncă. La intrarea în vigoare, 1 martie 2003, se abrogă Codul muncii al R.S.R., Legea nr. 10/1972. Nu folosiți forma de portal actualizată doar până la 16 noiembrie 2009. Istoricul consolidărilor se oprește la 27 aprilie 2026. În text am citit Legea nr. 149/2025, Monitorul Oficial nr. 936 din 9 octombrie 2025, și Legea nr. 283/2024, Monitorul Oficial nr. 1139 din 14 noiembrie 2024. Ministerul Muncii găzduiește un PDF făcut cu programul LEX Expert, prezentat ca text în vigoare de la 27 aprilie 2026. PDF-ul nu este Monitorul Oficial. Salariul minim nu este copiat aici: se citește din hotărârea Guvernului în vigoare în ziua actului. Nu am recitit fiecare articol.',
    portalUrl: 'https://legislatie.just.ro/Public/DetaliiDocumentAfis/303235',
    secondUrl: 'https://mmuncii.gov.ro/wp-content/uploads/2026/05/Legea-nr.-53-din-2003-Codul-Muncii-republicat.pdf',
    secondLabel: {
      ro: 'Ministerul Muncii, PDF până la 27 aprilie 2026',
      en: 'Ministry of Labour, PDF through 27 April 2026',
      hu: 'Munkaügyi Minisztérium, PDF 2026. április 27-ig',
    },
  },
  {
    id: 'administrativ',
    title: {
      ro: 'Codul administrativ',
      en: 'Administrative Code',
      hu: 'Közigazgatási kódex',
    },
    citation: 'OUG nr. 57/2019, publicată în M.Of. nr. 555 din 5 iulie 2019',
    summary: {
      ro: 'Codul în vigoare. Consolidarea de pe portal ajunge la 12 septembrie 2026.',
      en: 'The code in force. The portal consolidation reaches 12 September 2026.',
      hu: 'A hatályos törvénykönyv. A portál egységes szerkezete 2026. szeptember 12-ig ér.',
    },
    body: 'La data intrării în vigoare, art. 597 abrogă, între altele, Legea nr. 188/1999 privind Statutul funcționarilor publici și Legea nr. 340/2004 privind prefectul. Istoricul consolidărilor și textul ajung la 12 septembrie 2026: art. 550 alin. (2) este abrogat de Legea nr. 186 din 9 septembrie 2026, publicată în Monitorul Oficial nr. 767. Ordinul ministrului dezvoltării nr. 476/2026, deschis separat, aplică în continuare art. 289 din OUG nr. 57/2019. Nu am recitit fiecare articol. Forma consolidată nu ține loc de Monitorul Oficial.',
    portalUrl: 'https://legislatie.just.ro/Public/DetaliiDocument/314108',
    secondUrl: 'https://legislatie.just.ro/Public/DetaliiDocumentAfis/310436',
    secondLabel: {
      ro: 'Ordinul nr. 476/2026, care aplică codul',
      en: 'Order 476/2026, which applies the code',
      hu: 'A 476/2026. rendelet, amely a kódexet alkalmazza',
    },
  },
];

export const repealedManual = {
  id: 'abrogate',
  title: {
    ro: 'Forme care nu se folosesc',
    en: 'Texts that are not to be used',
    hu: 'Szövegek, amelyeket nem szabad használni',
  } satisfies Localized,
  body: 'Codul civil din 1864 nu este codul în vigoare. Codul penal din 1969 nu este codul în vigoare. Ordonanța Guvernului nr. 92/2003 nu este Codul de procedură fiscală în vigoare. Legea nr. 571/2003 nu este Codul fiscal în vigoare. Legea nr. 10/1972 nu este Codul muncii în vigoare. Pe portal mai există copii oprite la o dată veche: Codul penal etichetat 01/04/2018, Codul fiscal actualizat la 1 ianuarie 2016, Codul de procedură fiscală actualizat la 6 decembrie 2016 și Codul muncii actualizat la 16 noiembrie 2009. Nu le folosiți ca text de azi. În fața unei autorități se citează Monitorul Oficial.',
};
