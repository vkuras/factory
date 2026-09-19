Stakeholder:
Ich will eine App für meine Rezepte bauen. Ich hab die grad als Markdown Files in nem Git Repo, das nervt. Man soll die mit der Familie teilen können und beim Kochen gut benutzen. Soll in Kotlin gebaut werden. Irgendwann wär auch ein Wochenplan cool.

Groomer:
Klingt gut! Ein paar Fragen, damit ich den Umfang festlegen kann. Stichpunkte reichen.

**Nutzer & Teilen**
1. Wer ist „die Familie“? Etwa wie viele Leute, und alle in einem Haushalt oder auch Eltern oder Geschwister woanders?
2. Sollen alle Rezepte **bearbeiten und anlegen** können oder nur **lesen**? Gibt es private Rezepte, die nur du siehst?

**Geräte**
3. Auf welchen Geräten soll das laufen? Nur Android, oder hat jemand in der Familie ein iPhone? Braucht ihr einen Browser oder Desktop, z. B. zum Anlegen von Rezepten am Laptop?
4. Ist „Kotlin“ eine feste Vorgabe (du willst Kotlin lernen oder nutzen) oder eher eine Präferenz?

**Bestehende Rezepte**
5. Wie viele Markdown-Rezepte hast du ungefähr? Haben sie eine einheitliche Struktur (z. B. Abschnitte „Zutaten“ und „Zubereitung“)? Müssen sie **automatisch importiert** werden?
6. Soll das Git-Repo danach wegfallen, oder willst du weiterhin einen Export bzw. ein Backup als Dateien?

**Beim Kochen**
7. Was nervt dich beim Kochen heute konkret? Welche davon sind Pflicht?
   - (a) Bildschirm geht aus
   - (b) Schrift zu klein, Scrollen mit schmutzigen Händen
   - (c) Schritt-für-Schritt-Ansicht
   - (d) Portionen umrechnen
   - (e) Zutaten abhaken
   - (f) Timer
   - (g) Offline in der Küche ohne WLAN
8. Braucht ihr **Fotos**, **Kategorien/Tags** (z. B. „vegetarisch“, „schnell“) und eine **Suche**?

**Umfang**
9. Den Wochenplan würde ich als „später“ markieren und nicht in die erste Version nehmen, aber so, dass er später gut dazukommen kann. Passt das? Gibt es sonst etwas, das „irgendwann“ kommen soll, z. B. eine Einkaufsliste?
10. Rahmen: Darf das laufende Kosten verursachen (Server, Hosting)? Gibt es eine Deadline?

Stakeholder:
wir sind zu viert, ich, meine frau, und später die zwei kids. alles ein haushalt.

alle im haushalt sehen alle rezepte, aber bearbeiten kann nur wer's angelegt hat. nix privates, nix öffentlich, keine links für fremde.

geräte: hauptsächlich handy/tablet beim kochen, meine frau hat iphone ich android. zum anlegen wär browser/laptop schon nice.

kotlin ist mein wunsch, bin kotlin dev.

hab ca 15 rezepte als md files, einmaliger import reicht.

git repo kann danach weg, kein backup nötig extra.

beim kochen nervt: bildschirm geht aus, schrift zu klein/scrollen mit dreckigen händen, und wlan in der küche ist schlecht - muss offline gehen wenn ich's rezept schon offen hatte. rest ist nice to have.

fotos ja gerne, ein foto pro rezept reicht. kategorien ja - hauptgerichte, beilagen, soßen wie bisher. suche nur über namen reicht.

wochenplan später passt so. einkaufsliste auch "irgendwann", nicht jetzt.

darf nix kosten, kein server-hosting-budget. keine deadline, aber schneller ist besser.

Groomer:
Danke, das ist schon sehr klar. Noch eine kurze zweite Runde:

**1. Kosten und Teilen (der wichtigste Punkt)**
Damit Android, iPhone und Browser dieselben Rezepte sehen, müssen die Daten irgendwo zentral liegen. „Kostet nichts“ heißt dann in der Praxis eine dieser Optionen:
- (a) **Kostenloses Kontingent eines Cloud-Anbieters.** Bei 4 Leuten und rund 15 bis 100 Rezepten reicht das locker. Das Risiko: Der Anbieter kann die Bedingungen ändern, und ihr braucht dort ein Konto bzw. die Daten liegen bei ihm.
- (b) **Selbst gehostet zu Hause**, z. B. auf einem NAS oder Raspberry Pi. Hast du so ein Gerät, das rund um die Uhr läuft? Soll die App auch **von unterwegs** funktionieren (z. B. im Supermarkt nachschauen) oder nur im Heim-WLAN?
- Ist (a) für dich okay? Oder ist dir wichtig, dass die Daten bei euch bleiben?

**2. Anmeldung**
Braucht jede Person ein eigenes Login? Das wäre nötig, damit „nur wer's angelegt hat, darf bearbeiten“ funktioniert. Wie kommt ein neues Familienmitglied rein, z. B. per Einladung durch dich? Und sollst du als „Admin“ trotzdem alles bearbeiten oder löschen können, z. B. wenn ein Kind Quatsch macht?

**3. Rezeptinhalt**
Kannst du mir **eine** deiner Markdown-Dateien hier reinkopieren? Dann sehe ich, welche Felder ein Rezept hat (Portionen, Zutaten, Schritte, Notizen …).

**4. Kategorien**
Sollen es genau die drei festen Kategorien sein (Hauptgerichte, Beilagen, Soßen), oder sollt ihr selbst welche anlegen können? Hat jedes Rezept genau eine Kategorie?

**5. Offline**
Reicht es, wenn offline nur **Ansehen** geht und das Anlegen oder Bearbeiten Internet braucht?

**6. Import**
Ist es okay, wenn der einmalige Import der 15 Dateien ein Werkzeug ist, das du als Entwickler einmal ausführst, statt einer Funktion in der App? Das spart Zeit.

**7. Sprache**
Soll die App nur auf Deutsch sein?

Stakeholder:
1. das soll der architekt entscheiden. hab kein nas oder pi laufen zuhause. von unterwegs nachschauen wär nice to have, muss aber nicht sein.

2. ja jeder braucht login. neue leute lad ich ein. und ich als admin darf alles bearbeiten/löschen, auch wenn die kids mal quatsch machen.

3. keine lust das rauszusuchen grad, aber sieht so aus: titel, portionen, zutaten als liste mit menge+einheit, dann die schritte, manchmal ne notiz unten.

4. genau die drei, hauptgerichte/beilagen/soßen. jedes rezept genau eine kategorie.

5. ja reicht. offline nur ansehen, bearbeiten/anlegen darf internet brauchen.

6. ja passt, mach das einmal als tool, muss keine app-funktion sein.

7. ja nur deutsch reicht.

Groomer:
Die Anforderungen sind fertig: `docs/requirements.md` (auf Englisch, wie vorgegeben).

**Das kommt in die erste Version:**
- Ein Haushalt mit bis zu 4 Personen. Jeder hat ein eigenes Login, und neue Leute kommen nur per Einladung von dir rein.
- Alle sehen alle Rezepte. Bearbeiten und Löschen darf nur, wer ein Rezept angelegt hat, und du als Admin darfst alles.
- Laufen soll es auf Android, iPhone und im Browser, nur auf Deutsch.
- Ein Rezept hat: Titel, eine Kategorie (Hauptgerichte, Beilagen oder Soßen), Portionen, Zutaten mit Menge, Einheit und Name, Schritte, eine optionale Notiz und ein optionales Foto.
- Beim Kochen bleibt der Bildschirm an, die Schrift ist groß, und man muss kaum fein scrollen oder tippen.
- Offline kann man jedes Rezept ansehen, das auf dem Gerät schon einmal geöffnet war. Anlegen und Bearbeiten brauchen Internet.
- Suche nach Namen und Filter nach Kategorie.
- Die 15 Markdown-Dateien importierst du einmal mit einem eigenen Tool, das nicht Teil der App ist.
- Vorgaben: Es kostet nichts, es gibt keinen Server bei dir zu Hause, und es wird möglichst in Kotlin gebaut.

**Nicht in der ersten Version:**
- Wochenplan und Einkaufsliste kommen später. Die Zutaten werden aber so gespeichert, dass beides gut dazukommen kann.
- Schritt-für-Schritt-Ansicht, Portionen umrechnen, Zutaten abhaken, Timer und Zugriff von unterwegs sind „nice to have“.

**Das entscheidet der Architekt** und legt dir die Optionen zur Freigabe vor: Hosting und Backend (kostenlos), wie Android, iPhone und Browser mit Kotlin abgedeckt werden, Login und Einladung, die Offline-Strategie und die Gestaltung der Koch-Ansicht.

**Diese Annahmen habe ich getroffen (Abschnitt 10). Bitte korrigieren, falls etwas nicht stimmt:**
- Deine Markdown-Dateien enthalten keine Kategorie. Du vergibst sie beim Import.
- Mengen dürfen leer sein, z. B. „Salz nach Geschmack“.
- Du kannst Mitglieder auch wieder entfernen. Deren Rezepte bleiben erhalten.
- Löschen ist endgültig, es gibt keinen Papierkorb.
- Wenn zwei Leute gleichzeitig dasselbe Rezept bearbeiten, gilt die zuletzt gespeicherte Version.
