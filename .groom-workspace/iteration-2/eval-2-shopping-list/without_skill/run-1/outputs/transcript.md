Stakeholder:
Ich brauch ne Einkaufsliste. Ich will aus Rezepten die Zutaten auf ne Liste packen. Vielleicht kann man auch Vorräte abhaken, weiß nicht. Sync am besten über Firebase.

Groomer:
Gut, passt gut zum bestehenden Rezeptbuch. Ein paar Fragen, damit ich es sauber aufschreiben kann. Wo du unsicher bist, reicht mein Vorschlag in Klammern mit "ok".

1. **Wer nutzt die Liste?** Gibt es eine gemeinsame Liste für den ganzen Haushalt, die alle live sehen? (Vorschlag: ja, eine gemeinsame Liste)
2. **Rezept hinzufügen:** Sollen die Zutaten in der aktuell eingestellten Portionszahl übernommen werden? (Vorschlag: ja)
3. **Mehrere Rezepte:** Sollen gleiche Zutaten zusammengefasst werden, z. B. 200 g + 300 g Mehl = 500 g? Und was passiert bei verschiedenen Einheiten wie "1 Becher" + "200 g"? (Vorschlag: bei gleicher Einheit zusammenfassen, sonst getrennt auflisten)
4. **Eigene Einträge:** Soll man auch Dinge ohne Rezept eintragen können, z. B. Klopapier? (Vorschlag: ja)
5. **"Vorräte abhaken":** Welche Variante meinst du?
   a) Beim Übernehmen eines Rezepts wegklicken, was schon da ist
   b) Eine feste Liste "haben wir immer" (Salz, Öl), die automatisch nicht auf die Liste kommt
   c) Ein richtiger Vorratsbestand mit Mengen
   d) Erstmal gar nicht
   (Vorschlag: a jetzt, b vielleicht später)
6. **Im Laden:** Beim Einkaufen abhaken, und das auch ohne Netz im Laden? Was passiert mit abgehakten Einträgen? (Vorschlag: ja, auch offline; abgehakte rutschen nach unten und lassen sich per "Liste leeren" löschen)
7. **Eine Liste oder mehrere** (z. B. pro Laden)? Sortierung nach Abteilung (Obst, Kühlregal …)? (Vorschlag: eine Liste, keine Sortierung nach Abteilung)
8. **Firebase:** Läuft die Rezept-App schon auf Firebase, oder ist das ein neuer Wunsch? Ist Firebase ein Muss, oder geht es dir vor allem darum, dass alle Handys sofort synchron sind? Die Technik entscheidet später der Architekt.

Stakeholder:
1. Ja, eine gemeinsame Liste, alle live.
2. Ja, aktuelle Portionszahl.
3. Ja genau, gleiche Einheit zusammenfassen, sonst getrennt.
4. Ja, klar, sowas wie Klopapier auch.
5. Nee, kein Vorratsmanagement, nur beim Hinzufügen wegklicken. Also a.
6. Ja, auch offline abhaken. Abgehakte nach unten, mit "Liste leeren" weg.
7. Eine Liste. Sortierung nach Abteilung wär schon nice - Obst, Kühlregal, Tiefkühl, sowas.
8. Läuft noch nicht auf Firebase, ist neuer Wunsch. Mir geht's vor allem dass alle Handys sofort sync sind, Firebase ist nur meine Idee dafür.

Groomer:
Danke, fast fertig. Noch vier kurze Punkte, vor allem zur Sortierung nach Abteilung:

1. **Wer ordnet die Abteilung zu?** (Vorschlag: Man ordnet einen Eintrag einmal zu, z. B. "Milch → Kühlregal", und die App merkt sich das für den ganzen Haushalt. Alles ohne Zuordnung landet unter "Sonstiges".)
2. **Welche Abteilungen, in welcher Reihenfolge?** (Vorschlag: eine feste Liste in Laufreihenfolge: Obst & Gemüse, Brot & Backwaren, Kühlregal, Fleisch & Fisch, Trockenwaren, Gewürze, Getränke, Drogerie, Tiefkühl, Sonstiges. Eigene Abteilungen oder eine eigene Reihenfolge kämen später.)
3. **Priorität:** Ist die Sortierung Pflicht für die erste Version, oder darf sie notfalls nachgeliefert werden? (Vorschlag: gewünscht, aber kein Blocker)
4. **Kleinkram:**
   - "Liste leeren" löscht nur die abgehakten Einträge.
   - Jeder im Haushalt darf Einträge bearbeiten, löschen und die Liste leeren.
   - Am Eintrag steht klein, aus welchem Rezept er kommt, z. B. "Mehl 500 g · Pfannkuchen, Pizza".

   Ok so?

Stakeholder:
1. Ja passt, einmal zuordnen und die App merkt sich das fürs Haushalt.
2. Ja ok, die Reihenfolge passt.
3. Kein Blocker, wenn's später kommt ist auch ok.
4. Ja passt so.

Groomer:
Danke, ist alles aufgeschrieben. Kurz zusammengefasst:

**Pflicht:**
- Eine gemeinsame Liste für den ganzen Haushalt, live auf allen Handys.
- Ein Rezept mit der aktuellen Portionszahl übernehmen und vorher abwählen, was schon da ist.
- Gleiche Zutat mit gleicher Einheit wird zusammengefasst, am Eintrag steht, aus welchem Rezept sie kommt.
- Eigene Einträge wie Klopapier. Jeder darf alles bearbeiten und löschen.
- Abhaken auch offline. Abgehakte rutschen nach unten, "Liste leeren" entfernt nur die abgehakten.

**Gewünscht, darf später kommen:** Sortierung nach Abteilung in fester Reihenfolge. Die Zuordnung macht man einmal, und der Haushalt merkt sie sich.

**Nicht dabei:** Vorratsverwaltung, mehrere Listen, Umrechnung von Einheiten.

**Firebase** ist als dein Vorschlag vermerkt. Die eigentliche Anforderung ist sofortiger Sync und Offline-Nutzung. Welche Technik es wird, entscheidet der Architekt.

**Bitte kurz prüfen, das habe ich angenommen:**
- "Zwiebel" und "Zwiebeln" gelten als verschiedene Zutaten.
- Wird dasselbe Rezept zweimal übernommen, addieren sich die Mengen.
- Ändern zwei Leute gleichzeitig denselben Eintrag, gilt die spätere Änderung.
- Änderst du ein Rezept nachträglich, bleiben die Einträge auf der Liste wie sie sind.
- Eine Zutat ohne Menge, z. B. "Salz nach Geschmack", kommt ohne Menge auf die Liste und wird nur einmal gelistet.

Falls etwas davon nicht passt, sag Bescheid.

Dateien:
- `docs/requirements/002-shopping-list.md`
- `docs/product.md` (Glossar und Übersicht ergänzt)
