"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = any;

export default function NFCScanner() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [serial, setSerial] = useState<string | null>(null);
  const [records, setRecords] = useState<Array<{recordType: string; mediaType?: string; id?: string; data: string}>>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "NDEFReader" in window);
  }, []);

  const canScan = useMemo(() => supported === true && !scanning, [supported, scanning]);

  async function startScan() {
    if (!("NDEFReader" in window)) {
      setStatus("Web NFC tidak didukung di perangkat/browser ini.");
      return;
    }

    try {
      setStatus(""); setRecords([]); setSerial(null);
      const ndef = new (window as AnyObj).NDEFReader();
      const abort = new AbortController();
      abortRef.current = abort;

      await ndef.scan({ signal: abort.signal });
      setScanning(true);
      setStatus("Tempelkan tag NFC di dekat perangkat…");

      ndef.onreading = (ev: AnyObj) => {
        const { serialNumber, message } = ev;
        setSerial(serialNumber ?? null);
        const recs: Array<{recordType: string; mediaType?: string; id?: string; data: string}> = [];
        for (const record of message.records) {
          let data = "";
          try {
            const textDecoder = new TextDecoder();

            data = textDecoder.decode(record.data);
          } catch {
            data = "<binary/unknown>";
          }
          recs.push({ recordType: record.recordType, mediaType: (record as AnyObj).mediaType, id: record.id, data });
        }
        setRecords(recs);
        setStatus("Berhasil dibaca. Tempel lagi untuk membaca ulang.");
      };
    } catch (err) {
      setScanning(false);
      setStatus((err as Error)?.message || "Gagal memulai pemindaian.");
    }
  }

  function stopScan() {
    abortRef.current?.abort();
    abortRef.current = null;
    setScanning(false);
    setStatus("Pemindaian dihentikan.");
  }

  return (
    <div style={{padding:16,border:"1px solid #21304a",borderRadius:16}}>
      <div style={{display:"flex", gap:8}}>
        <button onClick={startScan} disabled={!canScan}>Mulai Scan NFC</button>
        <button onClick={stopScan} disabled={!scanning}>Stop</button>
      </div>
      <div>{status}</div>
      <div>Serial: {serial ?? "-"}</div>
      <ul>{records.map((r,i)=>(<li key={i}>{r.recordType}: {r.data}</li>))}</ul>
    </div>
  );
}