# SMG

Small games — Malá herna

Responzivní SPA s menu her a dvěma samostatnými variantami: **2048 classic** a **2048 speedy**. Obě sdílejí pravidla slučování, ale speedy navíc obsahuje časový limit. Varianty mají oddělené rozehrané partie, rekordy a historii kroku zpět. Jedinou externí knihovnou je požadované **Vue 3.5.45**, uložené lokálně v `vendor/vue.global.prod.js`. Žádný správce balíčků, build, router ani UI knihovna nejsou potřeba. Použití Vue bez buildu a s lokální distribucí podporuje [oficiální dokumentace](https://vuejs.org/guide/quick-start#using-vue-from-cdn).

## Spuštění

Otevřete `index.html` v aktuálním Edge, Chrome, Firefoxu nebo Safari. Skripty jsou klasické, takže aplikace funguje i přímo z disku. Pro obvyklý vývoj a testování na telefonu doporučujeme adresář zpřístupnit statickým HTTP serverem (například již používaným lokálním serverem nebo IIS). Není potřeba nic sestavovat. Veškeré prostředky jsou lokální; po stažení projektu není potřeba připojení k internetu.

## Ovládání a chování

- Menu: `#/`. 2048 classic: `#/2048` (původní odkaz zůstává funkční). 2048 speedy: `#/2048-speedy`. Funguje historie prohlížeče i přímý odkaz.
- Počítač: šipky, WASD, případně kliknutí na směrová tlačítka. Při zaměření odkazu či tlačítka mají klávesy standardní význam; pro ovládání klávesami klikněte do herní plochy.
- Na stránce hry přepíná `Z` zvuk, `F` rozšířené zobrazení a `N` má stejný účinek jako tlačítko nové hry. Potvrzení „Začít znovu?“ lze přijmout dalším `N` nebo `Enterem`, zrušit `Backspace` či `Escape`. Držení klávesy neprovádí opakované přepínání ani nepotvrdí novou hru. Zkratky nezasahují do psaní do formulářů a úpravy textu ani do kombinací s modifikačními klávesami.
- Telefon a tablet: tah prstu po herní ploše nebo směrová tlačítka. Mimo plochu je zachováno posouvání stránky.
- Stejné kameny se slučují jednou za tah. Po platném tahu vznikne dvojka (90 %) nebo čtyřka (10 %). Neplatný tah nevytváří kámen.
- Kameny při tahu plynule přejíždějí na cílová políčka (160 ms). Po dojetí se slučované kameny změní na součet s krátkým zvětšením a objeví se nový kámen. Animace používají vestavěné Web Animations API a CSS, bez další knihovny. Během pohybu se pamatuje jeden další směr; krok zpět, nová hra a návrat do menu rozběhnutou animaci bezpečně zruší. Při systémové volbě omezeného pohybu se tahy zobrazují okamžitě.
- Skóre odpovídá součtu vzniklých kamenů. Lze vrátit jeden poslední tah; rekord se tím nesnižuje.
- Dosažení 2048 nabídne pokračování. Konec hry nastane, když není volné místo ani možnost sloučení.
- Partie, krok zpět i rekord se ukládají do `localStorage` daného prohlížeče a původu. Nedostupné úložiště nebrání hraní. Na `file://` se dostupnost úložiště řídí prohlížečem; pro spolehlivé ukládání používejte HTTP.
- Návrat do menu zachová rozehranou hru. Nahrazení rozehrané partie vyžaduje potvrzení přímo ve hře.
- Respektuje omezení animací systému, nabízí viditelné zaměření, popisy herní plochy a oznámení skóre pro čtečky obrazovky.

## Časomíra speedy

Nová hra speedy čeká se 2 sekundami; odpočet spustí až první platný tah. Neplatný pokus o pohyb jej nespustí. První platný tah stejně jako ostatní přidá 1 sekundu. Každý platný tah přičte 1 sekundu k aktuálnímu zbytku: například tah se zbytkem 0,75 s poskytne 1,75 s. Rezerva není omezena na jednu sekundu. Neplatné tahy čas nepřidávají. Pásek nad deskou ukazuje zbytek z rozpočtu posledního tahu, vedle něj je přesný počet sekund. Pod polovinou časové zásoby daného tahu je pásek žlutý; při 0,5 s nebo méně je červený.

Čas běží i během animace. Vypršení ukončí partii a zablokuje další tahy. V menu a v potvrzovacích či výsledkových oknech je čas pozastaven. Obnovení stránky zachová zbytek času, nová hra poskytne opět 2 sekundy. Krok zpět odebere i 1 sekundu získanou vraceným tahem a nevrací čas spotřebovaný přemýšlením. Classic zůstává bez limitu.

Samostatné testy výpočtu času lze spustit otevřením `tests/speedy-clock.html`. Časomíra používá monotónní `performance.now()` a nevyžaduje knihovnu.
## Rozšířené zobrazení

Tlačítko s ikonou roztažení mezi novou hrou a knížkou přepíná obě hry do zobrazení přes celé okno. Deska zůstává čtvercová a zvětšuje se podle místa zbývajícího pro skóre, časomíru a ovládání. Rozměry se přepočítají při změně okna i otočení telefonu. Hlavička a patička se skryjí; nápovědu lze otevřít knížkou jako panel. Stejné tlačítko, klávesa `F` nebo Escape mimo dialog vrátí běžné rozložení a původní viditelnost nápovědy. Partie i čas speedy zůstávají zachované a čas během přepínání běží dál.
## Zvuk

Na stránce hry je vpravo nahoře pod oddělovací čárou přepínač s ikonou reproduktoru; při vypnutí je reproduktor přeškrtnutý. Přístupný popis a nápověda uvádějí stav **Zvuk: ne / ano** (anglicky **Sound: off / on**). Při načtení stránky je vždy vypnutý. Posun doprovází krátké jemné šustění vytvořené filtrovaným šumem, sloučení jemný dvoutónový efekt po dojetí kamenů. Tah, při kterém se nic nepohne, doprovází odlišné krátké dvojité tlumené klepnutí. Vypnutí zvuku zastaví i právě přehrávané tóny.

Zvuky vytváří `js/audio.js` pomocí vestavěného Web Audio API; nejsou potřeba zvukové soubory, připojení k internetu ani další knihovna. Zvukové rozhraní se inicializuje až po ručním zapnutí. Pokud prohlížeč zvuk nepodporuje, přepínač je nedostupný a hra funguje dál.

## Jazyky a překlady

Na hlavní obrazovce lze přepnout **CS / EN / DE / ES / JA / AR** (čeština, angličtina, němčina, španělština, japonština a arabština). Na displejích do šířky 680 px je volba jazyka pod ikonou zeměkoule ve svislém seznamu s plnými názvy jazyků; na širších displejích zůstává řada zkratek. Seznam se zavře výběrem, kliknutím mimo, opuštěním klávesnicí nebo klávesou Escape. Výchozím jazykem je čeština; volba se ukládá do `localStorage` pod klíčem `little-arcade.language` a platí pro celou aplikaci. Partie a rekord původní hry classic používají klíče `little-arcade.2048.v1` a `little-arcade.2048.best`. Speedy používá samostatné klíče `little-arcade.2048-speedy.v1` a `little-arcade.2048-speedy.best`. Původní uložená data se automaticky převezmou, pokud nový klíč ještě neexistuje. Změna jazyka zachová rozehranou partii i rekord. Bez dostupného úložiště funguje přepnutí do zavření stránky.

Texty rozhraní jsou v `js/translations.js`, včetně názvu stránky, popisu pro vyhledávače, dialogů, přístupných popisů a oznámení pro čtečky. Všech šest slovníků obsahuje stejné základní klíče a parametry; arabština navíc obsahuje tvary pro nulu, dvojné číslo a další arabské množné číslo. Arabská verze používá rozhraní zprava doleva a arabské číslice v kamenech i skóre. Herní souřadnice a směrové ovládání zůstávají fyzicky stejné. Parametry jako `{count}` doplňuje funkce `t`; množné číslo a formát čísel zajišťují vestavěné `Intl.PluralRules` a `Intl.NumberFormat`. Další knihovna není potřeba. Statické upozornění v `noscript` je v HTML uvedené česky i anglicky, protože bez JavaScriptu nelze načíst překlady.

## Struktura

`index.html` obsahuje Vue šablonu a vstup aplikace, `styles.css` responzivní vzhled, `js/app.js` stav aplikace, ukládání a vstupy a `js/game2048.js` samostatnou herní logiku bez závislostí. Pro přidání další hry rozšiřte menu, obsluhu hash navigace a samostatnou herní komponentu či pohled.

## Testy

Otevřete `tests/index.html` v prohlížeči. Testy nepoužívají žádnou knihovnu. Ověřují všechny směry, pořadí slučování, bodování, neplatné tahy, konec hry, vznik nových kamenů, validaci desky a zachování součtu během 1000 tahů.

`tests/ui.html` ověřuje vykreslení Vue, rozměry menu i hry, klávesnici, tlačítka, krok zpět, potvrzení nové hry, obnovení partie a dialogy výhry a prohry. Tento test spouštějte přes stejný HTTP server jako aplikaci; pro automatizované ověření z disku byl Edge spuštěn s `--allow-file-access-from-files`. Test používá dočasné partie a po dokončení vrátí původní obsah úložiště. Používejte samostatný testovací profil prohlížeče.

Ověřeno v Edge bez okna: testy pravidel i rozhraní včetně drah pohybu, sloučení, navazujících tahů, přerušení animace, všech šesti jazyků, přepínání a uchování jazyka, dialogů, přístupných popisů a místního formátu čísel. Kontroly šířek 320, 390, 768 a 1440 px proběhly ve všech šesti jazycích bez vodorovného přetékání. Fyzické dotykové zařízení nebylo k dispozici.

Ruční kontrola rozhraní: šířky 320, 390, 768 a 1440 px, orientace na výšku i na šířku, gesta na skutečném dotykovém zařízení, navigace klávesou Tab, dialog nové hry, výhra, prohra, obnovení stránky a režim se zakázaným úložištěm.
