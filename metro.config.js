const { getDefaultConfig } = require('expo/metro-config');

// Neutralize the unpatched `image-size` DoS advisories at their source.
//
// `image-size` reaches us transitively (expo -> @expo/metro -> metro) and is
// used only at bundle time to read asset dimensions. Two advisories cover
// infinite loops in its ICNS, HEIF and JXL parsers:
//   GHSA-w3rx-r6r6-pgpr  GHSA-5p2g-fcmc-qvqq
// Both report `first_patched: null` against a vulnerable range of `<= 2.0.2`,
// and 2.0.2 is the newest release that exists — the upstream repo is archived,
// so no fix is coming and no version bump or override can clear them.
//
// Metro's own `isAssetTypeAnImage` allowlist already excludes these formats, so
// today the parsers are unreachable. Disabling them here is defense in depth:
// it keeps them unreachable even if that allowlist ever widens. `jxl-stream` is
// a distinct handler from `jxl` and must be named separately.
//
// Revisit when metro drops image-size (still `^1.0.2` as of metro 0.87) — at
// which point the matching exemptions in .audit-ci.json should go too.
require('image-size').disableTypes(['icns', 'heif', 'jxl', 'jxl-stream']);

module.exports = getDefaultConfig(__dirname);
