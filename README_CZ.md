# SMG

Small games — Malá herna

[English version](README.md)

Responzivní SPA s menu her a třemi samostatnými variantami: **2048 classic**, **2048 speedy** a **2048 extended**. Všechny sdílejí pravidla slučování. Classic a speedy mají desku 4 × 4; speedy přidává časový limit. Extended vychází z Classic s větší deskou 5 × 5 a bez časového limitu. Varianty mají oddělené rozehrané partie, rekordy a historii kroku zpět. Jedinou externí knihovnou je požadované **Vue 3.5.45**, uložené lokálně v `vendor/vue.global.prod.js`. Žádný správce balíčků, build, router ani UI knihovna nejsou potřeba. Použití Vue bez buildu a s lokální distribucí podporuje [oficiální dokumentace](https://vuejs.org/guide/quick-start#using-vue-from-cdn).

## Spuštění

Otevřete `index.html` v aktuálním Edge, Chrome, Firefoxu nebo Safari. Skripty jsou klasické, takže aplikace funguje i přímo z disku. Pro obvyklý vývoj a testování na telefonu doporučujeme adresář zpřístupnit statickým HTTP serverem (například již používaným lokálním serverem nebo IIS). Není potřeba nic sestavovat. Veškeré prostředky jsou lokální; po stažení projektu není potřeba připojení k internetu.

## Instalace PWA a hraní offline

Otevřete [Malou hernu](https://pkristofik49.github.io/SMG/) online v Edge nebo Chromu. Použijte tlačítko instalace aplikace v prohlížeči nebo odpovídající volbu v jeho menu. Na podporovaných zařízeních včetně Windows a Androidu se aplikace otevře ve vlastním okně. Není potřeba APK, obchod s aplikacemi, další JavaScriptová knihovna ani sestavení projektu.

První úplné načtení online stáhne soubory aplikace. Po dokončení instalace service workeru fungují všechny tři hry, překlady, palety i generované zvuky offline, také po zavření a opětovném otevření aplikace. Partie a nastavení zůstávají v místním úložišti. Vymazání dat webu nebo uvolnění úložiště prohlížečem může odstranit offline soubory i uložená data; pro obnovení offline souborů otevřete aplikaci znovu online. Pro ukládání offline souborů není samotná instalace PWA nutná.

`manifest.webmanifest` definuje název aplikace, samostatné okno a relativní startovací URL, ID a rozsah. Relativní cesty podporují nasazení GitHub Pages pod `/SMG/` i kořen místního serveru. V `icons/` jsou PNG ikony 192 a 512 px, přizpůsobitelná ikona 512 px a ikona Apple touch 180 px podle stávající značky. `js/pwa.js` po načtení stránky registruje `sw.js`. Service worker vyžaduje v produkci HTTPS nebo při vývoji localhost; při otevření `index.html` přímo z disku hra dál funguje, ale offline podpora se neinstaluje.

`sw.js` předem uloží celou verzi a soubory aplikace načítá z této cache. Nová verze se instaluje na pozadí a čeká, dokud se nezavřou všechna okna aplikace a karty prohlížeče používající starou verzi. Při dalším otevření se použije nová verze; během hry nedochází k vynucenému obnovení. Neúplné stažení instalaci přeruší a zachová funkční verzi. Úklid odstraňuje jen staré cache této aplikace v jejím rozsahu a nemění místní úložiště. Po obnovení připojení nebo návratu do viditelné aplikace registrace ověří aktualizace.

Každý commit aktualizuje `RELEASE` v `sw.js` podle verze aplikace a vytvoří tak úplnou novou offline cache. Nové offline soubory přidejte do `SHELL`. Verze neopakujte a během rozehrané hry nevynucujte aktivaci přes `skipWaiting()`. Pravidlo údržby je uvedeno také v `AGENTS.md`.

## Verze aplikace

Společná patička hlavního menu a stránek všech tří her obsahuje jen **SMG**, verzi aplikace a krátké ID commitu, například **SMG · 1.005 · c711792**. Verze pochází z `js/version.js`; GitHub Pages při publikování doplní přesný hash zdrojového commitu do `commit.json` a aplikace zobrazí jeho prvních sedm znaků. Metadata se ukládají do cache spolu se stejnou verzí PWA i pro offline použití. Pokud metadata chybějí, nejsou zpracovaná nebo patří jiné verzi, zobrazí se jen verze. Číslování verzí začíná na **1.000**. Každý další commit ji zvýší o **0.001**: 1.001, 1.002 a dále (po 1.999 následuje 2.000). Patička používá ve všech jazycích stejný stručný formát se třemi číslicemi za tečkou ve verzi.

Po naklonování zapněte verzovaný hook příkazem `git config core.hooksPath .githooks`. Hook používá Windows PowerShell, odvodí další verzi z uloženého HEAD a připraví ke commitu `js/version.js`, odpovídající verzi v `sw.js` a verzi v `commit.json`. Případné úpravy těchto souborů nejprve připravte ke commitu; jinak se hook zastaví, aby nepřidal nesouvisející práci. Neúspěšný commit lze opakovat bez přeskočení čísla. V této pracovní kopii už je hook zapnutý. Commity přes webové rozhraní GitHubu nebo z jiné kopie bez hooku vyžadují stejnou aktualizaci verze ručně. Příkaz `.\tests\versioning.ps1` ověří první číslo, zvyšování a opakování odmítnutého commitu v odděleném dočasném repozitáři.

GitHub Pages zpracuje šablonu `commit.json` vestavěným Jekyllem s pluginem `jekyll-github-metadata` nastaveným v `_config.yml`. HTML, CSS a JavaScript aplikace zůstávají statické soubory. Pro místní HTTP náhled s aktuálním hashem Gitu použijte `tests/serve-pwa.ps1`; jeho metadata doplňuje `git rev-parse HEAD`. Při otevření přímo z disku nebo na obecném statickém serveru hra funguje bez zobrazení ID commitu. Není potřeba další knihovna do prohlížeče.

## Ovládání a chování

- Menu: `#/`. 2048 classic: `#/2048` (původní odkaz zůstává funkční). 2048 speedy: `#/2048-speedy`. 2048 extended: `#/2048-extended`. Funguje historie prohlížeče i přímý odkaz.
- Počítač: šipky, WASD, případně kliknutí na směrová tlačítka. Při zaměření odkazu či tlačítka mají klávesy standardní význam; pro ovládání klávesami klikněte do herní plochy.
- `Z` přepíná globální zvuk v menu i ve hrách. Na stránce hry přepíná `F` rozšířené zobrazení, `H` nápovědu a `N` má stejný účinek jako tlačítko nové hry. Potvrzení „Začít znovu?“ lze přijmout dalším `N` nebo `Enterem`, zrušit `Backspace` či `Escape`. Držení klávesy neprovádí opakované přepínání ani nepotvrdí novou hru. Zkratky nezasahují do psaní do formulářů a úpravy textu ani do kombinací s modifikačními klávesami.
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

Tlačítko s ikonou roztažení mezi novou hrou a knížkou přepíná všechny tři hry do zobrazení přes celé okno. Zapnutí i vypnutí rozšířeného režimu doprovází animace polohy a velikosti desky během 280 ms a jemné zeslabení údajů o skóre. Funguje tlačítkem i `F`. Rychlé přepnutí zruší předchozí přechod; nový tah jej dokončí před načtením souřadnic kamenů. Při systémově omezeném pohybu je přepnutí okamžité. Deska zůstává čtvercová a zvětšuje se podle místa zbývajícího pro skóre, časomíru a ovládání. Rozměry se přepočítají při změně okna i otočení telefonu. Na mobilu se všech sedm herních a globálních tlačítek vejde do jednoho řádku s menšími mezerami. Pod šířkou 356 px mají tlačítka dotykovou plochu 40 px; na širších mobilních displejích zůstává 44 px. Značka a patička se skryjí; globální ovládání jazyka, palety a zvuku zůstává dostupné a nápovědu lze otevřít knížkou jako panel. Každá hra ukládá režim zobrazení, viditelnost nápovědy i původní stav nápovědy v běžném zobrazení do `little-arcade.views`. Změny se ukládají okamžitě a obnoví se po návratu z menu, obnovení stránky i opětovném otevření aplikace. Menu vždy používá běžné rozložení. Stejné tlačítko, klávesa `F` nebo Escape mimo dialog vrátí běžné rozložení a původní viditelnost nápovědy. Zobrazení i skrytí nápovědy doprovází postupné zeslabení a posun panelu během 280 ms a plynulý přesun hry mezi běžnou pozicí a středem. Animace funguje přes knížku i `H`, také u plovoucího panelu v rozšířeném zobrazení. Na mobilních displejích do šířky 680 px nápověda pluje nad deskou také v běžném zobrazení, aniž by ji posouvala nebo měnila její velikost. Panel se otevírá pod knížkou, podle dostupné výšky umožňuje posouvání obsahu a má zavírací tlačítko. Rychlé přepínání bezpečně zruší předchozí animaci; při systémově omezeném pohybu proběhne změna okamžitě. Partie i čas speedy zůstávají zachované a čas během přepínání běží dál.

## Barevné palety

Ikona palety vedle zeměkoule nabízí světlou, tmavou, původní zelenou (výchozí), červenou a modrou. V každé paletě má každá hodnota kamene od 2 do 2048 vlastní barvu pozadí, také při pohybu a v náhledech her v menu. Volba platí pro menu, všechny tři hry, jejich kameny i dialogy a ukládá se pod klíčem `little-arcade.palette`. Bez úložiště platí do obnovení stránky. Animovaný seznam podporuje šipky nahoru a dolů, Enter, Escape, kliknutí mimo i odchod zaměření klávesnicí. Otevření seznamu jazyků zavře palety a naopak. Globální ovládání zůstává dostupné v rozšířeném zobrazení.

## Zvuk

Přepínač s ikonou reproduktoru je v hlavičce vedle zeměkoule, také v hlavním menu. Ovládá zvuk společně pro všechny tři hry a při přechodu mezi nimi si zachovává nastavení. Všechna globální tlačítka zůstávají dostupná i v rozšířeném zobrazení. Při vypnutí je reproduktor přeškrtnutý. Přístupný popis a nápověda uvádějí stav **Zvuk: ne / ano** (anglicky **Sound: off / on**). Dokud uživatel neprovede volbu, je zvuk vypnutý. Globální volba se ukládá do `little-arcade.sound` a obnoví se při opětovném otevření aplikace. Obnovení zapnutého zvuku nevytváří zvukový kontext během načítání; první interakce myší, dotykem nebo klávesnicí jej inicializuje či obnoví podle omezení automatického přehrávání v prohlížeči. Dočasně zablokovaný zvukový kontext uloženou volbu nemaže. Posun doprovází tiché hladké šustnutí vytvořené vyhlazeným šumem s dolní propustí a pozvolným náběhem, sloučení jemný dvoutónový efekt po dojetí kamenů. Tah, při kterém se nic nepohne, doprovází odlišné dvojité klepnutí s delšími a vyššími tóny, které jsou lépe slyšitelné na reproduktorech telefonu. Tóny sloučení a neplatného tahu mají vyšší zesílení a před zeslabením krátce drží svou hlasitost, zatímco zvuk posunu je tišší. Vypnutí zvuku zastaví i právě přehrávané tóny.

Zvuky vytváří `js/audio.js` pomocí vestavěného Web Audio API; nejsou potřeba zvukové soubory, připojení k internetu ani další knihovna. Zvukové rozhraní se inicializuje po ručním zapnutí nebo při první interakci po obnovení uložené volby zapnutého zvuku. Pokud prohlížeč zvuk nepodporuje, přepínač je nedostupný a hra funguje dál.

## Jazyky a překlady

Na hlavní obrazovce lze přepnout **CS / EN / DE / ES / JA / AR** (čeština, angličtina, němčina, španělština, japonština a arabština). Na všech velikostech displeje otevře ikona zeměkoule nebo `L` svislý seznam s plnými názvy jazyků a zaměřeným aktuálním jazykem. Šipkami nahoru a dolů se lze přesouvat mezi položkami (na koncích seznamu dokola), Enter výběr potvrdí. Samotný přesun zaměření jazyk nemění. Další `L` nebo Escape výběr zruší a vrátí zaměření na zeměkouli. Tooltip zeměkoule uvádí zkratku `L`. Seznam se zavře výběrem, kliknutím mimo, opuštěním klávesnicí nebo klávesou Escape. Otevření i zavření doprovází jemná změna průhlednosti a svislý posun během 180 ms. Zavírání ihned znemožní ovládání seznamu; rychlé přepínání zruší předchozí animaci. Při systémově omezeném pohybu je změna okamžitá. Výchozím jazykem je čeština; volba se ukládá do `localStorage` pod klíčem `little-arcade.language` a platí pro celou aplikaci. Partie a rekord původní hry classic používají klíče `little-arcade.2048.v1` a `little-arcade.2048.best`. Speedy používá samostatné klíče `little-arcade.2048-speedy.v1` a `little-arcade.2048-speedy.best`. Extended používá `little-arcade.2048-extended.v1` a `little-arcade.2048-extended.best` s vlastním krokem zpět a nastavením zobrazení. Jeho karta nahradila jednu připravovanou hru a menu si zachovává čtyři karty. Původní uložená data se automaticky převezmou, pokud nový klíč ještě neexistuje. Změna jazyka zachová rozehranou partii i rekord. Bez dostupného úložiště funguje přepnutí do zavření stránky.

Texty rozhraní jsou v `js/translations.js`, včetně názvu stránky, popisu pro vyhledávače, dialogů, přístupných popisů a oznámení pro čtečky. Všech šest slovníků obsahuje stejné základní klíče a parametry; arabština navíc obsahuje tvary pro nulu, dvojné číslo a další arabské množné číslo. Arabská verze používá rozhraní zprava doleva a arabské číslice v kamenech i skóre. Herní souřadnice a směrové ovládání zůstávají fyzicky stejné. Parametry jako `{count}` doplňuje funkce `t`; množné číslo a formát čísel zajišťují vestavěné `Intl.PluralRules` a `Intl.NumberFormat`. Další knihovna není potřeba. Statické upozornění v `noscript` je v HTML uvedené česky i anglicky, protože bez JavaScriptu nelze načíst překlady.

## Struktura

`index.html` obsahuje Vue šablonu a vstup aplikace, `styles.css` a palety v `themes.css` responzivní vzhled, `js/app.js` stav aplikace, ukládání a vstupy a `js/game2048.js` samostatnou herní logiku bez závislostí. Pro přidání další hry rozšiřte menu, obsluhu hash navigace a samostatnou herní komponentu či pohled.

## Testy

Otevřete `tests/index.html` v prohlížeči. Testy nepoužívají žádnou knihovnu. Ověřují všechny směry, pořadí slučování, bodování, neplatné tahy, konec hry, vznik nových kamenů, validaci desky a zachování součtu během 1000 tahů.

`tests/ui.html` ověřuje vykreslení Vue, rozměry menu i hry, klávesnici, tlačítka, krok zpět, potvrzení nové hry, obnovení partie a dialogy výhry a prohry. Tento test spouštějte přes stejný HTTP server jako aplikaci; pro automatizované ověření z disku byl Edge spuštěn s `--allow-file-access-from-files`. Test používá dočasné partie a po dokončení vrátí původní obsah úložiště. Používejte samostatný testovací profil prohlížeče.

Ověřeno v Edge bez okna: testy pravidel i rozhraní včetně drah pohybu, sloučení, navazujících tahů, přerušení animace, všech šesti jazyků, přepínání a uchování jazyka, dialogů, přístupných popisů a místního formátu čísel. Kontroly šířek 320, 390, 768 a 1440 px proběhly ve všech šesti jazycích bez vodorovného přetékání. Fyzické dotykové zařízení nebylo k dispozici.

Ruční kontrola rozhraní: šířky 320, 390, 768 a 1440 px, orientace na výšku i na šířku, gesta na skutečném dotykovém zařízení, navigace klávesou Tab, dialog nové hry, výhra, prohra, obnovení stránky a režim se zakázaným úložištěm.

## Integrační testy PWA

Na Windows spusťte v kořeni projektu v jednom terminálu `powershell -NoProfile -File .\tests\serve-pwa.ps1` a ve druhém `.\tests\run-pwa.ps1`. Server používá `http://localhost:8765/SMG/`; testovací skript otevře Edge bez okna v novém odděleném profilu a v reálném čase přečte výsledek z `tests/pwa.html`. Po dokončení zastavte testovací server pomocí Ctrl+C. Skripty používají Windows PowerShell a nainstalovaný Edge bez dalších závislostí.

Testy kontrolují manifest a uložené soubory, navigaci a hraní při odpovědích serveru 503, obnovení jazyka a palety, čekající úplnou aktualizaci, neúplnou neúspěšnou aktualizaci a zachování cizích cache. Ovládací adresy serveru slouží jen místním testům a nejsou funkcemi aplikace. Testy PWA záměrně používají oddělený profil a dočasná místní data. Vlastní instalační rozhraní prohlížeče a instalaci na fyzickém zařízení je ještě nutné ověřit ručně.

## Údržba dokumentace

Soubor `README.md` udržujte v angličtině a `README_CZ.md` v češtině. Při změně kterékoli verze aktualizujte odpovídající obsah druhé ve stejné změně. Funkce, chování, příkazy, příklady, odkazy a technické údaje musí zůstat shodné. Pravidlo je zapsané také v `AGENTS.md`.
