# Ponytail Integration

Ponytail is vendored into Theorem's Harness as an embedded advisory skill pack,
not as a second marketplace dependency.

- Upstream: `https://github.com/DietrichGebert/ponytail.git`
- Imported commit: `6da37bfa7d0282522c7785759f4d2f1544015354`
- Imported date: `2026-06-21`
- License: MIT, see `references/PONYTAIL-LICENSE`
- Imported bundle hash: `sha256:6f555f5f8af07bb48a35b2a7667948570e406dfb5bb4cea63c446397fb5581d4`

Imported surfaces:

- `skills/ponytail*`
- `commands/ponytail*`
- `scripts/ponytail-*`
- SessionStart/UserPromptSubmit hook entries in both host manifests

The upstream hook helpers are intentionally kept close to source. Harness owns
the surrounding hook manifest entries and skill-pack registry payload.
