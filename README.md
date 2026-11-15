# Laufplan 🏃

Persönliche Web-App (PWA) mit anpassbarem Trainingsplan – vom Geh-Lauf-Einsteiger bis zum Halbmarathon.

## Funktionen

- **Plan-Generator**: Halbmarathon- oder 10-km-Plan in 4 Phasen (Grundlage → Aufbau → Zielvorbereitung → Tapering), passend zu Start- und Wettkampfdatum und 2–3 Trainingstagen pro Woche. Überzählige Wochen werden als **Festigungswochen** (Puffer) verteilt.
- **Anpassbar**: Einheiten bearbeiten, hinzufügen, löschen und innerhalb der Woche verschieben (mit Warnung bei zwei harten Einheiten hintereinander).
- **„Ich bin ausgefallen“**: 1 Woche → letzte geschaffte Woche wiederholen · 2–3 Wochen → 2 Stufen zurück · 4+ Wochen → 4 Stufen zurück. Verpasstes wird nicht nachgeholt; die App schlägt die Anpassung automatisch vor, wenn eine Woche zu weniger als der Hälfte erledigt wurde.
- **Einwärmen & Dehnen** in jeder Laufeinheit, optionale **Mobility-Session**, Übungsbibliothek mit animierten Strichfiguren, Anleitung, Tipps und typischen Fehlern.
- **Intervall-Timer** mit Ton, Vibration und Sprachansage, Bildschirm bleibt an.
- **Erfassung**: Dauer, Distanz, Gefühl (1–5), Notiz.
- **Kalender-Export (.ics)** für Erinnerungen, **Backup/Wiederherstellen** als JSON.
- Daten bleiben lokal im Browser, kein Konto, funktioniert offline.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Tests der Plan-Logik
npm run build    # Produktions-Build nach dist/
```

Tipp zum Testen: `?heute=2027-03-01` an die URL hängen simuliert ein anderes Datum.

## Veröffentlichen (GitHub Pages)

1. Im Repo unter **Settings → Pages → Source** „GitHub Actions“ wählen.
2. Auf `main` pushen bzw. mergen – der Workflow `.github/workflows/deploy.yml` testet, baut und veröffentlicht die App.
3. Die App unter `https://<benutzer>.github.io/<repo>/` in Chrome auf Android öffnen → Menü → **„App installieren“**.

## Struktur

```
src/lib/templates.ts   Trainingsstufen der Pläne
src/lib/plan.ts        Planerstellung, Neuberechnung, Verschieben
src/lib/steps.ts       Ablauf für den Timer
src/data/exercises.ts  Übungen, Posen der Strichfiguren, Routinen
src/views/             Bildschirme (Heute, Woche, Plan, Übungen, Einstellungen, Timer)
```

> Hinweis: Die App ersetzt keine ärztliche Beratung. Bei Schmerzen pausieren.
