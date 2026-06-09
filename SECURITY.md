# Security Policy

Dust Off is built privacy-first. By design it makes no network calls during normal
usage, ships no telemetry/analytics/crash-reporting SDKs, and keeps all photo data
and preferences on-device. Any report that undermines one of those guarantees — or a
more conventional vulnerability — is taken seriously.

## Supported versions

The latest release on the `main` branch is the only supported version.

## Reporting a vulnerability

Please **do not** open a public issue for security reports.

- Preferred: open a private [GitHub Security Advisory](https://github.com/Ninkuk/dust-off/security/advisories/new).
- Alternatively, email **ninadk.dev@gmail.com** with steps to reproduce.

Expect an acknowledgement within a few days. Once a fix ships, credit will be given
in the release notes unless you prefer to remain anonymous.

## Scope

Especially in scope:

- Any code path that performs an unexpected network request or exfiltrates photo
  data or metadata off the device.
- Inclusion of a dependency that adds telemetry, analytics, or crash reporting.
- Permission requests beyond the OS photo-library permission (and Android
  `ACCESS_MEDIA_LOCATION`, used only to read a photo's embedded EXIF on-device).
