/**
 * MATKAMITTARI - Google Apps Script backend
 *
 * KÄYTTÖÖNOTTO-OHJE:
 * 1. Mene osoitteeseen sheets.google.com ja luo uusi tyhjä taulukko.
 *    Nimeä se esim. "Matkamittari - tulokset".
 * 2. Lisää taulukon ensimmäiselle riville otsikot (soluihin A1:D1):
 *    Aikaleima | Luokka | Nimimerkki | Matka (km)
 * 3. Valikosta: Laajennukset > Apps Script.
 * 4. Poista oletuskoodi ja liitä tilalle TÄMÄ koko tiedosto.
 * 5. Paina Tallenna (levykuvake).
 * 6. Paina "Ota käyttöön" (Deploy) > "Uusi käyttöönotto" (New deployment).
 *    - Valitse tyypiksi "Verkkosovellus" (Web app)
 *    - "Suorita nimellä": Minä (oma tilisi)
 *    - "Kenellä on pääsy": Kaikki (Anyone) -- tämä on tärkeää,
 *      jotta oppilaiden puhelimet voivat lähettää tietoja
 * 7. Paina "Ota käyttöön". Google pyytää lupia -- hyväksy ne.
 * 8. Kopioi saamasi "Verkkosovelluksen URL-osoite" (Web app URL).
 * 9. Liitä tämä osoite index.html-tiedoston kohtaan APPS_SCRIPT_URL.
 *
 * HUOM: Jos muokkaat tätä koodia myöhemmin, sinun täytyy tehdä
 * "Hallinnoi käyttöönottoja" > muokkaa > uusi versio, jotta muutokset
 * tulevat voimaan julkaistussa osoitteessa.
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      data.luokka || '',
      data.nimimerkki || '',
      data.matka_km || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
