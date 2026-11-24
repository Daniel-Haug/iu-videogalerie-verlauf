# IU Kaltura Video-Verlauf Tracker (Userscript)

Ein Tampermonkey-Userscript für die Kaltura-Videogalerie in Moodle (`mycampus-classic.iu.org` / `videogallery.iu.org`), das angesehene Videos lokal merkt, in Playlists markiert und den Umgang mit dem Player erleichtert.

## Funktionen

* **Automatischer Verlauf (erst ab > 5 Sekunden Wiedergabe):** Videos auf myCampus werden nicht schon beim bloßen Öffnen oder Pausieren erfasst, sondern erst, wenn sie länger als 5 Sekunden aktiv abgespielt wurden.
* **Verlaufs-Modal mit Kursbezug & Klick-Funktion:** Zeigt angesehene Videos inkl. Kursname und Zeitstempel an, erlaubt das Löschen einzelner oder aller Einträge und kopiert beim Klick auf einen Eintrag den Videotitel in die Zwischenablage, während die Videogalerie des dazugehörigen Kurses in einem neuen Tab geöffnet wird.
  
  <img width="1596" height="1280" alt="verlauf" src="https://github.com/user-attachments/assets/3fa48768-2265-419d-b79e-33ec9122d6d4" />
* **„Video Verlauf“-Button:** Direkt in der Galerie-Tab-Leiste sowie unter dem Video-Player verfügbar.
* **„✓ Gesehen“-Markierung in Playlists:** Kennzeichnet bereits im Verlauf enthaltene Einträge direkt in der Playlist-Ansicht.
  
  <img width="726" height="980" alt="playlist" src="https://github.com/user-attachments/assets/b1c64ba0-0cbc-4944-8823-4270c95d685c" />

* **Leertasten-Steuerung (`Space`):** Dem Video-Player, den myCampus nutzt fehlt standardmäßig die Funktion. dass Videos mit der Leertaste pausiert/abgespielt werden können. Diese Funktion wurde hier ebenfalls hinzugefügt.

## Installation

1. Installiere die Browser-Erweiterung **Tampermonkey** (für Chrome, Edge, Firefox, Brave usw.).
2. Klicke auf den Direkt-Installationslink: **[iu-kaltura-verlauf.user.js installieren](https://raw.githubusercontent.com/Daniel-Haug/iu-videogalerie-verlauf/main/iu-kaltura-verlauf.user.js)**
3. Tampermonkey öffnet automatisch die Installationsansicht – klicke auf **Installieren**.
4. Lade Moodle (`mycampus-classic.iu.org`) bzw. die Videogalerie neu.

> !! Hinweis zu Browser-Einstellungen !!: Falls das Skript in eingebetteten Frames (wie der Kaltura-Videogalerie) nicht sofort greift, prüfe in den Erweiterungs- bzw. Tampermonkey-Einstellungen deines Browsers, ob Userscripts/Entwicklermodus für die entsprechenden Seiten freigegeben sind.

## Datenschutz & Speicherung

* Der gesamte Videoverlauf wird **ausschließlich lokal in deinem Browser** über den Tampermonkey-Speicher (`GM_setValue` / `GM_getValue`) abgelegt.
* Es werden keine Daten an externe Server übertragen.

## Hinweise & Grenzen

* Das Skript stützt sich auf die aktuelle DOM-Struktur von Moodle (`mycampus-classic.iu.org`) und der Kaltura-Videogalerie (`videogallery.iu.org`). Änderungen an der Plattform können Anpassungen am Skript erforderlich machen.
* Updates werden automatisch über Tampermonkey bereitgestellt, sobald eine neue `@version` veröffentlicht wird.

## Haftungsausschluss

Dies ist ein inoffizielles Community-Skript von Studierenden für Studierende und steht in keiner offiziellen Verbindung zur IU Internationale Hochschule. Nutzung auf eigene Gefahr.
