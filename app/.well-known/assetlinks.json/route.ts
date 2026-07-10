// Android App Links — the Android counterpart of the AASA file. Lets
// https://fansonly.live/t links open the fansonly app on Android (the app's
// intentFilters claim /t; extend alongside the AASA when /e, /p are claimed).
// SHA-256 = the EAS production keystore's signing-cert fingerprint.
export function GET() {
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.zneria.foapp",
        sha256_cert_fingerprints: [
          "F4:B8:56:DA:70:6E:9E:67:13:F8:25:91:0A:F7:B8:B9:24:34:7C:8C:7D:3E:D3:D1:E3:FB:F0:B0:AA:15:A5:0E",
        ],
      },
    },
  ];
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
