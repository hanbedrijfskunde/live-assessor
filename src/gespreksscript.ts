// Gespreksscript voor assessoren tijdens het PROMEF mondeling assessment.
//
// Dit is *inhoudelijke data* (geen UI): een opening, per criterium een toelichting +
// letterlijke startvraag + een vragenbank met doorvragen, plus een afsluiting en een
// timing-suggestie. `GespreksscriptModal` rendert dit en koppelt het aan `CRITERIA`
// (titel, beschrijving en de niveau-signalen uit `tagsByLevel`).
//
// De `criteriumId`-velden lopen 1..6 en moeten één-op-één matchen met `CRITERIA` in
// types.ts — dat wordt door een unittest bewaakt.

export interface CriteriumScript {
  /** Verwijst naar CRITERIA[].id (1..6). */
  criteriumId: number;
  /** Korte toelichting voor de assessor: wat toets je met dit criterium? */
  toelichting: string;
  /** Letterlijk voor te lezen openingsvraag voor dit criterium. */
  startvraag: string;
  /** Vragenbank: doorvragen om bewijs op niveau te ontlokken. Kies wat past. */
  doorvragen: string[];
}

export interface Gespreksscript {
  /** Voor te lezen/parafraseren bij de start van het gesprek. */
  opening: string[];
  /** Per-criterium scriptblokken (1..6). */
  criteria: CriteriumScript[];
  /** Voor te lezen/parafraseren bij de afronding van het gesprek. */
  afsluiting: string[];
  /** Suggestie voor de tijdsindeling binnen een slot. */
  timing: string;
}

export const GESPREKSSCRIPT: Gespreksscript = {
  opening: [
    "Welkom, fijn dat jullie er zijn. Dit is het PROMEF-assessment: een gesprek van ongeveer 30 minuten waarin we samen terugkijken op de bedrijfskundige simulatie.",
    "We beoordelen jullie op zes criteria. Ik nodig jullie per onderwerp uit om je aanpak, keuzes en onderbouwing toe te lichten — denk hardop, ook als je twijfelt.",
    "Er is geen één goed antwoord; we zijn vooral benieuwd naar je redenering en je rol in het team. Bij een duo krijgen jullie allebei evenveel ruimte.",
    "Het gesprek wordt opgenomen voor de beoordeling en wordt na afronding verwijderd; de opname is alleen voor de assessoren. Akkoord? Dan beginnen we.",
  ],
  criteria: [
    {
      criteriumId: 1,
      toelichting:
        "Toetst of de student een theoretisch concept uit de fasen 'veranderen' en/of 'evalueren' van de bedrijfskundige handelingscyclus correct uitlegt en op de case toepast.",
      startvraag:
        "Welk theoretisch concept uit de fase veranderen of evalueren hebben jullie in deze case ingezet, en waarom juist dat?",
      doorvragen: [
        "Kun je het model in je eigen woorden uitleggen — wat zijn de kernbegrippen?",
        "Waar in jullie aanpak zie ik dit concept concreet terug? Geef een voorbeeld.",
        "Welke aanname onder dit model klopte in deze case, en welke niet?",
        "Hoe heb je het effect van jullie interventie geëvalueerd — aan welke indicatoren?",
        "Welk alternatief model had ook gekund, en waarom heb je daar níét voor gekozen?",
      ],
    },
    {
      criteriumId: 2,
      toelichting:
        "Toetst gespreksvaardigheden van een beginnend professional: actief luisteren, structureren, doorvragen en een professionele houding — zichtbaar in het assessment zelf.",
      startvraag:
        "Neem me kort mee in hoe jullie de samenwerking en communicatie in dit traject hebben aangepakt.",
      doorvragen: [
        "Wat deed je concreet om de ander écht te begrijpen voordat je reageerde?",
        "Hoe zorgde je dat een rommelig overleg toch tot een besluit kwam?",
        "Geef een moment waarop je doorvroeg in plaats van zelf in te vullen — wat leverde dat op?",
        "Hoe ging je om met een meningsverschil binnen het team?",
        "Als ik je teamgenoot zou vragen hoe jij communiceert, wat zou die zeggen?",
      ],
    },
    {
      criteriumId: 3,
      toelichting:
        "Toetst het vermogen om weerstand bij belanghebbenden om te buigen naar veranderbereidheid en verbinding te leggen rond een gemeenschappelijk doel.",
      startvraag:
        "Welke weerstand kwamen jullie tegen bij een belanghebbende, en hoe zijn jullie daarmee omgegaan?",
      doorvragen: [
        "Wat zat er volgens jou écht achter die weerstand — welk belang of welke zorg?",
        "Welke concrete stap zette je om van 'tegen' naar 'bereid' te bewegen?",
        "Welk gemeenschappelijk doel heb je benoemd om partijen te verbinden?",
        "Wat deed je toen je eerste poging niet werkte?",
        "Hoe voorkwam je dat je in de verdediging schoot of bleef drammen?",
      ],
    },
    {
      criteriumId: 4,
      toelichting:
        "Toetst de professionele bijdrage aan het teamresultaat én aantoonbare groei als bedrijfskundig professional gedurende de simulatie (reflectie, feedback verwerken, eigen visie).",
      startvraag:
        "Wat was jouw belangrijkste bijdrage aan het teamresultaat, en waarin ben je in dit traject gegroeid?",
      doorvragen: [
        "Welke feedback heb je gekregen, en wat heb je er daadwerkelijk mee gedaan?",
        "Beschrijf een moment waarop je je aanpak hebt bijgesteld — wat was het inzicht?",
        "Wat zou je nu anders doen dan aan het begin van de simulatie?",
        "Waar liep je tegen je eigen grens aan, en hoe ging je daarmee om?",
        "Welke visie op het vak heb je in dit traject voor jezelf scherper gekregen?",
      ],
    },
    {
      criteriumId: 5,
      toelichting:
        "Toetst of de student een intercultureel issue uit de case herkent, analyseert en een passende, cultuursensitieve aanpak voorstelt.",
      startvraag:
        "Welk intercultureel aspect speelde in deze case, en hoe heeft dat jullie aanpak beïnvloed?",
      doorvragen: [
        "Welke cultuurverschillen waren in het spel — kun je dat met een model duiden?",
        "Hoe heb je voorkomen dat je vanuit je eigen referentiekader oordeelde?",
        "Welke concrete, cultuursensitieve aanpassing heb je in je aanpak gedaan?",
        "Hoe zorgde je dat alle perspectieven aan tafel ruimte kregen?",
        "Wat is het risico als je dit interculturele aspect zou negeren?",
      ],
    },
    {
      criteriumId: 6,
      toelichting:
        "Toetst of de student een morele kwestie uit de case analyseert en oplost in lijn met de gedragsregels van de OOA (integriteit onder druk, afweging onderbouwen).",
      startvraag:
        "Welk moreel dilemma kwamen jullie in deze case tegen, en hoe hebben jullie dat opgelost?",
      doorvragen: [
        "Welke waarden of belangen stonden hier tegenover elkaar?",
        "Hoe verhoudt jullie keuze zich tot de gedragsregels van de OOA?",
        "Wat maakte dit lastig — waar zat de druk om het anders te doen?",
        "Hoe heb je je afweging transparant gemaakt naar de betrokkenen?",
        "Stel dat niemand zou meekijken — had je dan dezelfde keuze gemaakt? Waarom?",
      ],
    },
  ],
  afsluiting: [
    "We ronden af. Is er iets wat je nog had willen laten zien of toelichten dat nog niet aan bod kwam?",
    "Bedankt voor je openheid en onderbouwing. Ik vat kort samen wat ik gehoord heb, zodat je weet waarop ik beoordeel.",
    "De definitieve beoordeling en het feedbackrapport ontvang je via de gebruikelijke weg. Succes met het vervolg, en bedankt voor het gesprek.",
  ],
  timing:
    "Indicatie voor een slot van 30 minuten: ±3 min opening, ±3,5 min per criterium (samen ±21 min), ±6 min afronding en samenvatting. Bewaak de tijd; ga bij ruimtegebrek door op de startvraag en kies gericht één doorvraag.",
};
