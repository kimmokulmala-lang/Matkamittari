# Matkamittari — käyttöönotto-ohje

Sovellus koostuu kahdesta osasta:
1. **Frontend** (index.html, manifest.json, sw.js) — oppilaiden käyttämä sovellus
2. **Backend** (apps-script.js) — Google Sheets, johon tulokset tallentuvat

## Vaihe 1: Backend (Google Sheets + Apps Script)

Seuraa `apps-script.js`-tiedoston yläreunan ohjeita. Lyhyesti:
1. Luo uusi Google Sheets -taulukko
2. Laajennukset → Apps Script → liitä `apps-script.js`:n sisältö
3. Ota käyttöön verkkosovelluksena, käyttöoikeus "Kaikki"
4. Kopioi saamasi URL-osoite (muotoa `https://script.google.com/macros/s/.../exec`)

## Vaihe 2: Frontend-osoitteen liittäminen

Avaa `index.html` ja etsi rivi:
```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```
Korvaa se omalla vaiheessa 1 saamallasi osoitteella.

## Vaihe 3: Julkaisu (GitHub Pages — ilmainen)

1. Luo tili osoitteessa github.com (jos ei vielä ole)
2. Luo uusi repositorio, esim. nimellä `matkamittari`
3. Lataa sinne tiedostot: `index.html`, `manifest.json`, `sw.js`
4. Repositorion asetuksista: Settings → Pages → Source: valitse `main`-haara
5. GitHub antaa osoitteen muotoa `https://kayttajanimi.github.io/matkamittari/`

**Vaihtoehto ilman GitHubia:** voit käyttää myös esim. Netlify Drop
(netlify.com/drop) — vedä vain kansio selaimeen, ja saat julkaisuosoitteen
sekunneissa ilman tiliäkin.

## Vaihe 4: Käyttö oppilaiden puhelimissa

1. Oppilas avaa julkaisuosoitteen puhelimen selaimessa (Safari/Chrome)
2. Selaimen valikosta: "Lisää aloitusnäytölle" / "Add to Home Screen"
3. Sovellus näkyy nyt kuvakkeena kuin mikä tahansa muu sovellus
4. Ensimmäisellä käyttökerralla puhelin kysyy lupaa sijaintitietoihin — hyväksy

## Tulosten tarkastelu

Kaikki mittaustulokset ilmestyvät automaattisesti Google Sheets -taulukkoosi
riveinä: aikaleima, luokka, nimimerkki, matka kilometreinä. Voit suodattaa
ja lajitella taulukkoa normaalisti, tai tehdä siitä kaavioita.

## Huomioita

- **HTTPS vaaditaan**: GPS-sijainti (Geolocation API) toimii selaimissa
  vain HTTPS-osoitteissa. GitHub Pages ja Netlify tarjoavat tämän automaattisesti.
- **Akku**: jatkuva GPS-seuranta kuluttaa akkua tavallista enemmän — hyvä
  mainita oppilaille.
- **Tietosuoja**: sovellus ei tallenna reittiä, vain kokonaismatkan. Jos
  haluat kerätä myös reittipisteet, se on mahdollista mutta vaatii
  lisäpohdintaa tietosuojasta (GDPR, alaikäiset).
- **Testaus**: testaa ensin itse kävelemällä/pyöräilemällä pieni matka,
  ennen kuin annat oppilaille käyttöön.
