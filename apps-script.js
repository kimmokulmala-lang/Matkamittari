/**
 * MATKAMITTARI - Google Apps Script backend (Code.gs)
 *
 * Tämä tiedosto hoitaa kolme asiaa:
 * 1. doPost (puhelin) -- ottaa vastaan GPS-mittaustuloksen ja tarkistaa
 *               PALVELIMEN OMASTA kellosta (ei oppilaan puhelimesta!),
 *               onko tulos tehty kouluaikana.
 * 2. doPost (käsin)   -- ottaa vastaan opettajan käsin syöttämän tuloksen
 *               manual.html-sivulta, suojattuna tunnuskoodilla.
 * 3. doGet   -- laskee päivä-, viikko-, kuukausi- ja kokonaisrankingit
 *               luokittain ja palauttaa ne JSON-muodossa ranking.html:lle
 *               ja monthly.html:lle.
 *
 * Kaikki muokattavat asetukset (kouluajat, salasana) ovat ERILLISESSÄ
 * Config.gs-tiedostossa -- älä lisää vakioita tänne, lisää ne sinne.
 *
 * KÄYTTÖÖNOTTO-OHJE:
 * 1. Mene osoitteeseen sheets.google.com ja luo uusi tyhjä taulukko.
 *    Nimeä se esim. "Matkamittari - tulokset".
 * 2. Lisää taulukon ensimmäiselle riville otsikot (soluihin A1:G1):
 *    Aikaleima | Luokka | Nimimerkki | Matka (km) | Kelvollinen | Huomautus | Lähde
 * 3. Valikosta: Laajennukset > Apps Script.
 * 4. Poista oletuskoodi olemassa olevasta tiedostosta (yleensä "Code.gs")
 *    ja liitä tilalle TÄMÄ koko tiedosto.
 * 5. Lisää UUSI tiedosto projektiin: vasemmasta reunasta "+" -painike ->
 *    "Skripti" -> nimeä se "Config" (tiedostoksi tulee Config.gs) ->
 *    liitä sinne apps-script-config.gs.js-tiedoston koko sisältö.
 * 6. Muokkaa Config.gs:n arvoja omiin kouluaikoihisi ja salasanaan sopiviksi.
 * 7. Paina Tallenna (levykuvake).
 * 8. Paina "Ota käyttöön" (Deploy) > "Uusi käyttöönotto" (New deployment).
 *    - Valitse tyypiksi "Verkkosovellus" (Web app)
 *    - "Suorita nimellä": Minä (oma tilisi)
 *    - "Kenellä on pääsy": Kaikki (Anyone) -- tämä on tärkeää,
 *      jotta oppilaiden puhelimet voivat lähettää tietoja
 * 9. Paina "Ota käyttöön". Google pyytää lupia -- hyväksy ne.
 * 10. Kopioi saamasi "Verkkosovelluksen URL-osoite" (Web app URL).
 * 11. Liitä TÄMÄ osoite selainpuolen config.js-tiedostoon (yksi ainoa
 *     paikka -- kaikki neljä sivua käyttävät sitä automaattisesti).
 *
 * HUOM: Jos muokkaat Config.gs:ää myöhemmin (esim. vaihdat kouluaikoja tai
 * salasanan), sinun täytyy tehdä "Hallinnoi käyttöönottoja" > kynäkuvake >
 * "Versio: Uusi versio" > Ota käyttöön, jotta muutokset tulevat voimaan
 * julkaistussa osoitteessa. Pelkkä Tallenna ei riitä.
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    const isManual = data.type === 'manual';

    let entryTime;
    let source;

    if (isManual) {
      // Käsinsyöttö vaatii oikean opettajan tunnuskoodin (Config.gs:stä).
      // Ilman sitä rivi hylätään kokonaan -- näin lomaketta ei voi käyttää
      // GPS-tarkistuksen ohittamiseen ilman salasanaa.
      if (data.password !== TEACHER_PASSCODE) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Väärä opettajan tunnuskoodi.'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      source = 'Käsin (opettaja)';

      // Opettaja voi antaa tarkan ajankohdan (jos tulos mitattiin esim.
      // aiemmin päivällä sekuntikellolla). Jos ajankohtaa ei anneta tai se
      // on virheellinen, käytetään palvelimen nykyhetkeä.
      entryTime = data.aikaleima ? new Date(data.aikaleima) : new Date();
      if (isNaN(entryTime.getTime())) {
        entryTime = new Date();
      }
    } else {
      source = 'Puhelin (GPS)';

      // Palvelimen oma aika sillä hetkellä, kun pyyntö saapuu Googlen
      // palvelimelle. Tätä EI voi huijata muuttamalla puhelimen kelloa,
      // koska emme luota mihinkään asiakkaan lähettämään aikatietoon.
      entryTime = new Date();
    }

    const check = isWithinSchoolHours(entryTime);

    sheet.appendRow([
      entryTime,
      data.luokka || '',
      data.nimimerkki || '',
      data.matka_km || '',
      check.valid ? 'KYLLÄ' : 'EI',
      check.reason,
      source
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

// GET-pyyntö palauttaa tämän päivän, tämän viikon, tämän kuukauden ja
// kaikkien aikojen rankingit luokittain. Vain "Kelvollinen = KYLLÄ" -rivit
// lasketaan mukaan, eli kouluajan ulkopuolella tehdyt mittaukset eivät
// vaikuta rankingiin (mutta jäävät silti taulukkoon näkyviin
// läpinäkyvyyden vuoksi).
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const values = sheet.getDataRange().getValues();
    const rows = values.slice(1); // ohitetaan otsikkorivi

    const now = new Date();
    const todayStr = Utilities.formatDate(now, SCHOOL_TIMEZONE, 'yyyy-MM-dd');
    const weekStart = getMondayStartOfWeek(now);
    const currentMonthStr = Utilities.formatDate(now, SCHOOL_TIMEZONE, 'yyyy-MM');

    const dailyTotals = {};
    const weeklyTotals = {};
    const monthlyTotals = {};
    const allTimeTotals = {};

    rows.forEach(function (row) {
      const aikaleima = row[0];
      const luokka = row[1];
      const matka = row[3];
      const kelvollinen = row[4];

      if (!luokka || kelvollinen !== 'KYLLÄ') return;
      if (!(aikaleima instanceof Date)) return;

      const km = parseFloat(matka) || 0;
      const rowDateStr = Utilities.formatDate(aikaleima, SCHOOL_TIMEZONE, 'yyyy-MM-dd');
      const rowMonthStr = Utilities.formatDate(aikaleima, SCHOOL_TIMEZONE, 'yyyy-MM');

      if (rowDateStr === todayStr) {
        dailyTotals[luokka] = (dailyTotals[luokka] || 0) + km;
      }
      if (aikaleima.getTime() >= weekStart.getTime()) {
        weeklyTotals[luokka] = (weeklyTotals[luokka] || 0) + km;
      }
      if (rowMonthStr === currentMonthStr) {
        monthlyTotals[luokka] = (monthlyTotals[luokka] || 0) + km;
      }
      allTimeTotals[luokka] = (allTimeTotals[luokka] || 0) + km;
    });

    const result = {
      status: 'ok',
      updated: now.toISOString(),
      currentMonth: currentMonthStr,
      schoolHours: {
        start: SCHOOL_START_HOUR,
        end: SCHOOL_END_HOUR,
        weekdays: SCHOOL_WEEKDAYS
      },
      daily: toSortedArray(dailyTotals),
      weekly: toSortedArray(weeklyTotals),
      monthly: toSortedArray(monthlyTotals),
      allTime: toSortedArray(allTimeTotals)
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
// Käyttää Config.gs:n vakioita SCHOOL_TIMEZONE, SCHOOL_START_HOUR jne.
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
