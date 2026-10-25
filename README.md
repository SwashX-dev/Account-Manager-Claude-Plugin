# Claude Account Manager

A warm, lightweight account switcher for **Claude on the web**, using Firefox's isolated account containers. Unofficial; not affiliated with Anthropic.

**Important: this does not add account switching to the installed Claude Desktop app.** It is the supported-browser alternative: no app patching, session copying, private authentication API, or impersonated OAuth client. Your existing desktop installation stays untouched.

## What works

- Add named account spaces, sign into each on the official Claude website, and reopen them without logging out of the others.
- Switch to an existing Claude tab or open a new one in the correct container.
- Rename and remove spaces, with confirmation before closing tabs and removing container data.
- Account Manager toolbar popup, an always-available button on Claude pages, and a best-effort entry in English-language profile menus containing a visible Log out / Sign out item.
- Light and dark themes, keyboard focus, accessible status messages, and reduced-motion support.
- Windows, macOS, and Linux through Firefox desktop. Not Chrome, Edge, Safari, mobile Firefox, or Claude Desktop.

## Installation (development build)

1. Install [Firefox desktop](https://www.mozilla.org/firefox/) on your OS.
2. Download/extract this repository or clone your published copy.
3. Open `about:debugging#/runtime/this-firefox` in Firefox.
4. Click **Load Temporary Add-on…**, then select `extension/manifest.json`.
5. Open the extension from Firefox's extensions button. Pin it to the toolbar if desired.
6. Enter a label such as **Personal** and click **Add & sign in**. Complete the normal Claude login inside the new container tab.
7. Repeat for your other account. Choose **Open / switch** to use it.

Temporary add-ons are unloaded when Firefox restarts. **This is not a permanent installation.** For reliable everyday use, obtain a signed unlisted build using the release steps below. Do not depend on a temporary installation to preserve extension metadata through uninstall/reload cycles. Browser containers may remain after uninstall, so inspect Firefox's container settings before deleting anything.

## Permanent installation / distribution

Firefox release builds require Mozilla signing. There is no signed release included here, and security settings must not be disabled to install this project.

Maintainer steps:

```sh
npm ci
npm test
npm run lint
npm run build
```

Submit the resulting ZIP in `dist/` to [Mozilla Add-on Developer Hub](https://addons.mozilla.org/developers/) as an **unlisted, self-distributed** extension. Complete Mozilla's current review and data collection declarations accurately: the extension collects/transmits no data itself; Claude's website handles its own service traffic. Install the signed XPI returned by Mozilla via Firefox → Add-ons and themes → gear menu → Install Add-on From File. Keep the manifest extension ID stable for updates. Never commit signing keys or Firefox profiles.

## Authentication and persistence

Firefox owns the separate cookie stores; Claude owns sign-in, OAuth/SSO where offered, session renewal, and expiry. Complete login directly at `https://claude.ai` and its legitimate identity provider. This extension is **not an OAuth client**, does not extract cookies, inspect passwords, read tokens, intercept requests, or implement refresh-token exchanges.

Firefox retains each container's website state subject to browser policy. Clearing site data, private browsing, session-only cookie settings, expiry, or server-side revocation may require sign-in again. Private windows are not supported. For email magic links, open the link in the intended container; opening it from another browser or container can break the login flow. Never paste tokens into this extension. If a provider or enterprise policy prevents container login, use the provider's supported route; there is no bypass.

**Current space** refers to the container of the active tab, not proof of the signed-in identity. Labels are user-defined. Check Claude's own profile before sending sensitive work. The full-page manager itself is outside account containers and may therefore show no current space; use the toolbar popup from a Claude tab to see that tab's space.

## Logout and removal

- **Logout:** open the relevant space and use **Claude's profile → Log out**. The manager intentionally does not call an undocumented logout endpoint or simulate session revocation. The space remains available for signing in again.
- **Remove:** removes the manager's space, closes **all** tabs in that container (including non-Claude tabs), and asks Firefox to remove its container data. Unsaved work may be lost. This does not delete the Claude account or revoke other devices' sessions. Use Claude's security controls for server-side revocation.
- Keep these dedicated containers for Claude. Do not reuse them for unrelated browsing.

## Security model

Extension storage contains only account labels and Firefox container IDs. Labels may be sensitive; do not use secrets as labels. Firefox's normal profile storage is not a separate encrypted vault; use OS account security and disk encryption. Someone who can access your unlocked Firefox profile may access your sessions. Containers separate website storage, not network identity, browser fingerprinting, malware, or other privileged extensions.

Permissions: `contextualIdentities` creates/manages containers; `cookies` is required by Firefox for container API access (no cookie-reading code exists); `storage` saves labels/IDs; `https://claude.ai/*` permits the UI button and identifying Claude tabs. No broad all-sites permission, remote code, analytics, native messaging, clipboard access, token export, or credential backups.

Only the manager extension page can enumerate or mutate accounts. The Claude content script can only request that the manager opens. Account changes are serialized to avoid rapid-click races. Deletion is restricted to IDs already in this extension's metadata. No automatic switching based on usage limits is implemented.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| No profile-menu entry | Use the floating Account Manager button or Firefox toolbar. Claude's private DOM/localization can change. |
| Asked to sign in again | Sign in normally in that same space. Check cookie retention and enterprise policy. |
| Wrong account | Verify Claude's profile, log out in that container, then log into the intended account. Renaming does not change identity. |
| Container missing | It was removed outside the extension. Remove the stale entry and create a new space. |
| Containers unavailable | Use regular desktop Firefox with containers enabled; managed/private configurations may block them. |
| Storage error | Resolve disk/profile policy problems and retry. Do not delete your Firefox profile. |
| Login link opens in another account | Open the link in the intended Firefox container using Firefox's container UI. |

## Development and tests

Node.js 22+ is recommended. Runtime, tests, validation and packaging have no npm dependencies. The optional Mozilla linter requires network access.

```sh
npm ci
npm test
npm run lint
npm run build
```

See [docs/TESTING.md](docs/TESTING.md) for what was actually verified and what requires real accounts and OS testing. Automated mocks validate logic, **not successful authentication**. Do not call a release production-ready until the live matrix passes.

For official Mozilla validation, run `npm run lint:mozilla` with npm registry access. The built-in `lint` command checks syntax, manifest paths and permission scope; it does not replace Mozilla review.

## Nix alternative

Run `nix flake lock`, then `nix develop` for the development shell or `nix build` for the unsigned extension bundle. See [docs/NIX.md](docs/NIX.md) for Linux/macOS setup, output paths, signing requirements and the unverified Nix build status.

## GitHub repository

Project repository: [SwashX-dev/Account-Manager-Claude-Plugin](https://github.com/SwashX-dev/Account-Manager-Claude-Plugin). The user created this separate repository during development; its initial README was inspected before adding project files. No unrelated project is used.

For a separate copy, sign into the official [GitHub CLI](https://cli.github.com/) as the intended owner and choose a new unused repository name:

```sh
gh auth login
gh api user --jq .login
# Verify the output is SwashX-dev before continuing.
gh repo create SwashX-dev/claude-account-manager --private --source=. --remote=origin --push
```

`gh repo create` fails if the repository already exists. Do not reuse or force-push an existing repository. Choose a fresh name if necessary. Make the new repository public later only if desired.

## Architecture and decision record

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). MIT licensed; see [LICENSE](LICENSE).
