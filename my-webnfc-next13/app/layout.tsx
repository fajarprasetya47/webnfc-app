export const metadata = {
  title: "Web NFC Demo (Next 13)",
  description: "Minimal Next.js 13 app with Web NFC scanner",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"",
        background: "#0b1220",
        color: "#e6edf3"
      }}>
        <div style={{minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16}}>
          {children}
        </div>
      </body>
    </html>
  );
}