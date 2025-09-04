"use client";
import NFCScanner from "../components/NFCScanner";

export default function Page() {
  return (
    <main style={{width: "100%", maxWidth: 560}}>
      <h1 style={{fontSize: 28, marginBottom: 8}}>Web NFC – Scan Test</h1>
      <p style={{opacity: 0.8, marginBottom: 16}}>
        Tombol di bawah untuk mulai scan tag NFC (NDEF). Pastikan menggunakan Chrome/Chromium Android dan situs diakses via HTTPS atau localhost.
      </p>
      <NFCScanner />
      <footer style={{marginTop: 28, opacity: 0.7, fontSize: 13}}>
        Catatan: iOS/iPadOS belum mendukung Web NFC di browser. Android tablet + Chrome disarankan.
      </footer>
    </main>
  );
}