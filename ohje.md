# Matkamittari — käyttöönotto-ohje

Sovellus koostuu kolmesta osasta:
1. **Mittaussovellus** (index.html, manifest.json, sw.js) — oppilaiden käyttämä GPS-mittari
2. **Backend** (apps-script.js) — Google Sheets + Apps Script, joka tallentaa tulokset
   ja tarkistaa palvelimen omasta kellosta, onko tulos tehty kouluaikana
3. **Ranking-sivu** (ranking.html) — näyttää päivä- ja viikkotason parhaat luokat

## Vaihe 1: Backend (Google Sheets + Apps Script)

1. Luo uusi Google Sheets -taulukko
2. Lisää ensimmäiselle riville otsikot soluihin A1:F1:
   `Aikaleima | Luokka | Nimimerkki | Matka (km) | Kelvollinen | Huomautus`
3. Laajennukset → Apps Script → liitä `apps-script.js`:n koko sisältö
4. Muokkaa tiedoston alussa olevia asetuksia oman koulusi mukaan:
   ```js
   const SCHOOL_START_HOUR = 8;   // kouluaika alkaa klo 8
   const SCHOOL_END_HOUR = 14;    // kouluaika päättyy klo 14
   const SCHOOL_WEEKDAYS = [1, 2, 3, 4, 5]; // ma-pe (1=ma ... 7=su)
   ```
5. Ota käyttöön verkkosovelluksena, käyttöoikeus "Kaikki"
6. Kopioi saamasi URL-osoite (muotoa `https://script.google.com/macros/s/.../exec`)

**Huijauksen esto:** Apps Script tarkistaa aina *palvelimen omaa kelloa*
sillä hetkellä kun pyyntö saapuu — ei koskaan oppilaan puhelimen kelloa.
Puhelimen kellon siirtäminen ei siis vaikuta mitenkään. Kouluajan
ulkopuolella tehdyt tulokset tallentuvat silti taulukkoon (näet ne
sarakkeesta "Kelvollinen" = EI, syy näkyy "Huomautus"-sarakkeessa), mutta
ne **eivät** lasketa mukaan ranking-sivun laskelmiin.

## Vaihe 2: Frontend-osoitteiden liittäminen

Sekä `index.html` että `ranking.html` käyttävät samaa backendia. Avaa
molemmat tiedostot ja korvaa niissä oleva rivi:
```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```
omalla vaiheessa 1 saamallasi osoitteella (sama osoite molempiin).

## Vaihe 3: Julkaisu (GitHub Pages — ilmainen)

1. Luo tili osoitteessa github.com (jos ei vielä ole)
2. Luo uusi repositorio, esim. nimellä `matkamittari`
3. Lataa sinne kaikki tiedostot: `index.html`, `ranking.html`,
   `manifest.json`, `sw.js`
4. Repositorion asetuksista: Settings → Pages → Source: valitse `main`-haara
5. GitHub antaa osoitteen muotoa `https://kayttajanimi.github.io/matkamittari/`
   - Mittaussovellus: `.../matkamittari/index.html`
   - Ranking: `.../matkamittari/ranking.html`

**Vaihtoehto ilman GitHubia:** voit käyttää myös esim. Netlify Drop
(netlify.com/drop) — vedä vain kansio selaimeen, ja saat julkaisuosoitteen
sekunneissa ilman tiliäkin.

## Vaihe 4: Käyttö oppilaiden puhelimissa

1. Oppilas avaa `index.html`-osoitteen puhelimen selaimessa (Safari/Chrome)
2. Selaimen valikosta: "Lisää aloitusnäytölle" / "Add to Home Screen"
3. Sovellus näkyy nyt kuvakkeena kuin mikä tahansa muu sovellus
4. Ensimmäisellä käyttökerralla puhelin kysyy lupaa sijaintitietoihin — hyväksy

`ranking.html`-osoitteen voi näyttää esim. luokan älytaululla tai
julkaista linkkinä koulun sisäisessä viestikanavassa — se päivittyy
automaattisesti minuutin välein.

## Tulosten tarkastelu

Kaikki mittaustulokset ilmestyvät Google Sheets -taulukkoosi riveinä:
aikaleima, luokka, nimimerkki, matka kilometreinä, kelvollisuus (KYLLÄ/EI)
ja huomautus. Voit suodattaa ja lajitella taulukkoa normaalisti, tai tehdä
siitä omia kaavioita.

## Huomioita

- **HTTPS vaaditaan**: GPS-sijainti (Geolocation API) toimii selaimissa
  vain HTTPS-osoitteissa. GitHub Pages ja Netlify tarjoavat tämän automaattisesti.
- **Akku**: jatkuva GPS-seuranta kuluttaa akkua tavallista enemmän — hyvä
  mainita oppilaille.
- **Kouluaika-asetusten muuttaminen**: jos muutat `SCHOOL_START_HOUR` tms.
  arvoja Apps Scriptissä, sinun täytyy tehdä "Hallinnoi käyttöönottoja" →
  kynäkuvake → "Uusi versio" → Ota käyttöön, jotta muutos tulee voimaan.
  Pelkkä koodin tallennus ei riitä.
- **Huijaus muilla tavoin**: tämä ratkaisu estää ajan manipuloinnin, mutta
  ei estä esim. autolla ajamista GPS:n huijaamiseksi tai useaa laitetta
  samalla oppilaalla. Jos tämä on huolena, kannattaa harkita esim.
  nopeusrajan tarkistusta (jos nopeus on toistuvasti yli esim. 20 km/h,
  merkitse tulos epäilyttäväksi).
- **Tietosuoja**: sovellus ei tallenna reittiä, vain kokonaismatkan. Jos
  haluat kerätä myös reittipisteet, se on mahdollista mutta vaatii
  lisäpohdintaa tietosuojasta (GDPR, alaikäiset).
- **Testaus**: testaa ensin itse kävelemällä/pyöräilemällä pieni matka,
  ennen kuin annat oppilaille käyttöön. Kokeile myös lähettää tulos
  tarkoituksella kouluajan ulkopuolella (esim. muuttamalla hetkeksi
  SCHOOL_START_HOUR-arvoa testiä varten) varmistaaksesi, että
  "Kelvollinen"-sarake toimii odotetusti.

