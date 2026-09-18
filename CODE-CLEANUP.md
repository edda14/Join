# Code-Aufbereitung – 18.09.2026

Die großen Skripte sind nach Verantwortlichkeiten aufgeteilt: Task-Formular,
Kontaktzuordnung, Subtasks, Bildverarbeitung, Galerie, Task-Details, Task-Bearbeitung,
Kontaktliste, Kontakt-Bearbeitung, Kontaktbilder und Datenbankzugriff.
Die vorhandenen HTML-Seiten laden die benötigten Dateien in ihrer bisherigen
Ausführungsreihenfolge.

Statische Karten-, Formular- und Popupstrukturen stehen jetzt in inerten
HTML-`template`-Elementen. JavaScript füllt deren dynamische Platzhalter.
Bereits vorhandene Text-Escapes bleiben erhalten. Das gemeinsam verwendete
Task-Formular liegt weiterhin in `template/addTaskTemplate.html`.

Große Stylesheets laden kleinere Abschnitte über geordnete CSS-Imports.
Die Reihenfolge der Regeln, Media Queries und Deklarationen ist mit der
Sicherung vor der Aufbereitung verglichen worden.

## Ergebnis der automatischen Prüfung

- 96 JavaScript-, CSS- und HTML-Dateien geprüft: höchstens 400 Zeilen pro Datei.
- 564 Funktionen einschließlich Callbacks geprüft: höchstens 14 Zeilen.
- JSDoc einschließlich Parameter und Rückgabewerte für alle benannten Funktionen.
- Keine statischen HTML-Strukturen mehr in JavaScript-Strings.
- Skriptpfade und benötigte HTML-Vorlagen auf allen 14 Seiten vorhanden.
- Einheitliche Einrückung und bereinigte Namen für Auswahlzustände und Handler.
- Gemeinsamer Ablauf für JSON-Schreibzugriffe auf Firebase.
- Kategorieauswahl mit Boolean statt Zeichenketten als Zustandsflag.

## Gezielte Regressionstests

33 Prüfungen in einer simulierten Browserumgebung bestanden, darunter:

- Skript-Ausführungsreihenfolge aller Seiten.
- Vergleich wichtiger Karten-, Kontakt-, Galerie- und Popup-Ausgaben mit der Sicherung.
- Platzhalterersetzung einschließlich Sonderzeichen.
- JSON-Schreibzugriffe mit unveränderten Methoden, Nutzdaten und Löschverhalten.
- Authentifizierte Datenbankanfragen und aussagekräftige HTTP-Fehler.
- Erhalt gespeicherter Kontaktbilder beim Einlesen.
- Leere Kontaktantworten ohne zurückbleibende alte Daten.
- Schutz vor gleichzeitigem Speichern und Erhalt der Eingaben bei einem Fehler.

Die Regelreihenfolge und Deklarationen aller neun aufgeteilten Stylesheets
wurden ebenfalls verglichen. Diese Tests verwenden simulierte DOM- und
Firebase-Antworten; der vorherige vollständige Chrome-Test wurde nicht wiederholt.

## Erneut prüfen

Die strukturelle Prüfung liegt in `tools/verifyCodeQuality.cjs`.
Sie benötigt Node.js und TypeScript. Mit der vorhandenen globalen
TypeScript-Installation lässt sie sich im Projektordner ausführen:

```sh
NODE_PATH="$(npm root -g)" node tools/verifyCodeQuality.cjs
```

Die Prüfung kontrolliert Syntax, Funktions- und Dateilängen, JSDoc,
Skriptpfade, HTML-Vorlagen und die Trennung statischen HTMLs von JavaScript.
Sie bewertet die hier bearbeiteten Codevorgaben, nicht die gesamte Prüfungs-DoD.
