import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import { GameShell } from "../app/game-shell";
import { defaultGameState } from "../lib/game-state";
import "../app/globals.css";

function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const updateRoute = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  return route === "#/play" ? <main className="min-h-screen"><GameShell initialState={defaultGameState()} /></main> : <Home />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
