import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "RIFT", description: "RIFT: real-time seismic risk and subsurface infrastructure digital twin. All data is synthetic." };
export const viewport: Viewport = { themeColor: "#0A0908", width: "device-width", initialScale: 1 };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
