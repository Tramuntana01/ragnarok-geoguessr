import React, { useEffect, useMemo, useState } from 'react'

type Spot = {
  id: string
  image: string
  map: string          // nombre base (da igual el idioma; usamos MAP_I18N para mostrar)
  aliases?: string[]
  zone?: string
  coords?: string
  credit?: string
}

/* ====== UI I18N ====== */
const UI = {
  es: {
    title: 'Ragnarok GeoGuessr',
    subtitle: 'Adivina el mapa a partir de un fragmento',
    settings: 'Ajustes',
    restart: 'Reiniciar',
    round: 'Ronda',
    score: 'Puntuación',
    streak: 'Racha',
    bestStreak: 'Mejor racha',
    lives: 'Vidas',
    timerHelp: 'Si se agota, pierdes la ronda',
    timer: 'Temporizador',
    mode: 'Modo de juego',
    modeClassic: 'Clásico',
    modeMC: 'Multiple Choice',
    zoomLabel: 'Zoom de recorte',
    zoomHelp: 'Más zoom = más difícil',
    maxLives: 'Vidas máximas',
    close: 'Cerrar',
    confirm: 'Confirmar',
    changeImage: 'Cambiar imagen (–1 vida)',
    placeholder: 'Escribe el nombre del mapa (Prontera, Payon, …)',
    location: 'Ubicación',
    gameOver: '¡Game Over!',
    created: 'Creado por A.Tramuntana',
    language: 'Idioma',
    english: 'Change to English',
    spanish: 'Cambiar a Español'
  },
  en: {
    title: 'Ragnarok GeoGuessr',
    subtitle: 'Guess the map from a cropped image',
    settings: 'Settings',
    restart: 'Restart',
    round: 'Round',
    score: 'Score',
    streak: 'Streak',
    bestStreak: 'Best streak',
    lives: 'Lives',
    timerHelp: 'If it runs out, you lose the round',
    timer: 'Timer',
    mode: 'Game mode',
    modeClassic: 'Classic',
    modeMC: 'Multiple Choice',
    zoomLabel: 'Crop zoom',
    zoomHelp: 'Higher zoom = harder',
    maxLives: 'Max lives',
    close: 'Close',
    confirm: 'Confirm',
    changeImage: 'Change image (–1 life)',
    placeholder: 'Type the map name (Prontera, Payon, …)',
    location: 'Location',
    gameOver: 'Game Over!',
    created: 'Created by A.Tramuntana',
    language: 'Language',
    english: 'Change to English',
    spanish: 'Cambiar a Español'
  }
} as const

/* ====== Nombres de mapas por idioma (clave = spot.id) ====== */
const MAP_I18N: Record<string, {es: string; en: string; zoneEs?: string; zoneEn?: string}> = {
  alberta:     { es: 'Alberta',      en: 'Alberta' },
  aldebaran:   { es: 'Aldebaran',    en: 'Al De Baran' },
  amatsu:      { es: 'Amatsu',       en: 'Amatsu' },
  ayothaya:    { es: 'Ayothaya',     en: 'Ayothaya' },
  biolab:      { es: 'Laboratorio Bio', en: 'Bio Laboratory', zoneEs: 'Lighthalzen', zoneEn: 'Lighthalzen' },
  brasilis:    { es: 'Brasilis',     en: 'Brasilis' },
  comodo:      { es: 'Comodo',       en: 'Comodo' },
  dewata:      { es: 'Dewata',       en: 'Dewata' },
  einbech:     { es: 'Einbech',      en: 'Einbech' },
  einbroch:    { es: 'Einbroch',     en: 'Einbroch' },
  geffen:      { es: 'Geffen',       en: 'Geffen' },
  glast:       { es: 'Glast Heim',   en: 'Glast Heim' },
  hugel:       { es: 'Hugel',        en: 'Hugel' },
  izlude:      { es: 'Izlude',       en: 'Izlude' },
  jawaii:      { es: 'Jawaii',       en: 'Jawaii' },
  louyang:     { es: 'Louyang',      en: 'Louyang' },
  malangdo:    { es: 'Malangdo',     en: 'Malangdo' },
  malaya:      { es: 'Malaya',       en: 'Malaya' },
  manuk:       { es: 'Manuk',        en: 'Manuk' },
  morocc:      { es: 'Morocc',       en: 'Morroc' }, // alias clásico en inglés
  niflheim:    { es: 'Niflheim',     en: 'Niflheim' },
  payon:       { es: 'Payon',        en: 'Payon' },
  prontera:    { es: 'Prontera',     en: 'Prontera' },
  splendide:   { es: 'Splendide',    en: 'Splendide' },
  umbala:      { es: 'Umbala',       en: 'Umbala' },
  veins:       { es: 'Veins',        en: 'Veins' },
  yuno:        { es: 'Yuno',         en: 'Juno' }    // a veces se usa "Juno" en inglés
}

/* ====== Dataset (rutas tal como están en /public/images) ====== */
const SAMPLE_DATA: Spot[] = [
  { id: 'alberta',       image: '/images/alberta.png',       map: 'Alberta',       aliases: [], zone: 'Alberta' },
  { id: 'aldebaran',     image: '/images/aldebaran.png',     map: 'Aldebaran',     aliases: [], zone: 'Aldebaran' },
  { id: 'amatsu',        image: '/images/amatsu.png',        map: 'Amatsu',        aliases: [], zone: 'Amatsu' },
  { id: 'ayothaya',      image: '/images/ayothaya.png',      map: 'Ayothaya',      aliases: [], zone: 'Ayothaya' },
  { id: 'biolab',        image: '/images/bioLaboratory.png', map: 'Bio Laboratory', aliases: ['biolab','lighthalzen bio'], zone: 'Bio Laboratory' },
  { id: 'brasilis',      image: '/images/brasilis.png',      map: 'Brasilis',      aliases: [], zone: 'Brasilis' },
  { id: 'comodo',        image: '/images/comodo.png',        map: 'Comodo',        aliases: [], zone: 'Comodo' },
  { id: 'dewata',        image: '/images/dewata.png',        map: 'Dewata',        aliases: [], zone: 'Dewata' },
  { id: 'einbech',       image: '/images/einbech.png',       map: 'Einbech',       aliases: [], zone: 'Einbech' },
  { id: 'einbroch',      image: '/images/einbroch.png',      map: 'Einbroch',      aliases: [], zone: 'Einbroch' },
  { id: 'geffen',        image: '/images/geffen.png',        map: 'Geffen',        aliases: [], zone: 'Geffen' },
  { id: 'glast',         image: '/images/glast.png',         map: 'Glast Heim',    aliases: ['glast heim'], zone: 'Glast Heim' },
  { id: 'hugel',         image: '/images/hugel.png',         map: 'Hugel',         aliases: [], zone: 'Hugel' },
  { id: 'izlude',        image: '/images/izlude.png',        map: 'Izlude',        aliases: [], zone: 'Izlude' },
  { id: 'jawaii',        image: '/images/jawaii.png',        map: 'Jawaii',        aliases: [], zone: 'Jawaii' },
  { id: 'louyang',       image: '/images/louyang.png',       map: 'Louyang',       aliases: [], zone: 'Louyang' },
  { id: 'malangdo',      image: '/images/malangdo.png',      map: 'Malangdo',      aliases: [], zone: 'Malangdo' },
  { id: 'malaya',        image: '/images/malaya.png',        map: 'Malaya',        aliases: [], zone: 'Malaya' },
  { id: 'manuk',         image: '/images/manuk.png',         map: 'Manuk',         aliases: [], zone: 'Manuk' },
  { id: 'morocc',        image: '/images/morocc.png',        map: 'Morocc',        aliases: ['morroc'], zone: 'Morocc' },
  { id: 'niflheim',      image: '/images/niflheim.png',      map: 'Niflheim',      aliases: [], zone: 'Niflheim' },
  { id: 'payon',         image: '/images/payon.png',         map: 'Payon',         aliases: [], zone: 'Payon' },
  { id: 'prontera',      image: '/images/prontera.png',      map: 'Prontera',      aliases: [], zone: 'Prontera' },
  { id: 'splendide',     image: '/images/splendide.png',     map: 'Splendide',     aliases: [], zone: 'Splendide' },
  { id: 'umbala',        image: '/images/umbala.png',        map: 'Umbala',        aliases: [], zone: 'Umbala' },
  { id: 'veins',         image: '/images/veins.png',         map: 'Veins',         aliases: [], zone: 'Veins' },
  { id: 'yuno',          image: '/images/yuno.png',          map: 'Yuno',          aliases: ['juno'], zone: 'Yuno' }
]

/* ====== Utils ====== */
const normalize = (s:string)=>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9 _-]/g,'').trim()

// obtiene el nombre a mostrar según idioma
const nameFor = (spot: Spot, lang: 'es'|'en') =>
  MAP_I18N[spot.id]?.[lang] ?? spot.map

const zoneFor = (spot: Spot, lang: 'es'|'en') =>
  (lang === 'es' ? MAP_I18N[spot.id]?.zoneEs : MAP_I18N[spot.id]?.zoneEn) ?? spot.zone

// coincide si el guess es igual a cualquiera de: nombre ES, nombre EN, map base o aliases
const matches = (guess:string, spot:Spot)=>
  [spot.map, MAP_I18N[spot.id]?.es, MAP_I18N[spot.id]?.en, ...(spot.aliases??[])]
    .filter(Boolean)
    .some(n => normalize(guess)===normalize(String(n)))

const pick = <T,>(arr:T[], exclude?:T)=> {
  const pool = exclude ? arr.filter(x=>x!==exclude) : arr
  return pool[Math.floor(Math.random()*pool.length)]
}

/* ====== Modal ====== */
function Modal({open,onClose,children,title}:{open:boolean;onClose:()=>void;children:React.ReactNode;title:string}) {
  if(!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div role="dialog" aria-modal className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-800 rounded-2xl w-[min(640px,92vw)] shadow-xl">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700" onClick={onClose}>✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

/* ====== Lives ====== */
function Lives({lives, max}:{lives:number; max:number}) {
  return (
    <div className="flex items-center gap-1" aria-label={`Vidas ${lives} de ${max}`}>
      {Array.from({length: max}).map((_, i)=>(
        <span key={i} className={i < lives ? 'opacity-100' : 'opacity-30'}>❤️</span>
      ))}
    </div>
  )
}

export default function App() {
  const [dataset] = useState<Spot[]>(SAMPLE_DATA)
  const [lang, setLang] = useState<'es'|'en'>('es')  // 👈 idioma
  const T = UI[lang]

  // Ajustes
  const [mode, setMode] = useState<'classic'|'mc'>('classic')
  const [timerOn, setTimerOn] = useState(true)
  const [timeLimit, setTimeLimit] = useState(20)
  const [zoom, setZoom] = useState(2) // 1–5
  const [maxLives, setMaxLives] = useState(5)

  // Estado de partida
  const [lives, setLives] = useState(maxLives)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [round, setRound] = useState(1)
  const [guess, setGuess] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [current, setCurrent] = useState<Spot>(pick(SAMPLE_DATA))
  const [mcOptions, setMcOptions] = useState<string[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  // Mantener coherencia vidas ≤ maxLives
  useEffect(()=>{ setLives(v => Math.min(v, maxLives)) }, [maxLives])

  // Temporizador
  useEffect(() => { if(!timerOn || showAnswer) return; setTimeLeft(timeLimit) }, [round,timeLimit,timerOn,showAnswer])
  useEffect(() => {
    if(!timerOn || showAnswer || gameOver) return
    const t = setInterval(() => {
      setTimeLeft(p => (p <= 1 ? (fail('time'), timeLimit) : p-1))
    }, 1000)
    return () => clearInterval(t)
  }, [round,timerOn,showAnswer,gameOver])

  // Opciones MC (mostrar en el idioma activo)
  useEffect(() => {
    if(mode!=='mc') return
    const opts = dataset
      .filter(s=>s.id!==current.id)
      .sort(()=>Math.random()-0.5)
      .slice(0,3)
      .map(s=>nameFor(s, lang))
    setMcOptions([...opts, nameFor(current, lang)].sort(()=>Math.random()-0.5))
  }, [current, mode, dataset, lang])

  const answerLabel = useMemo(()=>{
    const zone = zoneFor(current, lang)
    const name = nameFor(current, lang)
    return `${zone ? zone+' · ' : ''}${name}${current.coords?' '+current.coords:''}`
  },[current, lang])

  const nextRound = (delta=0)=>{ 
    setRound(r=>r+1)
    setCurrent(pick(dataset,current))
    setGuess('')
    setShowAnswer(false)
    if(delta) setScore(s=>s+delta)
  }

  const checkGameOver = (nextLives:number) => { if (nextLives <= 0) setGameOver(true) }

  const success = ()=>{ 
    const base=100, timeBonus= timerOn?Math.ceil((timeLeft/Math.max(1,timeLimit))*50):0, zoomBonus=(zoom-1)*10, gained= base+timeBonus+zoomBonus+streak*10
    setStreak(s=>s+1); setBest(b=>Math.max(b,streak+1))
    setShowAnswer(true); setTimeout(()=>nextRound(gained),900)
  }

  const fail = (_:'time'|'wrong')=>{ 
    setStreak(0); setShowAnswer(true)
    setLives(l => { const n = Math.max(0, l-1); checkGameOver(n); return n })
    setTimeout(()=>nextRound(0),900)
  }

  const skipCostLife = ()=> {
    if (gameOver) return
    setLives(l => { const n = Math.max(0, l-1); checkGameOver(n); return n })
    nextRound(0)
  }

  const submit = ()=>{ if(!guess.trim()) return; matches(guess,current)?success():fail('wrong') }

  const restart = ()=>{ 
    setScore(0); setStreak(0); setRound(1); setCurrent(pick(dataset)); setShowAnswer(false); setGameOver(false)
    setLives(maxLives)
  }

  const cropStyle: React.CSSProperties = useMemo(() => {
    const z = Math.max(1, Math.min(5, zoom))
    const seed = (round * 9301 + 49297) % 233280
    const rx = (seed / 233280) * 60 + 20
    const ry = (seed / 133280) * 60 + 20
    return { backgroundImage:`url("${current.image}")`, backgroundSize:`${z*100}% auto`, backgroundPosition:`${rx}% ${ry}%`, backgroundRepeat:'no-repeat' }
  }, [current.image, round, zoom])

  const mapNames = useMemo(
    ()=>Array.from(new Set(dataset.map(s=>nameFor(s, lang)))).sort(),
    [dataset, lang]
  )

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{T.title}</h1>
          <p className="text-sm text-slate-400">{T.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {/* Language toggle */}
          <button
            className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700"
            onClick={()=>setLang(l => l==='es' ? 'en' : 'es')}
            title={T.language}
          >
            {lang==='es' ? UI.es.english : UI.en.spanish}
          </button>
          <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={()=>setSettingsOpen(true)}>⚙️ {T.settings}</button>
          <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={restart}>{T.restart}</button>
        </div>
      </header>

      {/* HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3 text-xs">
        <div className="px-2 py-1 bg-slate-800/70 rounded flex items-center justify-between sm:col-span-1">
          <span>{T.round}</span><b>{round}</b>
        </div>
        <div className="px-2 py-1 bg-slate-800/70 rounded flex items-center justify-between">
          <span>{T.score}</span><b>{score}</b>
        </div>
        <div className="px-2 py-1 bg-slate-800/70 rounded flex items-center justify-between">
          <span>{T.streak}</span><b>{streak}</b>
        </div>
        <div className="px-2 py-1 bg-slate-800/70 rounded flex items-center justify-between">
          <span>{T.bestStreak}</span><b>{best}</b>
        </div>
        <div className="px-2 py-1 bg-slate-800/70 rounded flex items-center justify-between">
          <span>{T.lives}</span>
          <div className="flex items-center gap-2">
            <Lives lives={lives} max={maxLives}/>
            <b className="min-w-[48px] text-right">{lives}/{maxLives}</b>
          </div>
        </div>
      </div>

      {timerOn && !gameOver && (
        <div className="mb-3">
          <div className="h-2 rounded bg-slate-800 overflow-hidden">
            <div className="h-full bg-slate-200" style={{width:`${(timeLeft/timeLimit)*100}%`}}/>
          </div>
          <div className="text-right text-xs text-slate-400 mt-1">{timeLeft}s</div>
        </div>
      )}

      {/* Image + Controls */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/70">
        <div className="relative aspect-video">
          <div className="absolute inset-0" style={cropStyle}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
          </div>

          {/* Game Over */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="text-center p-4">
                <div className="text-2xl font-extrabold mb-2">{T.gameOver}</div>
                <div className="mb-4 text-slate-300">{T.score}: <b>{score}</b></div>
                <button className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500" onClick={restart}>{T.restart}</button>
              </div>
            </div>
          )}

          {/* Respuesta */}
          {showAnswer && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center p-4">
                <div className="uppercase text-xs tracking-wide text-slate-300">{T.location}</div>
                <div className="mt-1 text-xl font-bold">{answerLabel}</div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          {!gameOver && (mode === 'classic' ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  className="w-full h-11 px-3 rounded bg-slate-800 outline-none"
                  placeholder={T.placeholder}
                  value={guess}
                  onChange={e=>setGuess(e.target.value)}
                  onKeyDown={e=>e.key==='Enter' && submit()}
                />
                {/* Autocomplete */}
                {guess && (
                  <div className="absolute left-0 right-0 mt-1 bg-slate-950/95 border border-slate-800 rounded max-h-56 overflow-auto z-10">
                    {mapNames
                      .filter(n=>normalize(n).includes(normalize(guess))).slice(0,8)
                      .map(n=>(
                        <button key={n} onClick={()=>setGuess(n)} className="w-full text-left px-3 py-2 hover:bg-slate-800/50">{n}</button>
                      ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button className="px-4 rounded bg-indigo-600 hover:bg-indigo-500" onClick={submit}>{T.confirm}</button>
                <button className="px-4 rounded bg-slate-800 hover:bg-slate-700" onClick={skipCostLife}>
                  {T.changeImage}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mcOptions.map(opt=>(
                <button key={opt} className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700"
                        onClick={()=> (matches(opt,current) ? success() : fail('wrong'))}>
                  {opt}
                </button>
              ))}
              <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 col-span-2" onClick={skipCostLife}>
                {T.changeImage}
              </button>
            </div>
          ))}

          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <div>Zoom x{zoom}</div>
            <div>{T.created}</div>
          </div>
        </div>
      </div>

      {/* MODAL AJUSTES */}
      <Modal open={settingsOpen} onClose={()=>setSettingsOpen(false)} title={T.settings}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{T.mode}</div>
              <div className="text-sm text-slate-400">Clásico (input) / Multiple Choice</div>
            </div>
            <select className="px-3 py-2 rounded bg-slate-800" value={mode} onChange={e=>setMode(e.target.value as any)}>
              <option value="classic">{T.modeClassic}</option>
              <option value="mc">{T.modeMC}</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{T.timer}</div>
              <div className="text-sm text-slate-400">{T.timerHelp}</div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={timerOn} onChange={e=>setTimerOn(e.target.checked)} />
                <span>On</span>
              </label>
              <input type="range" min={5} max={60} step={5} value={timeLimit} onChange={e=>setTimeLimit(parseInt(e.target.value))}/>
              <span className="text-slate-300 w-12 text-right">{timeLimit}s</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{T.zoomLabel}</div>
              <div className="text-sm text-slate-400">{T.zoomHelp}</div>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={5} step={1} value={zoom} onChange={e=>setZoom(parseInt(e.target.value))}/>
              <span className="text-slate-300 w-10 text-right">x{zoom}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{T.maxLives}</div>
              <div className="text-sm text-slate-400">1–5</div>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={5} step={1} value={maxLives} onChange={e=>setMaxLives(parseInt(e.target.value))}/>
              <span className="text-slate-300 w-10 text-right">{maxLives}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={()=>setSettingsOpen(false)}>{T.close}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
