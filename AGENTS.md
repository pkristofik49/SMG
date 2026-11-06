# Project instructions

- Keep code identifiers, comments, and test descriptions in English. Localized application text belongs in `js/translations.js` and is exempt from this rule.
- Keep `README.md` in English and `README_CZ.md` in Czech.
- Whenever either README changes, update the corresponding content in the other README in the same change. Keep features, behavior, commands, examples, links, and technical details consistent between both versions.
- Include both README files in documentation commits when their shared content changes.
- Display the application version from `js/version.js` in the main-menu footer, starting at `1.000` and increasing by `0.001` per commit. Keep `RELEASE` in `sw.js` identical to this version.
- Enable the tracked pre-commit hook with `git config core.hooksPath .githooks`. It derives the next version from HEAD and stages only the version file and service worker. Do not skip the hook; stage any service-worker edits before committing. When hooks are unavailable, perform the same version increment manually in the commit.
