# Test record

## Automated scope

Local Windows result: **14/14 tests passed**; built-in validation passed; unsigned ZIP built and independently checked with Python's zipfile CRC/integrity validation (7 extension files). Nix evaluation, Mozilla lint and real-account/browser acceptance remain unverified.

`npm test` exercises mocked Firefox APIs: independent container IDs, tab reuse, active-container reporting, restart of manager logic against existing metadata, duplicate/invalid labels, concurrent additions, ownership checks, missing-container recovery, metadata-write rollback, navigation failures, rename persistence, deletion ordering/failures, and untrusted message rejection. DOM tests cover manager interactions and content-menu behavior. These are not real browser authentication tests.

`npm run lint` checks JavaScript syntax, manifest paths, permission scope and static HTML safety. `npm run build` packages the extension using a dependency-free ZIP writer. `npm run lint:mozilla` invokes Mozilla's web-ext linter but could not run here because npm registry DNS access failed. UI tests use a minimal DOM adapter for event/state behavior, not a real rendering engine. Profile-menu insertion has not been live-tested.

## Required live acceptance matrix (not yet verified)

Use two test accounts you own; never commit screenshots containing account details, browser profiles, cookies, or logs with auth URLs.

- [ ] On Windows, load extension and create Personal; complete Claude's official login.
- [ ] Create Work; confirm Claude prompts for independent login and shows a different account.
- [ ] Switch repeatedly; confirm each account's own profile and conversations, with no cross-account state.
- [ ] Close/reopen tabs; confirm sessions remain separate.
- [ ] Using a signed build, restart Firefox; confirm metadata and both sessions persist when cookie policy permits.
- [ ] Log out from Personal using Claude; verify Work remains signed in and Personal requires login.
- [ ] Expire/revoke a test session via Claude's supported controls; verify normal reauthentication.
- [ ] Test Google/SSO or email-link sign-in where enabled; verify redirects remain in the right container.
- [ ] Rename, cancel removal, then remove a disposable space; verify only its tabs/data disappear.
- [ ] Verify English profile-menu insertion against the current Claude UI; verify toolbar fallback in other locales.
- [ ] Check offline navigation, disabled containers, and enterprise restrictions produce recoverable errors.
- [ ] Repeat on macOS and Linux Firefox; test keyboard-only navigation, dark mode, and reduced motion.

No account credentials were supplied to this build session. Live authentication, logout, expiry and cross-OS claims must remain unverified until the above checks pass.
