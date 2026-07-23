// Android App Links — the Android counterpart of the AASA file. Lets
// https://shabanga.com (+ stage.shabanga.com) /t /e /bar /scan links open the
// shabanga app on Android (the app's intentFilters claim those paths).
// package_name/SHA-256 = the current com.shabanga.app + its EAS signing-cert
// fingerprint. (Was stale here — served the old com.zneria.foapp only, which
// shadowed the correct public/.well-known/assetlinks.json. Fixed 2026-07-22.)
export function GET() {
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.shabanga.app",
        sha256_cert_fingerprints: [
          "8C:8E:F9:05:51:83:89:AE:44:2A:7D:69:D4:B5:C3:66:65:CC:42:0B:06:48:C5:DA:94:9B:50:AA:F7:ED:85:60",
        ],
      },
    },
  ];
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
