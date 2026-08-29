/**
 * MATKAMITTARI - Google Apps Script backend
 *
 * Tämä tiedosto hoitaa kaksi asiaa:
 * 1. doPost  -- ottaa vastaan mittaustuloksen ja tarkistaa PALVELIMEN OMASTA
 *               kellosta (ei oppilaan puhelimesta!), onko tulos tehty
 *               kouluaikana. Näin oppilas ei voi huijata muuttamalla
 *               puhelimensa kellonaikaa.
 * 2. doGet   -- laskee päivä- ja viikkorankingit luokittain ja palauttaa
 *               ne JSON-muodossa rankingsivulle (ranking.html).
 *
 * KÄYTTÖÖNOTTO-OHJE:
 * 1. Mene osoitteeseen sheets.google.com ja luo uusi tyhjä taulukko.
 *    Nimeä se esim. "Matkamittari - tulokset".
 * 2. Lisää taulukon ensimmäiselle riville otsikot (soluihin A1:F1):
 *    Aikaleima | Luokka | Nimimerkki | Matka (km) | Kelvollinen | Huomautus
 * 3. Valikosta: Laajennukset > Apps Script.
 * 4. Poista oletuskoodi ja liitä tilalle TÄMÄ koko tiedosto.
 * 5. Muokkaa alla olevia ASETUKSET-arvoja omiin kouluaikoihisi sopiviksi.
 * 6. Paina Tallenna (levykuvake).
 * 7. Paina "Ota käyttöön" (Deploy) > "Uusi käyttöönotto" (New deployment).
 *    - Valitse tyypiksi "Verkkosovellus" (Web app)
 *    - "Suorita nimellä": Minä (oma tilisi)
 *    - "Kenellä on pääsy": Kaikki (Anyone) -- tämä on tärkeää,
 *      jotta oppilaiden puhelimet voivat lähettää tietoja
 * 8. Paina "Ota käyttöön". Google pyytää lupia -- hyväksy ne.
 * 9. Kopioi saamasi "Verkkosovelluksen URL-osoite" (Web app URL).
 * 10. Liitä TÄMÄ SAMA osoite sekä index.html:n että ranking.html:n
 *     kohtaan APPS_SCRIPT_URL (sama backend palvelee molempia sivuja).
 *
 * HUOM: Jos muokkaat tätä koodia myöhemmin (esim. vaihdat kouluaikoja),
 * sinun täytyy tehdä "Hallinnoi käyttöönottoja" > kynäkuvake > "Versio: Uusi
 * versio" > Ota käyttöön, jotta muutokset tulevat voimaan julkaistussa
 * osoitteessa. Pelkkä Tallenna ei riitä.
 */

// ---------- ASETUKSET ----------
// Aikavyöhyke, jonka mukaan kouluajat tulkitaan.
const SCHOOL_TIMEZONE = "Europe/Helsinki";

// Kouluaika alkaa ja päättyy (24h-muodossa). Esim. 8-16 = klo 8:00-15:59.
const SCHOOL_START_HOUR = 8;
const SCHOOL_END_HOUR = 16;

// Sallitut viikonpäivät: 1=maanantai, 2=tiistai, ... 7=sunnuntai.
const SCHOOL_WEEKDAYS = [1, 2, 3, 4, 5]; // ma-pe
// --------------------------------

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // Palvelimen oma aika sillä hetkellä, kun pyyntö saapuu Googlen
    // palvelimelle. Tätä EI voi huijata muuttamalla puhelimen kelloa,
    // koska emme luota mihinkään asiakkaan lähettämään aikatietoon.
    const serverNow = new Date();
    const check = isWithinSchoolHours(serverNow);

    sheet.appendRow([
      serverNow,
      data.luokka || '',
      data.nimimerkki || '',
      data.matka_km || '',
      check.valid ? 'KYLLÄ' : 'EI',
      check.reason
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ok',
        valid: check.valid,
        reason: check.reason
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET-pyyntö palauttaa tämän päivän ja tämän viikon rankingit luokittain.
// Vain "Kelvollinen = KYLLÄ" -rivit lasketaan mukaan, eli kouluajan
// ulkopuolella tehdyt mittaukset eivät vaikuta rankingiin (mutta jäävät
// silti taulukkoon näkyviin läpinäkyvyyden vuoksi).
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const values = sheet.getDataRange().getValues();
    const rows = values.slice(1); // ohitetaan otsikkorivi

    const now = new Date();
    const todayStr = Utilities.formatDate(now, SCHOOL_TIMEZONE, 'yyyy-MM-dd');
    const weekStart = getMondayStartOfWeek(now);

    const dailyTotals = {};
    const weeklyTotals = {};

    rows.forEach(function (row) {
      const aikaleima = row[0];
      const luokka = row[1];
      const matka = row[3];
      const kelvollinen = row[4];

      if (!luokka || kelvollinen !== 'KYLLÄ') return;
      if (!(aikaleima instanceof Date)) return;

      const km = parseFloat(matka) || 0;
      const rowDateStr = Utilities.formatDate(aikaleima, SCHOOL_TIMEZONE, 'yyyy-MM-dd');

      if (rowDateStr === todayStr) {
        dailyTotals[luokka] = (dailyTotals[luokka] || 0) + km;
      }
      if (aikaleima.getTime() >= weekStart.getTime()) {
        weeklyTotals[luokka] = (weeklyTotals[luokka] || 0) + km;
      }
    });

    const result = {
      status: 'ok',
      updated: now.toISOString(),
      schoolHours: {
        start: SCHOOL_START_HOUR,
        end: SCHOOL_END_HOUR,
        weekdays: SCHOOL_WEEKDAYS
      },
      daily: toSortedArray(dailyTotals),
      weekly: toSortedArray(weeklyTotals)
    };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Tarkistaa onko annettu ajankohta sallitun kouluajan sisällä.
function isWithinSchoolHours(date) {
  const weekday = Number(Utilities.formatDate(date, SCHOOL_TIMEZONE, 'u')); // 1=ma ... 7=su
  const hour = Number(Utilities.formatDate(date, SCHOOL_TIMEZONE, 'H'));
  const minute = Number(Utilities.formatDate(date, SCHOOL_TIMEZONE, 'm'));
  const totalMinutes = hour * 60 + minute;
  const startMinutes = SCHOOL_START_HOUR * 60;
  const endMinutes = SCHOOL_END_HOUR * 60;

  if (SCHOOL_WEEKDAYS.indexOf(weekday) === -1) {
    return { valid: false, reason: 'Viikonloppu / vapaapäivä' };
  }
  if (totalMinutes < startMinutes || totalMinutes >= endMinutes) {
    return {
      valid: false,
      reason: 'Kouluajan (' + SCHOOL_START_HOUR + '-' + SCHOOL_END_HOUR + ') ulkopuolella'
    };
  }
  return { valid: true, reason: '' };
}

// Palauttaa tämän viikon maanantain klo 00:00 (koulun aikavyöhykkeessä).
function getMondayStartOfWeek(date) {
  const weekday = Number(Utilities.formatDate(date, SCHOOL_TIMEZONE, 'u')); // 1=ma
  const daysSinceMonday = weekday - 1;
  const roughMonday = new Date(date.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  const mondayDateStr = Utilities.formatDate(roughMonday, SCHOOL_TIMEZONE, 'yyyy-MM-dd');
  // Rakennetaan tarkka maanantai klo 00:00 merkkijonosta, jotta kellonaika
  // ei jää roikkumaan alkuperäisestä ajankohdasta.
  return new Date(mondayDateStr + 'T00:00:00');
}

// Muuntaa {luokka: km, ...} -olion suuruusjärjestykseen lajitelluksi listaksi.
function toSortedArray(totalsObject) {
  return Object.keys(totalsObject)
    .map(function (luokka) {
      return { luokka: luokka, km: Math.round(totalsObject[luokka] * 1000) / 1000 };
    })
    .sort(function (a, b) { return b.km - a.km; });
}
