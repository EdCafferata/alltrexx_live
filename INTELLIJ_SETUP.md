# Alltrexx Live — IntelliJ Setup

Lokaal draaien zonder Docker of MySQL. H2 in-memory database ingebouwd.

---

## Vereisten
- **IntelliJ IDEA** (Community of Ultimate)
- **Java 21 JDK** ⚠️ Exact versie 21 — niet 22, 23 of hoger! Download via IntelliJ zelf of van https://adoptium.net/temurin/releases/?version=21
- **Node.js 18+** — https://nodejs.org (voor frontend)

> **Waarom Java 21?** De Spring Boot versie en Lombok vereisen Java 21. Hogere versies geven compileerfouten.

---

## Stap 1 — Backend openen in IntelliJ

1. Open IntelliJ IDEA
2. **File → Open** → navigeer naar:
   ```
   /Volumes/Backup-Ed/AI/alltrexx_live/backend
   ```
3. IntelliJ herkent automatisch het `pom.xml` → klik **Open as Maven Project**
4. Wacht tot Maven alle dependencies downloadt (1-2 min, rechtsboven voortgangsbalk)

### Java 21 instellen
- **File → Project Structure → Project → SDK**
- Kies Java 21 (of klik **Add SDK → Download JDK** → kies Temurin 21)

---

## Stap 2 — Backend starten

1. Zoek in IntelliJ: `src/main/java/info/cafferata/alltrexx/AlltrexxApplication.java`
2. Klik de **groene play-knop** naast de class of rechtsklik → **Run 'AlltrexxApplication'**
3. Wacht op:
   ```
   Started AlltrexxApplication in X.XXX seconds
   ✅ Demo data geladen: 4 boten, 2 fietsen, 1 auto, 1 vliegtuig, 1 persoon
   ```

### Backend draait op:
- API: http://localhost:8080
- H2 database console: http://localhost:8080/h2
  - JDBC URL: `jdbc:h2:mem:alltrexxdb`
  - Username: `sa` / Password: *(leeg)*

### API testen:
```
http://localhost:8080/api/kaart/live
```
→ JSON met alle demo-trackers (boten, fietsen, auto, vliegtuig, persoon)

---

## Stap 3 — Frontend starten

Open een terminal (IntelliJ Terminal of apart):

```bash
cd /Volumes/Backup-Ed/AI/alltrexx_live/frontend
npm install        # eenmalig
npm start          # start dev server
```

Frontend draait op: **http://localhost:3000**

De `"proxy": "http://localhost:8080"` in `package.json` zorgt dat API calls automatisch naar de backend gaan.

---

## Wat je ziet

Op http://localhost:3000 verschijnt de live kaart met:
- ⛵ 4 boten (o.a. Zeilboot Vrijheid bij IJmuiden, MS Rotterdam bij Rotterdam)
- 🚴 2 fietsen (Ed in Amsterdam, Jim in Eindhoven)
- 🚗 1 auto (op de A2)
- ✈️ 1 vliegtuig (KLM1234 richting Londen)
- 🚶 1 persoon (hardloper Vondelpark)

---

## Handige IntelliJ tips

| Actie | Shortcut |
|---|---|
| Zoek bestand | `Shift + Shift` |
| Run configuratie | `Shift + F10` |
| Stop applicatie | `Ctrl + F2` |
| Maven refresh | Rechtsklik `pom.xml` → Maven → Reload |

---

## Problemen

**Poort 8080 al in gebruik:**
```bash
lsof -i :8080   # kijk wat er draait
kill -9 <PID>   # stop het process
```

**Maven build fails:**
- Check Java versie: `java -version` → moet 21 zijn
- IntelliJ: File → Project Structure → SDK → Java 21

**Frontend start niet:**
```bash
node -v    # moet 18+ zijn
npm -v     # moet 9+ zijn
```
