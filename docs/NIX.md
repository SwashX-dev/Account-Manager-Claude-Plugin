# Nix setup

Supports flake outputs for x86_64/aarch64 Linux and macOS. This is an alternative developer/build setup, not integration into Claude Desktop or an automatic Firefox installation.

Enable `nix-command` and `flakes` in your Nix configuration if not already enabled. From the repository root:

```sh
nix flake lock
nix develop
npm test
npm run lint
npm run build
exit
nix build
nix flake check
```

The result is in `result/share/claude-account-manager/`: an unpacked `extension/` directory and an unsigned ZIP. For a temporary Firefox test, select that directory's `manifest.json` in `about:debugging`. For persistent use, install a Mozilla-signed XPI as described in the README. The flake does not change browser security settings or manage passwords, profiles, OS services, or Firefox policies.

The development shell includes Node.js 22 and Git. Install Firefox separately through your preferred NixOS/Home Manager configuration or vendor package. No npm download is needed to run tests or build; Nix still needs to fetch nixpkgs and its build dependencies unless cached.

## Lock file and validation status

Nix is not installed in the Windows build environment, so the flake has **not been evaluated or built here**. A `flake.lock` has not been fabricated. Run `nix flake lock`, inspect the generated lock, and commit it before relying on reproducible Nix input revisions. `nixos-26.05` is a moving input until locked. Test all desired platform outputs before publishing a Nix release.

If using a Git checkout with new untracked flake files, stage them first (`git add flake.nix docs/NIX.md`) so Nix can see them. Native Nix on Windows is not supported; use Linux/WSL for development, with a separate supported Firefox installation for interactive testing.
