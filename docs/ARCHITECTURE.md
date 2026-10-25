# Implementation decision — 2026-10-24

## Inspection evidence

Read-only inspection found Windows application aliases in `Microsoft/WindowsApps/Claude_pzs8sxrjxfjjc` including `claude-desktop.exe`, and local `Claude`, `Claude-3p`, and `Claude-Data` directories. No credentials or session databases were read. Package enumeration with Get-AppxPackage was denied by the execution sandbox. A desktop version and application internals could not be verified. No installed files were modified.

Anthropic's published Desktop Extensions documentation describes packaged local MCP servers, not a supported profile-menu or authentication-session replacement API. No documented desktop account-switch integration was established. This is a limitation of the available evidence, not proof that no future API could exist.

## Choice

Use Firefox's documented contextualIdentities and container-tab APIs. This preserves normal browser sign-in and isolates website state without copying secrets. It also avoids Electron embedded-login compatibility issues and platform-specific manipulation of a packaged app. The tradeoff is that this operates on Claude web, not desktop-only features such as local MCP or desktop workflows.

## Components

- core.js: serialized container ownership, metadata, navigation, rename/removal.
- background.js: privileged message boundary. Website content scripts can open only the manager.
- manager.html/css/js: extension-owned UI with no remotely loaded resources.
- content.js: narrowly scoped Claude UI enhancement. Menu augmentation is optional and heuristic; toolbar and floating-button access remain available.

No OAuth client registration, undocumented auth endpoint, cookie import/export, session transplantation, usage-limit bypass, credential capture, or protected-file patching.

## Sources

- https://www.anthropic.com/research/desktop-extensions
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/contextualIdentities
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Work_with_contextual_identities

## Release limitations

Unsigned development build, no real-account login verification, no verified native Claude menu integration, and no macOS/Linux execution in this Windows environment. Mozilla signing and live multi-account testing are release gates. Browser persistence is subject to user cookie policies and Claude session expiration. Account identities are not automatically verified.
