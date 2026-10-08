"use client";
import dynamic from "next/dynamic";
const App = dynamic(() => import("../src/App"), { ssr: false, loading: () => <div className="boot" role="status">Booting the seismic twin...</div> });
export default function Page() { return <App />; }
