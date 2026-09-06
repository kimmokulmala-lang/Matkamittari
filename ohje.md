# Matkamittari — käyttöönotto-ohje

Sovellus koostuu näistä osista:
1. **Mittaussovellus** (index.html, manifest.json, sw.js) — oppilaiden käyttämä GPS-mittari
2. **Ranking-sivu** (ranking.html) — näyttää päivä- ja viikkotason parhaat luokat
3. **Kuukausiranking** (monthly.html) — näyttää kuukausi- ja kokonaisrankingin
   omalla sivullaan, jotta ranking.html pysyy selkeänä
4. **Käsinsyöttösivu** (manual.html) — opettajalle, tuloksien lisäämiseen
   ilman puhelimen GPS:ää, suojattu tunnuskoodilla
5. **config.js** — KESKITETYT selainpuolen asetukset (mm. APPS_SCRIPT_URL),
   jota kaikki neljä yllä olevaa sivua lataavat
6. **Backend**: kaksi Apps Script -tiedostoa
   - **Code.gs** (apps-script.js) — varsinainen ohjelmalogiikka
   - **Config.gs** (apps-script-config.gs.js) — KESKITETYT backend-asetukset
     (kouluajat, opettajan salasana)

## Miksi asetukset on eriytetty omiin tiedostoihin?

Kun haluat muuttaa esim. APPS_SCRIPT_URL-osoitetta, kouluaikoja tai
salasanaa, sinun tarvitsee muokata VAIN yhtä tiedostoa (config.js tai
Config.gs) — muutos vaikuttaa automaattisesti kaikkiin sivuihin/toimintoihin,
etkä voi vahingossa unohtaa päivittää jotain yksittäistä sivua erikseen.

## Vaihe 1: Backend (Google Sheets + Apps Script)

1. Luo uusi Google Sheets -taulukko
2. Lisää ensimmäiselle riville otsikot soluihin A1:G1:
   `Aikaleima | Luokka | Nimimerkki | Matka (km) | Kelvollinen | Huomautus | Lähde`
3. Laajennukset → Apps Script
4. Oletuksena projektissa on yksi tiedosto ("Code.gs"). Poista sen sisältö
   ja liitä tilalle koko `apps-script.js`:n sisältö.
5. Lisää UUSI tiedosto: vasemmasta reunasta **"+"** -painike vasemmalla
   olevan "Tiedostot"-otsikon vierestä → **"Skripti"** → nimeä se **"Config"**
   (Apps Script lisää automaattisesti .gs-päätteen → tiedostoksi tulee
   Config.gs). Liitä sinne koko `apps-script-config.gs.js`:n sisältö.
6. Muokkaa **Config.gs**-tiedoston arvoja oman koulusi mukaan:
   ```js
   const SCHOOL_START_HOUR = 8;   // kouluaika alkaa klo 8
   const SCHOOL_END_HOUR = 16;    // kouluaika päättyy klo 16
   const SCHOOL_WEEKDAYS = [1, 2, 3, 4, 5]; // ma-pe (1=ma ... 7=su)
   const TEACHER_PASSCODE = "vaihda-tama-salasana"; // käsinsyötön salasana
   ```
7. Paina Tallenna (levykuvake) — tallentaa molemmat tiedostot.
8. Paina "Ota käyttöön" (Deploy) → "Uusi käyttöönotto" (New deployment).
   - Valitse tyypiksi "Verkkosovellus" (Web app)
   - "Suorita nimellä": Minä (oma tilisi)
   - "Kenellä on pääsy": Kaikki (Anyone) -- tämä on tärkeää,
     jotta oppilaiden puhelimet voivat lähettää tietoja
9. Paina "Ota käyttöön". Google pyytää lupia -- hyväksy ne.
10. Kopioi saamasi "Verkkosovelluksen URL-osoite" (Web app URL).

**Huijauksen esto:** Apps Script tarkistaa aina *palvelimen omaa kelloa*
sillä hetkellä kun pyyntö saapuu — ei koskaan oppilaan puhelimen kelloa.
Kouluajan ulkopuolella tehdyt tulokset tallentuvat silti taulukkoon (näet
ne sarakkeesta "Kelvollinen" = EI), mutta ne eivät lasketa rankingiin.

**Miksi index.html näyttää joskus vain arvion, ei varmaa tietoa:**
Selaimet eivät aina pysty lukemaan Apps Scriptin POST-vastausta CORS-
rajoitusten takia (tunnettu Apps Script -oikku). Tämän vuoksi index.html
hakee sivun latautuessa kouluaika-asetukset erillisellä GET-pyynnöllä
(joka on luotettavampi lukea) ja laskee niiden pohjalta laitteen omaan
kelloon perustuvan ENNAKKOARVION. Jos arvio sanoo "todennäköisesti EI
rankingiin", oppilas näkee siitä heti varoituksen sovelluksessa — mutta
lopullinen, huijaamaton totuus näkyy aina Google Sheetsin
"Kelvollinen"-sarakkeesta, koska se perustuu palvelimen omaan kelloon.

## Vaihe 2: Selainpuolen osoitteen liittäminen (VAIN YKSI TIEDOSTO)

Avaa **config.js** ja korvaa siinä oleva rivi:
```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```
omalla vaiheessa 1 saamallasi osoitteella. Tätä ei tarvitse enää tehdä
erikseen index.html:ään, ranking.html:ään, monthly.html:ään tai
manual.html:ään — ne kaikki lataavat osoitteen automaattisesti
config.js:stä.

## Vaihe 3: Julkaisu (GitHub Pages — ilmainen)

1. Luo tili osoitteessa github.com (jos ei vielä ole)
2. Luo uusi repositorio, esim. nimellä `matkamittari`
3. Lataa sinne KAIKKI seuraavat tiedostot samaan kansioon:
   - `index.html`
   - `ranking.html`
   - `monthly.html`
   - `manual.html`
   - `config.js`  ⭐ (uusi, tärkeä tiedosto)
   - `manifest.json`
   - `sw.js`

   (Tiedostoja `apps-script.js` ja `apps-script-config.gs.js` EI ladata
   GitHubiin — ne liitetään suoraan Apps Scriptin editoriin vaiheessa 1.)
4. Repositorion asetuksista: Settings → Pages → Source: valitse `main`-haara
5. GitHub antaa osoitteen muotoa `https://kayttajanimi.github.io/matkamittari/`
   - Mittaussovellus: `.../matkamittari/index.html`
   - Ranking (päivä/viikko): `.../matkamittari/ranking.html`
   - Kuukausiranking: `.../matkamittari/monthly.html`
   - Käsinsyöttö (opettajalle): `.../matkamittari/manual.html`

**Vaihtoehto ilman GitHubia:** voit käyttää myös esim. Netlify Drop
(netlify.com/drop) — vedä koko kansio selaimeen, ja saat julkaisuosoitteen
sekunneissa ilman tiliäkin.

## Vianetsintä: "Kelvollinen"-sarake ei koskaan näytä KYLLÄ

Jos tulokset merkitään aina "EI" vaikka mittaus tehtiin kouluaikana,
selvitä syy suoraan palvelimelta, ilman että tarvitsee lähettää oikeaa
testitulosta:

1. Avaa selaimessa oma Apps Script -osoitteesi ja lisää perään
   `?diagnose=1`, esim: `https://script.google.com/macros/s/.../exec?diagnose=1`
2. Sivu näyttää JSON-muodossa:
   - `serverTimeInSchoolTimezone` — mitä kellonaikaa palvelin JUURI NYT
     käyttää laskennassa
   - `configValues` — mitä SCHOOL_START_HOUR, SCHOOL_END_HOUR jne. arvoja
     palvelin todella käyttää (nämä tulevat Config.gs-tiedostosta)
   - `wouldBeValidRightNow` — `true` tai `false`: olisiko juuri nyt
     lähetetty tulos kelvollinen
   - `reason` — syy, jos ei kelvollinen

**Yleisimmät syyt, jos `wouldBeValidRightNow` on väärin:**

- **`configValues` näyttää vanhoja/oletusarvoja** vaikka olet muokannut
  Config.gs:ää → et ole tehnyt "Hallinnoi käyttöönottoja" → kynäkuvake →
  "Uusi versio" → Ota käyttöön muutosten jälkeen. Pelkkä Tallenna ei riitä.
- **`serverTimeInSchoolTimezone` näyttää väärän kellonajan** → tarkista
  että `SCHOOL_TIMEZONE`-arvo Config.gs:ssä on oikein kirjoitettu
  (`"Europe/Helsinki"`, ei esim. `"Europe/Helsingfors"`).
- **Testasit oikeasti kouluajan ulkopuolella** (esim. illalla kotona) →
  tämä on odotettu toiminta, ei virhe. Voit tilapäisesti laajentaa
  `SCHOOL_START_HOUR`/`SCHOOL_END_HOUR`-arvoja testausta varten ja palauttaa
  ne oikeiksi jälkikäteen (muista "Uusi versio" molemmilla kerroilla).
- **`?diagnose=1`-sivu ei aukea ollenkaan / näyttää virheen** → deployment
  ei ole julkinen ("Kenellä on pääsy" pitää olla Kaikki) tai Config.gs-
  tiedostoa ei ole luotu ollenkaan (jolloin SCHOOL_TIMEZONE on
  määrittelemätön ja koko funktio kaatuu virheeseen).

## Vaihe 4: Käyttö oppilaiden puhelimissa

1. Oppilas avaa `index.html`-osoitteen puhelimen selaimessa (Safari/Chrome)
2. Selaimen valikosta: "Lisää aloitusnäytölle" / "Add to Home Screen"
3. Sovellus näkyy nyt kuvakkeena kuin mikä tahansa muu sovellus
4. Ensimmäisellä käyttökerralla puhelin kysyy lupaa sijaintitietoihin — hyväksy

`ranking.html`- ja `monthly.html`-osoitteet voi näyttää esim. luokan
älytaululla tai julkaista linkkinä koulun sisäisessä viestikanavassa —
molemmat päivittyvät automaattisesti minuutin välein, ja sivujen
alalaidoissa on ristiinlinkit toisiinsa.

`manual.html`-osoitetta käytät sinä opettajana, kun jollain oppilaalla ei
ole ollut mahdollisuutta käyttää puhelimen GPS:ää. Syötä luokka, nimimerkki
ja matka, anna tarvittaessa tarkka päivä/kellonaika (jos tyhjä, käytetään
nykyhetkeä), ja vahvista opettajan tunnuskoodilla. Ei kannata jakaa tätä
osoitetta oppilaille.

## Tulosten tarkastelu

Kaikki mittaustulokset ilmestyvät Google Sheets -taulukkoosi riveinä:
aikaleima, luokka, nimimerkki, matka kilometreinä, kelvollisuus (KYLLÄ/EI),
huomautus ja lähde (Puhelin/Käsin). Voit suodattaa ja lajitella taulukkoa
normaalisti, tai tehdä siitä omia kaavioita.

## Huomioita

- **HTTPS vaaditaan**: GPS-sijainti (Geolocation API) toimii selaimissa
  vain HTTPS-osoitteissa. GitHub Pages ja Netlify tarjoavat tämän automaattisesti.
- **Akku**: jatkuva GPS-seuranta kuluttaa akkua tavallista enemmän — hyvä
  mainita oppilaille.
- **Asetusten muuttaminen jälkikäteen**:
  - config.js: muuta tiedostoa ja lataa se uudelleen GitHub Pagesille
    (tai vastaavalle) — ei vaadi mitään Apps Script -toimenpiteitä.
  - Config.gs: muuta arvoja Apps Script -editorissa, tallenna, ja tee
    "Hallinnoi käyttöönottoja" → kynäkuvake → "Uusi versio" → Ota käyttöön.
    Pelkkä Tallenna ei riitä aktivoimaan muutosta julkaistuun osoitteeseen.
- **Käsinsyötön salasana ei ole vahva suoja**: `TEACHER_PASSCODE` estää
  oppilaita käyttämästä lomaketta huvikseen, mutta koodi on nähtävissä
  kuka tahansa avaa manual.html:n lähdekoodin selaimen kehittäjätyökaluilla.
  Älä käytä samaa salasanaa kuin missään tärkeässä palvelussa.
- **Huijaus muilla tavoin**: tämä ratkaisu estää ajan manipuloinnin, mutta
  ei estä esim. autolla ajamista GPS:n huijaamiseksi tai useaa laitetta
  samalla oppilaalla.
- **Tietosuoja**: sovellus ei tallenna reittiä, vain kokonaismatkan.
- **Testaus**: testaa ensin itse kävelemällä/pyöräilemällä pieni matka,
  ennen kuin annat oppilaille käyttöön.
