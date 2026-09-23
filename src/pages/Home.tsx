import { ArrowRight, Crosshair, Orbit, Rocket, ShieldCheck, Sparkles, Telescope, Users, Wrench } from "lucide-react";

const sectors = [
  ["01", "Erebus Belt", "Industrial frontier"],
  ["02", "Helix Reach", "Research quarantine"],
  ["03", "Cinder Expanse", "Corsair territory"],
  ["04", "Orpheus Rift", "Gravitational fracture"],
  ["05", "The Silent Systems", "Machine domain"],
];

export default function Home() {
  return <main className="starfall-home">
    <header className="home-header">
      <a className="home-brand" href="#/" aria-label="Starfall Idle home"><span><Orbit /></span><strong>Starfall Idle</strong></a>
      <nav aria-label="Primary navigation"><a href="#journey">Your journey</a><a href="#sectors">Sectors</a><a href="#/play" className="home-play-link">Play now <ArrowRight /></a></nav>
    </header>

    <section className="home-hero">
      <div className="home-hero-copy"><p className="eyebrow">DEEP SPACE CRUISER // DOCKING READY</p><h1>Command the cruiser that carries you beyond the frontier.</h1><p>Starfall Idle is a sci-fi progression game of exploration, patient planning and hard-won discoveries. Train your crew, operate an Aethelgard-class cruiser and build a career across a living frontier of dangerous sectors and busy stations.</p><div className="home-actions"><a className="home-primary-action" href="#/play">Begin your journey <ArrowRight /></a><a className="home-secondary-action" href="#journey">Explore the frontier</a></div></div>
      <aside className="home-ship-card panel"><div className="home-ship-ring"><Rocket /></div><p className="eyebrow">AETHELGARD-CLASS</p><h2>Deep Space Cruiser</h2><p>Four pressurised decks. A rotating crew roster. A frontier connected by stations, contracts and new routes.</p><dl><div><dt>Station access</dt><dd>Frontier-wide</dd></div><div><dt>Crew roster</dt><dd>Rotating</dd></div><div><dt>Known sectors</dt><dd>Growing</dd></div></dl></aside>
    </section>

    <section id="journey" className="home-systems"><div className="home-section-heading"><p className="eyebrow">YOUR JOURNEY</p><h2>One connected idle-RPG career</h2><p>Every operation advances your cruiser, crew and growing place in the frontier—not a separate menu.</p></div><div className="home-system-grid"><article><Wrench /><h3>Build the ship</h3><p>Mine, salvage, fabricate and research the materials that upgrade your cruiser, drones and away-team equipment.</p></article><article><Telescope /><h3>Chart the unknown</h3><p>Train fourteen specialist skills, recover rare discoveries and unlock deeper operations as the frontier expands.</p></article><article><Crosshair /><h3>Hold the line</h3><p>Choose combat doctrine, manage reactor power and defeat sector threats for unique equipment and permanent progression.</p></article><article><Users /><h3>Lead the crew</h3><p>Recruit, rotate and assign specialists between station visits while building a crew ready for the next contract.</p></article></div></section>

    <section id="sectors" className="home-sector-section"><div className="home-section-heading"><p className="eyebrow">THE STAR CHART</p><h2>Exactly five sectors. No filler systems.</h2><p>Progression goes deeper within these five regions, from frontier extraction to ancient machine territory.</p></div><ol className="home-sector-list">{sectors.map(([number, name, tone]) => <li key={number}><span>{number}</span><div><h3>{name}</h3><p>{tone}</p></div><Sparkles /></li>)}</ol></section>

    <section className="home-final panel"><div><p className="eyebrow">READY TO DEPART</p><h2>Build your frontier career on your own device.</h2><p>Your journey automatically saves in this browser and continues progressing while you are away.</p></div><a className="home-primary-action" href="#/play">Enter the bridge <ArrowRight /></a></section>

    <footer className="home-footer"><span><ShieldCheck /> Saves stay on this device</span><div><a href="https://ko-fi.com/w644769" target="_blank" rel="noreferrer">Support Starfall Idle on Ko-fi</a><a href="#/play">Play Starfall Idle</a></div></footer>
  </main>;
}
