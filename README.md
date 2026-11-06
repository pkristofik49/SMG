# SMG

Small games — Little Arcade

[Czech version](README_CZ.md)

A responsive single-page application with a game menu and two independent variants: **2048 classic** and **2048 speedy**. Both share the same merging rules, but speedy adds a time limit. Each variant has its own saved game, best score, and undo history. The only external library is **Vue 3.5.45**, stored locally in `vendor/vue.global.prod.js`. No package manager, build step, router, or UI library is required. Using Vue without a build step and serving its distribution locally is supported by the [official documentation](https://vuejs.org/guide/quick-start#using-vue-from-cdn).

## Running the application

Open `index.html` in a current version of Edge, Chrome, Firefox, or Safari. The application uses classic scripts and also works directly from disk. For regular development and testing on a phone, serve the directory through a static HTTP server, such as an existing local server or IIS. There is nothing to build. All assets are local, so an internet connection is not required after downloading the project.

## Controls and behavior

- Menu: `#/`. 2048 classic: `#/2048` (the original link remains supported). 2048 speedy: `#/2048-speedy`. Browser history and direct links are supported.
- Desktop: use the arrow keys, WASD, or the direction buttons. When a link or button has focus, navigation keys retain their normal behavior; click the board to control it with the keyboard.
- On the game page, `Z` toggles sound, `F` toggles expanded view, `H` toggles help, and `N` performs the same action as the new-game button. Confirm “Start again?” with another `N` or `Enter`, or cancel with `Backspace` or `Escape`. Holding a shortcut key does not repeatedly toggle a setting or confirm a new game. Shortcuts do not interfere with typing, text editing, or modified key combinations.
- Phone and tablet: swipe on the board or use the direction buttons. The rest of the page remains scrollable.
- Matching tiles merge once per move. Each valid move spawns a two (90%) or a four (10%). Invalid moves do not spawn tiles.
- Tiles slide to their destinations over 160 ms. After landing, merged tiles display their sum with a brief pop effect, and a new tile appears. Animations use the built-in Web Animations API and CSS without another library. One additional direction can be queued during movement; undo, a new game, and returning to the menu safely cancel an active animation. Moves appear immediately when the system requests reduced motion.
- The score is the sum of the values created by merging. The last move can be undone once; doing so does not lower the best score.
- Reaching 2048 offers the option to continue. The game ends when there are no empty cells and no possible merges.
- The game, undo state, and best score are saved in the browser's `localStorage`, scoped to its origin. Unavailable storage does not prevent playing. Storage behavior for `file://` depends on the browser; use HTTP for reliable persistence.
- Returning to the menu preserves progress. Replacing an ongoing game requires confirmation inside the game.
- The interface respects reduced-motion preferences and provides visible focus indicators, board descriptions, and score announcements for screen readers.

## Speedy countdown

A new speedy game waits with 2 seconds; the countdown starts only after the first valid move. An invalid movement attempt does not start it. The first valid move adds 1 second, just like every subsequent valid move. Each valid move adds 1 second to the current remainder: for example, a move with 0.75 s left provides 1.75 s. The reserve is not capped at one second. Invalid moves add no time. The bar above the board shows the remaining fraction of the latest turn's time budget, alongside the number of seconds left. It turns yellow below half that budget, and red at 0.5 s or less.

Time continues to run during animations. Expiration ends the game and blocks further moves. The clock pauses in the menu and in confirmation or result dialogs. Reloading preserves the remaining time; a new game provides 2 seconds again. Undo also removes the 1-second bonus earned by the reverted move and does not refund time spent thinking. Classic has no time limit.

Open `tests/speedy-clock.html` to run the standalone clock tests. The clock uses monotonic `performance.now()` and requires no library.

## Expanded view

The expand icon between the new-game button and the book switches either game to a view that fills the window. Both entering and leaving expanded view animate board position and size over 280 ms, with a gentle fade of the score heading. The effect works with the button and `F`. Rapid toggles cancel the previous transition; a new move settles it before tile coordinates are read. Reduced-motion preferences make the switch immediate. The board remains square and grows to fit the space available after accounting for the score, timer, and controls. Its dimensions are recalculated when the window changes size or a phone rotates. The header and footer are hidden; the book can open help as a floating panel. During the current page session, each game remembers its view mode and help visibility when returning to the menu, and restores them when reopened. The menu always uses its normal layout. The same button, `F`, or `Escape` outside a dialog restores the normal layout and the previous help visibility. Showing and hiding help fades and slides the panel over 280 ms, while the game moves smoothly between its normal position and the centre. The same effect works with the book button and `H`, including the floating panel in expanded view. On mobile screens up to 680 px wide, help also floats above the board in normal view without moving or resizing it. The panel opens below the book button, scrolls within the available height, and has a close button. Rapid toggling safely cancels the previous animation; reduced-motion preferences make the change immediate. Game progress and the speedy clock are preserved, and the clock keeps running while switching views.

## Sound

The speaker button is at the top right of the game page, below the dividing line; its icon is crossed out when muted. The accessible description and tooltip report **Sound: off / on**. Sound is always off when the page loads. Sliding plays a short, soft filtered-noise sound; merging plays a gentle two-note effect after the tiles land. A movement attempt that changes nothing plays a distinct, short, muted double tap. Muting also stops notes that are already playing.

`js/audio.js` generates effects using the built-in Web Audio API. No audio files, internet access, or extra library are needed. The audio context is initialized only after the user enables sound. If the browser does not support audio, the toggle is disabled and the game remains playable.

## Languages and translations

The header offers **CS / EN / DE / ES / JA / AR**: Czech, English, German, Spanish, Japanese, and Arabic. At widths up to 680 px, a globe icon opens a vertical list of full language names; wider screens retain the row of abbreviations. The list closes after selection, an outside click, moving keyboard focus outside, or pressing Escape. Czech is the default language. The selection is stored in `localStorage` under `little-arcade.language` and applies throughout the application. Classic saves its game and best score under `little-arcade.2048.v1` and `little-arcade.2048.best`. Speedy uses separate keys: `little-arcade.2048-speedy.v1` and `little-arcade.2048-speedy.best`. Historical saved data is adopted automatically when the corresponding new key does not exist. Changing language preserves progress and records. Without storage, the selection lasts until the page is closed.

Interface copy lives in `js/translations.js`, including page titles, search descriptions, dialogs, accessible labels, and screen-reader announcements. All six dictionaries contain the same base keys and placeholders; Arabic additionally defines zero, dual, and other Arabic plural forms. Arabic uses a right-to-left interface and Arabic-Indic digits for tiles and scores. Board coordinates and physical direction controls remain unchanged. The `t` function inserts placeholders such as `{count}`; the built-in `Intl.PluralRules` and `Intl.NumberFormat` handle plural forms and number formatting. No additional library is required. The static `noscript` notice is provided in both Czech and English in the HTML, because translations cannot be loaded without JavaScript.

## Project structure

`index.html` contains the Vue template and application entry point, `styles.css` provides responsive styling, `js/app.js` manages application state, storage, and input, and `js/game2048.js` contains framework-independent game rules. To add another game, extend the menu, hash navigation, and a separate game component or view.

## Tests

Open `tests/index.html` in a browser. The tests require no library. They cover all movement directions, merge ordering, scoring, invalid moves, game-over detection, spawning, board validation, and conservation of the tile sum across 1,000 moves.

`tests/ui.html` checks Vue rendering, menu and board dimensions, keyboard controls, buttons, undo, new-game confirmation, restoration, and win/loss dialogs. Run it through the same HTTP server as the application; automated verification from disk used Edge with `--allow-file-access-from-files`. The tests use temporary games and restore the original storage contents on completion. Use a separate browser testing profile.

Verified in headless Edge: game rules and interface behavior, including movement paths, merging, queued moves, animation cancellation, all six languages, switching and remembering language, dialogs, accessible descriptions, and localized number formatting. Widths of 320, 390, 768, and 1440 px were checked in all six languages without horizontal overflow. A physical touch device was not available.

Manual interface checks: widths of 320, 390, 768, and 1440 px; portrait and landscape orientation; gestures on a physical touch device; Tab navigation; new-game confirmation; winning; losing; reloading; and unavailable browser storage.

## Documentation maintenance

Keep `README.md` in English and `README_CZ.md` in Czech. Whenever either version changes, update the matching content in the other version in the same change. Features, behavior, commands, examples, links, and technical details must stay consistent. This rule is also recorded in `AGENTS.md`.
