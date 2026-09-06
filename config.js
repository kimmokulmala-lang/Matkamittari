/**
 * MATKAMITTARI - Keskitetyt selainpuolen asetukset
 *
 * KAIKKI neljä sivua (index.html, ranking.html, monthly.html, manual.html)
 * lataavat tämän tiedoston ennen omaa koodiaan. Kun vaihdat esim.
 * APPS_SCRIPT_URL-arvon, sinun tarvitsee muokata VAIN tätä yhtä tiedostoa
 * -- muutos vaikuttaa automaattisesti kaikkiin sivuihin.
 */

// Google Apps Script -verkkosovelluksen osoite (sama backend palvelee
// kaikkia sivuja). Katso ohje.md, miten tämä osoite saadaan.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxS7oLLyOD0c3UUs_HWIDsOIo3KsGS6Jg5IUlocaRGdsW_dzeQBK-I4mRTVGJZH6frWA/exec";

// Kuinka usein ranking.html ja monthly.html hakevat tuoreet tulokset
// automaattisesti (millisekunteina). 60000 = 60 sekuntia.
const REFRESH_INTERVAL_MS = 60000;
