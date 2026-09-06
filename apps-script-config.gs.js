/**
 * MATKAMITTARI - Keskitetyt Apps Script -asetukset (Config.gs)
 *
 * Tämä tiedosto sisältää KAIKKI muokattavat vakiot. Code.gs (pääkoodi)
 * käyttää näitä muuttujia -- et koskaan muokkaa Code.gs-tiedostoa itse
 * asetuksia vaihtaessasi, vain tätä tiedostoa.
 *
 * Google Apps Script -projektissa kaikki .gs-tiedostot jakavat saman
 * globaalin muuttujaympäristön, joten Code.gs "näkee" nämä vakiot
 * automaattisesti ilman erillistä importtia.
 *
 * HUOM: Muutosten jälkeen tee aina "Hallinnoi käyttöönottoja" > kynäkuvake
 * > "Versio: Uusi versio" > Ota käyttöön, jotta muutokset tulevat voimaan
 * julkaistussa osoitteessa. Pelkkä Tallenna ei riitä.
 */

// Aikavyöhyke, jonka mukaan kouluajat tulkitaan.
const SCHOOL_TIMEZONE = "Europe/Helsinki";

// Kouluaika alkaa ja päättyy (24h-muodossa). Esim. 8-16 = klo 8:00-15:59.
const SCHOOL_START_HOUR = 8;
const SCHOOL_END_HOUR = 16;

// Sallitut viikonpäivät: 1=maanantai, 2=tiistai, ... 7=sunnuntai.
const SCHOOL_WEEKDAYS = [1, 2, 3, 4, 5]; // ma-pe

// Opettajan tunnuskoodi käsinsyöttölomaketta (manual.html) varten.
// VAIHDA TÄMÄ omaksi salasanaksesi.
const TEACHER_PASSCODE = "vaihda-tama-salasana";

// ---------- NOPEUSVAROITUS ----------
// Jos mittauksen KESKINOPEUS ylittää tämän rajan, tulos merkitään
// taulukkoon "Nopeusvaroitus = KYLLÄ" -lipulla (esim. mopolla ajo,
// bussissa istuminen). TÄMÄ EI vaikuta rankingiin eikä hylkää tulosta
// automaattisesti -- se on vain lippu, jonka opettaja voi tarkistaa
// taulukosta. Oletus 25 km/h kattaa nopeatkin juoksijat mutta erottaa
// selvästi ajoneuvolla liikkumisen.
const MAX_PLAUSIBLE_SPEED_KMH = 25;

// Nopeustarkistus tehdään vain, jos mittaus kesti vähintään tämän monta
// minuuttia. Näin lyhyet, GPS-kohinan vääristämät testimittaukset eivät
// laukaise turhia varoituksia.
const MIN_DURATION_FOR_SPEED_CHECK_MIN = 2;
