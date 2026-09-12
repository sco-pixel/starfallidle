/* eslint-disable @next/next/no-html-link-for-pages */
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
      <a className="home-brand" href="/" aria-label="Starfall Idle home"><span><Orbit /></span><strong>Starfall Idle</strong></a>
      <nav aria-label="Primary navigation"><a href="#patrol">The patrol</a><a href="#sectors">Sectors</a><a href="/play" className="home-play-link">Play now <ArrowRight /></a></nav>
    </header>

    <section className="home-hero">
      <div className="home-hero-copy"><p className="eyebrow">DEEP SPACE PATROL // COMMISSION READY</p><h1>Command the cruiser that carries you beyond the frontier.</h1><p>Starfall Idle is a sci-fi progression game of long patrols, patient planning and hard-won discoveries. Train your crew, operate an Aethelgard-class cruiser and build a career across five dangerous sectors.</p><div className="home-actions"><a className="home-primary-action" href="/play">Begin your patrol <ArrowRight /></a><a className="home-secondary-action" href="#patrol">View the commission</a></div></div>
      <aside className="home-ship-card panel"><div className="home-ship-ring"><Rocket /></div><p className="eyebrow">AETHELGARD-CLASS</p><h2>Deep Space Cruiser</h2><p>Four pressurised decks. Ten specialists. Five years without resupply.</p><dl><div><dt>Endurance</dt><dd>5 years</dd></div><div><dt>Awake crew</dt><dd>10</dd></div><div><dt>Patrol sectors</dt><dd>5</dd></div></dl></aside>
    </section>

    <section id="patrol" className="home-systems"><div className="home-section-heading"><p className="eyebrow">YOUR COMMISSION</p><h2>One connected idle-RPG career</h2><p>Every operation advances a cruiser, a crew and a patrol record—not a separate menu.</p></div><div className="home-system-grid"><article><Wrench /><h3>Build the ship</h3><p>Mine, salvage, fabricate and research the materials that upgrade your cruiser, drones and away-team equipment.</p></article><article><Telescope /><h3>Chart the unknown</h3><p>Train fourteen specialist skills, recover rare discoveries and unlock deeper operations inside the established five-sector map.</p></article><article><Crosshair /><h3>Hold the line</h3><p>Choose combat doctrine, manage reactor power and defeat sector threats for unique equipment and permanent progression.</p></article><article><Users /><h3>Lead the crew</h3><p>Assign ten named specialists, raise their loyalty and balance the systems that keep a long patrol alive.</p></article></div></section>

    <section id="sectors" className="home-sector-section"><div className="home-section-heading"><p className="eyebrow">THE STAR CHART</p><h2>Exactly five sectors. No filler systems.</h2><p>Progression goes deeper within these five regions, from frontier extraction to ancient machine territory.</p></div><ol className="home-sector-list">{sectors.map(([number, name, tone]) => <li key={number}><span>{number}</span><div><h3>{name}</h3><p>{tone}</p></div><Sparkles /></li>)}</ol></section>

    <section className="home-final panel"><div><p className="eyebrow">READY FOR COMMISSION</p><h2>Build a patrol record worth putting on the Hiscores.</h2><p>Play immediately as a local patrol, then use ChatGPT sign-in when you are ready to protect your commander, cloud save and ranking.</p></div><a className="home-primary-action" href="/play">Enter the bridge <ArrowRight /></a></section>

    <footer className="home-footer"><span><ShieldCheck /> Cloud saves available with ChatGPT sign-in</span><a href="/play">Play Starfall Idle</a></footer>
  </main>;
}
