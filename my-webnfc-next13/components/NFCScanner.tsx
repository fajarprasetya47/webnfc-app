"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = any;

declare global {
  // eslint-disable-next-line no-var
  var NDEFReader: undefined | (new () => {
    onreading: ((ev: AnyObj) => void) | null;
    onreadingerror: ((ev: Event) => void) | null;
    scan: (options?: AnyObj) => Promise<void>;
    write?: (data: AnyObj, options?: AnyObj) => Promise<void>;
  });
}

function decodeRecord(record: AnyObj): { recordType: string; mediaType?: string; id?: string; data: string } {
  const recordType = record.recordType as string;
  const mediaType = (record as AnyObj).mediaType as string | undefined;
  const id = record.id as string | undefined;
  let data = "";

  try {
    const dv: DataView = record.data as DataView;
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);

    if (recordType === "text") {
      const langLen = bytes[0] & 0x3f;
      const textBytes = bytes.slice(1 + langLen);
      data = new TextDecoder(record.encoding || "utf-8").decode(textBytes);
    } else if (recordType === "url") {
      data = new TextDecoder().decode(bytes);
    } else {
      data = new TextDecoder().decode(bytes);
    }
  } catch {
    data = "<unparsed/binary>";
  }

  return { recordType, mediaType, id, data };
}

export default function NFCScanner() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [secure, setSecure] = useState<boolean>(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [serial, setSerial] = useState<string | null>(null);
  const [records, setRecords] = useState<Array<{ recordType: string; mediaType?: string; id?: string; data: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(typeof (globalThis as AnyObj).NDEFReader !== "undefined");
    setSecure(window.isSecureContext === true);
  }, []);

  const canScan = useMemo(() => supported === true && secure && !scanning, [supported, secure, scanning]);

  const startScan = useCallback(async () => {
    if (!("NDEFReader" in globalThis)) {
      setStatus("Web NFC tidak didukung di browser/perangkat ini.");
      return;
    }
    if (!window.isSecureContext) {
      setStatus("Web NFC butuh HTTPS atau localhost. Jalankan via HTTPS.");
      return;
    }

    try {
      setStatus("");
      setRecords([]);
      setSerial(null);

      // Optional: permission preflight
      // @ts-expect-error
      if (navigator.permissions?.query) {
        try {
          // @ts-expect-error
          await navigator.permissions.query({ name: "nfc" });
        } catch {/* ignore */}
      }

      const reader = new (globalThis as AnyObj).NDEFReader();
      const abort = new AbortController();
      abortRef.current = abort;

      reader.onreadingerror = () => setStatus("Gagal membaca tag. Pastikan tag NDEF & tempel lebih dekat.");
      reader.onreading = (ev: AnyObj) => {
        try {
          const { serialNumber, message } = ev;
          setSerial(serialNumber ?? null);
          const recs = (message.records as AnyObj[]).map(decodeRecord);
          setRecords(recs);
          setStatus("Berhasil dibaca. Tempel lagi untuk membaca ulang.");
        } catch {
          setStatus("Terjadi kesalahan saat memproses data tag.");
        }
      };

      await reader.scan({ signal: abort.signal });
      setScanning(true);
      setStatus("Tempelkan tag NFC di dekat perangkat…");
    } catch (err) {
      setScanning(false);
      const msg = (err as Error)?.message || "Gagal memulai pemindaian.";
      if (msg.includes("NotAllowedError")) setStatus("Izin NFC ditolak. Berikan izin di Chrome → Site settings → NFC.");
      else if (msg.includes("NotSupportedError")) setStatus("Perangkat tidak mendukung Web NFC atau NFC dimatikan.");
      else if (msg.includes("SecurityError")) setStatus("Konteks tidak aman. Gunakan HTTPS/localhost.");
      else setStatus(msg);
    }
  }, []);

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setScanning(false);
    setStatus("Pemindaian dihentikan.");
  }, []);

  return (
    <div style={{display:"grid",gap:12,padding:16,borderRadius:16,border:"1px solid #21304a",background:"#0f1a2b",boxShadow:"0 8px 40px rgba(0,0,0,.3)"}}>
      {supported === false && (
        <div style={{background:"#2b1f1f",border:"1px solid #523535",padding:12,borderRadius:12}}>
          Web NFC tidak ditemukan (<code>NDEFReader</code> tidak ada). Gunakan Chrome Android & akses via HTTPS/localhost.
        </div>
      )}
      {!secure && (
        <div style={{background:"#2b1f2b",border:"1px solid #355235",padding:12,borderRadius:12}}>
          Konteks belum aman. Jalankan situs dengan HTTPS (atau localhost) agar Web NFC aktif.
        </div>
      )}

      <div style={{display:"flex",gap:8}}>
        <button onClick={startScan} disabled={!canScan}>Mulai Scan NFC</button>
        <button onClick={stopScan} disabled={!scanning}>Stop</button>
      </div>

      {!!status && (<div style={{padding:10,background:"#0d223b",border:"1px solid #1b3555",borderRadius:10,fontSize:14}}>{status}</div>)}

      <div>
        <div style={{opacity:0.8,fontSize:14}}>Serial Number:</div>
        <div style={{padding:10,borderRadius:10,background:"#0b1525",border:"1px solid #1b2a45"}}>{serial ?? "-"}</div>
      </div>

      <div>
        <div style={{opacity:0.8,fontSize:14}}>Records:</div>
        {records.length === 0 ? (<div style={{padding:10,borderRadius:10,background:"#0b1525",border:"1px solid #1b2a45"}}>Belum ada</div>) : (
          <ul>{records.map((r,i)=>(<li key={i}><b>{r.recordType}</b>: {r.data}</li>))}</ul>
        )}
      </div>
    </div>
  );
}