import React, { useMemo, useState, useEffect } from 'react'

type Sex = 'weiblich' | 'männlich' | 'divers' | 'keine Angabe'

type Patient = {
  vorname: string
  alter: number
  groesseCm: number
  gewichtKg: number
  beruf: string
  sex: Sex
}

type Answers = {
  pattern: 'omnivor' | 'vegetarisch' | 'vegan' | 'pescetarisch'
  goals: string[]

  fruitPerDay: number
  vegPerDay: number
  wholeGrainPerDay: number
  legumesPerWeek: number
  nutsPerWeek: number
  fishPerWeek: number
  dairyPerDay: number
  redProcessedMeatPerWeek: number
  sweetsPerWeek: number
  saltySnacksPerWeek: number
  fastFoodPerWeek: number
  ssbPerWeek: number
  alcoholDrinksPerWeek: number
  waterGlassesPerDay: number

  breakfastDaysPerWeek: number
  lateNightDaysPerWeek: number
  mealRegularity: number
  mindfulEating: number
  cookAtHomeDaysPerWeek: number

  bloating: number
  heartburn: number
  constipationDays: number
  diarrheaDays: number
  energyDipAfterMeals: number
  sweetCravings: number
  saltyCravings: number
  stress: number
  sleepHours: number

  mnaSfItems: number[]
  tfeqItems: number[]

  log: DietEntry[]
}

type DietEntry = {
  date: string
  meal: 'Frühstück' | 'Mittag' | 'Abend' | 'Snack'
  time: string
  description: string
  portionsFruitVeg?: number
  sugaryDrinks?: number
  kcal?: number
}

const clamp = (v: number, min=0, max=100) => Math.min(max, Math.max(min, v))
const toNum = (v: any) => (v===''||v===null||v===undefined?0:Number(v))
const fmt1 = (n: number) => n.toFixed(1)

const defaultPatient: Patient = {
  vorname: '',
  alter: 35,
  groesseCm: 170,
  gewichtKg: 70,
  beruf: '',
  sex: 'keine Angabe'
}

const defaultAnswers: Answers = {
  pattern: 'omnivor',
  goals: [],
  fruitPerDay: 2, vegPerDay: 3, wholeGrainPerDay: 1,
  legumesPerWeek: 2, nutsPerWeek: 3, fishPerWeek: 1,
  dairyPerDay: 1, redProcessedMeatPerWeek: 3, sweetsPerWeek: 4,
  saltySnacksPerWeek: 2, fastFoodPerWeek: 1, ssbPerWeek: 2,
  alcoholDrinksPerWeek: 2, waterGlassesPerDay: 6,
  breakfastDaysPerWeek: 5, lateNightDaysPerWeek: 2,
  mealRegularity: 3, mindfulEating: 3, cookAtHomeDaysPerWeek: 5,
  bloating: 1, heartburn: 0, constipationDays: 1, diarrheaDays: 0,
  energyDipAfterMeals: 1, sweetCravings: 1, saltyCravings: 0,
  stress: 1, sleepHours: 7,
  mnaSfItems: Array(6).fill(0),
  tfeqItems: Array(18).fill(2),
  log: []
}

function bmi(groesseCm: number, gewichtKg: number){
  const h = toNum(groesseCm)/100
  if (!h) return { bmi: 0, cat: '–'}
  const b = gewichtKg/(h*h)
  let cat = 'Normalgewicht'
  if (b < 18.5) cat = 'Untergewicht'
  else if (b < 25) cat = 'Normalgewicht'
  else if (b < 30) cat = 'Übergewicht'
  else cat = 'Adipositas'
  return { bmi: b, cat }
}

function healthyDietScore(a: Answers){
  let p = 0
  p += clamp((a.fruitPerDay/3)*10,0,10)
  p += clamp((a.vegPerDay/4)*10,0,10)
  p += clamp((a.wholeGrainPerDay/3)*10,0,10)
  p += clamp((a.legumesPerWeek/4)*8,0,8)
  p += clamp((a.nutsPerWeek/5)*6,0,6)
  p += clamp((a.fishPerWeek/2)*6,0,6)
  const dairyIdeal = a.dairyPerDay<=3? (a.dairyPerDay/3)*6 : (3/a.dairyPerDay)*6
  p += clamp(dairyIdeal,0,6)
  p += clamp((Math.max(7-a.redProcessedMeatPerWeek,0)/7)*8,0,8)
  p += clamp((Math.max(7-a.ssbPerWeek,0)/7)*8,0,8)
  p += clamp((Math.max(7-a.sweetsPerWeek,0)/7)*4,0,4)
  p += clamp((Math.max(7-a.saltySnacksPerWeek,0)/7)*4,0,4)
  p += clamp((Math.max(4-a.fastFoodPerWeek,0)/4)*6,0,6)
  p += clamp((a.waterGlassesPerDay/8)*6,0,6)
  return clamp(p,0,100)
}

function behaviorScore(a: Answers){
  let p = 0
  p += clamp((a.breakfastDaysPerWeek/7)*20,0,20)
  p += clamp(((7-a.lateNightDaysPerWeek)/7)*20,0,20)
  p += clamp(((a.mealRegularity-1)/4)*20,0,20)
  p += clamp(((a.mindfulEating-1)/4)*20,0,20)
  p += clamp((a.cookAtHomeDaysPerWeek/7)*20,0,20)
  return clamp(p,0,100)
}

function hydrationRemark(a: Answers){
  if (a.waterGlassesPerDay>=8) return 'Hydration: wirkt angemessen.'
  if (a.waterGlassesPerDay>=6) return 'Hydration: okay, ggf. auf 8 Gläser/Tag erhöhen.'
  return 'Hydration: eher niedrig, Trinkmenge schrittweise steigern.'
}

// --- MNA (Kurzform) scoring (0–14). Ohne Itemwortlaut, nur Punkte-Eingabe ---
function mnaClass(sfSum: number){
  if (sfSum <= 7) return 'MNA-SF: Mangelernährung wahrscheinlich (0–7)'
  if (sfSum <= 11) return 'MNA-SF: Risiko für Mangelernährung (8–11)'
  return 'MNA-SF: Ernährungszustand unauffällig (12–14)'
}

// --- TFEQ-R18 scoring ---
const MAP = {
  CR: [1,2,5,7,10,13],
  UE: [3,4,8,9,12,14,16,18],
  EE: [6,11,15,17],
}
function tfeqScores(items: number[]){
  const vals = items.map(x=>clamp(toNum(x),1,4))
  const score = (idx: number[])=>{
    const z = idx.map(i=>i-1)
    const raw = z.reduce((s,i)=>s+vals[i],0)
    const min = 1*idx.length
    const max = 4*idx.length
    return ((raw-min)/(max-min))*100
  }
  return {
    CR: clamp(score(MAP.CR),0,100),
    UE: clamp(score(MAP.UE),0,100),
    EE: clamp(score(MAP.EE),0,100)
  }
}

function logMetrics(log: DietEntry[]){
  if (!log.length) return { days: 0, mealsPerDay: 0, avgFruitVeg: 0, avgSugary: 0, kcalPerDay: 0 }
  const days = Array.from(new Set(log.map(x=>x.date)))
  const byDay: Record<string, DietEntry[]> = {}
  for (const e of log){ (byDay[e.date] ||= []).push(e) }
  const mealsPerDay = days.map(d=>byDay[d].length).reduce((a,b)=>a+b,0)/days.length
  const avgFruitVeg = days.map(d=>byDay[d].reduce((s,x)=>s+(x.portionsFruitVeg||0),0)).reduce((a,b)=>a+b,0)/days.length
  const avgSugary = days.map(d=>byDay[d].reduce((s,x)=>s+(x.sugaryDrinks||0),0)).reduce((a,b)=>a+b,0)/days.length
  const kcalPerDay = days.map(d=>byDay[d].reduce((s,x)=>s+(x.kcal||0),0)).reduce((a,b)=>a+b,0)/days.length
  return { days: days.length, mealsPerDay, avgFruitVeg, avgSugary, kcalPerDay }
}

function contextualNotes(p: Patient, a: Answers){
  const notes: string[] = []
  if (p.alter >= 65) notes.push('Alter ≥65: Fokus auf Proteinqualität, MNA beachten, Calcium/Vitamin D, Krafttraining.')
  if (p.alter < 25) notes.push('Junges Alter: Basisgewohnheiten stärken, ausreichend Energie/Protein.')
  const b = p.beruf.toLowerCase()
  if (/(büro|office|sitz|desk|informatik|verwaltung)/.test(b)) notes.push('Sitzender Beruf: Bewegungspausen, Schrittziele, proteinbetonte Hauptmahlzeiten.')
  if (/(pflege|gastr|handel|verkauf|lehrer|service|steh|gehen)/.test(b)) notes.push('Stehender/gehender Beruf: Snacks mit Protein+Faser, Trinkpausen.')
  if (/(bau|lager|handwerk|produktion|logistik|körperlich|sport)/.test(b)) notes.push('Körperlich anstrengend: höherer Energie-/Proteinbedarf, Elektrolyte bei starkem Schwitzen.')
  if (/(schicht|nacht|dienst)/.test(b)) notes.push('Schichtdienst: Meal-Prep, leichte warme Mahlzeiten, Koffein smart timen, Lichtmanagement.')
  const bObj = bmi(p.groesseCm, p.gewichtKg)
  if (bObj.cat === 'Untergewicht') notes.push('Untergewicht: energiedichte, nährstoffreiche Kost; Zwischenmahlzeiten; ggf. Supplemente nach Rücksprache.')
  if (bObj.cat === 'Übergewicht' || bObj.cat === 'Adipositas') notes.push('Gewichtsmanagement: Energiebilanz moderat negativ, Proteinziel (~1.2–1.6 g/kg) und hohe Sättigungsdichte.')
  return notes
}

function recsFromProfiles(a: Answers){
  const recs: string[] = []
  const diet = healthyDietScore(a)
  const beh = behaviorScore(a)
  if (a.fruitPerDay + a.vegPerDay < 5) recs.push('Obst & Gemüse auf ≥5 Portionen/Tag steigern (bunt variieren).')
  if (a.wholeGrainPerDay < 3) recs.push('Vollkorn auf ca. 3 Portionen/Tag erhöhen (Hafer, Vollkornbrot, Naturreis).')
  if (a.legumesPerWeek < 2) recs.push('Hülsenfrüchte ≥2×/Woche einplanen (Linsen, Bohnen, Kichererbsen).')
  if (a.nutsPerWeek < 3) recs.push('Nüsse/Samen an ≥3 Tagen/Woche (kleine Handvoll).')
  if (a.fishPerWeek < 1) recs.push('1–2×/Woche Fisch (fettreich bevorzugt), sofern passend.')
  if (a.redProcessedMeatPerWeek > 2) recs.push('Rotes/verarbeitetes Fleisch auf ≤2×/Woche begrenzen.')
  if (a.ssbPerWeek > 1) recs.push('Zuckerhaltige Getränke durch Wasser/ungesüßten Tee ersetzen.')
  if (a.fastFoodPerWeek > 1) recs.push('Fastfood reduzieren; einfache Koch-Alternativen nutzen.')
  if (a.waterGlassesPerDay < 8) recs.push('Trinkmenge auf ~8 Gläser/Tag erhöhen (über den Tag verteilt).')
  if (a.breakfastDaysPerWeek < 4) recs.push('Frühstück an mehreren Tagen einplanen, um Heißhunger vorzubeugen.')
  if (a.lateNightDaysPerWeek > 2) recs.push('Spätes Essen reduzieren; letzte Mahlzeit ~2–3 h vor dem Schlaf.')
  if (a.mealRegularity < 3) recs.push('Regelmäßige Mahlzeiten (2–4/Tag) mit Pausen dazwischen etablieren.')
  if (a.mindfulEating < 3) recs.push('Achtsames Essen: langsam, gut kauen, Ablenkungen minimieren.')
  if (a.cookAtHomeDaysPerWeek < 3) recs.push('Mehr Zuhause kochen — Planung & Batch‑Cooking.')
  return { diet, beh, recs }
}

function tfeqBasedRecs(scores: {CR:number, UE:number, EE:number}){
  const out: string[] = []
  if (scores.UE >= 60) out.push('Unkontrolliertes Essen: Trigger erkennen (Umgebung, Snacks sicht-/greifbar), Proteinziel pro Mahlzeit, strukturierte Mahlzeiten.')
  if (scores.EE >= 60) out.push('Emotionales Essen: Alternativstrategien (kurzer Spaziergang, Atemübungen), Mahlzeitenrhythmus, ggf. psychologische Unterstützung.')
  if (scores.CR >= 70) out.push('Sehr hohe kognitive Kontrolle: Flexibilität kultivieren (80/20‑Prinzip), Schwarz‑Weiß‑Denken vermeiden.')
  if (scores.CR <= 30) out.push('Niedrige kognitive Kontrolle: einfache Leitplanken (Tellermodell, Einkaufsliste, Essensplanung).')
  return out
}

function asMarkdown(p: Patient, a: Answers, summary: any){
  const lines: string[] = []
  lines.push(`# Ernährungsanamnese & Auswertung`)
  lines.push('')
  const b = bmi(p.groesseCm, p.gewichtKg)
  lines.push(`**Patient:** ${p.vorname || '—'}  |  **Alter:** ${p.alter}  |  **Geschlecht:** ${p.sex}`)
  lines.push(`**Größe:** ${p.groesseCm} cm  |  **Gewicht:** ${p.gewichtKg} kg  |  **BMI:** ${fmt1(b.bmi)} (${b.cat})`)
  lines.push(`**Beruf:** ${p.beruf || '—'}`)
  lines.push('')
  lines.push(`## Scores`)
  lines.push(`- Ernährung: **${fmt1(summary.diet)} / 100**`)
  lines.push(`- Essverhalten: **${fmt1(summary.beh)} / 100**`)
  lines.push(`- MNA‑SF Summe: **${summary.mnaSum}** — ${mnaClass(summary.mnaSum)}`)
  lines.push(`- TFEQ‑R18 — CR: **${fmt1(summary.tfeq.CR)}**, UE: **${fmt1(summary.tfeq.UE)}**, EE: **${fmt1(summary.tfeq.EE)}**`)
  lines.push('')
  if (summary.contextNotes.length){
    lines.push('## Kontextbezogene Hinweise')
    summary.contextNotes.forEach((x:string)=>lines.push(`- ${x}`))
  }
  if (summary.recs.length){
    lines.push('')
    lines.push('## Handlungsempfehlungen (Ernährung & Verhalten)')
    summary.recs.forEach((x:string)=>lines.push(`- ${x}`))
  }
  if (summary.tfeqRecs.length){
    lines.push('')
    lines.push('## Empfehlungen basierend auf Essverhalten (TFEQ‑Profil)')
    summary.tfeqRecs.forEach((x:string)=>lines.push(`- ${x}`))
  }
  if (summary.log.days){
    lines.push('')
    lines.push('## 3‑Tage‑Protokoll (Zusammenfassung)')
    lines.push(`- Erfasste Tage: ${summary.log.days}`)
    lines.push(`- Ø Mahlzeiten/Tag: ${fmt1(summary.log.mealsPerDay)}`)
    lines.push(`- Ø Obst+Gemüse/Tag: ${fmt1(summary.log.avgFruitVeg)} Portionen`)
    lines.push(`- Ø zuckerhaltige Getränke/Tag: ${fmt1(summary.log.avgSugary)}`)
    if (summary.log.kcalPerDay) lines.push(`- Ø geschätzte kcal/Tag: ${fmt1(summary.log.kcalPerDay)}`)
  }
  lines.push('')
  lines.push('> Hinweis: Dieser Report dient der Information und ersetzt keine individuelle medizinische Beratung, Diagnose oder Therapie.')
  return lines.join('\n')
}

export default function App(){
  const [patient, setPatient] = useState<Patient>(()=>{
    const raw = localStorage.getItem('patient_v1')
    return raw? JSON.parse(raw) as Patient : defaultPatient
  })
  const [a, setA] = useState<Answers>(()=>{
    const raw = localStorage.getItem('answers_v2')
    return raw? { ...defaultAnswers, ...JSON.parse(raw) } as Answers : defaultAnswers
  })
  const [report, setReport] = useState<any | null>(null)
  const [showLogForm, setShowLogForm] = useState(false)
  const [logDraft, setLogDraft] = useState<DietEntry>({date:'', meal:'Frühstück', time:'', description:'', portionsFruitVeg:0, sugaryDrinks:0, kcal:0})

  useEffect(()=>{ localStorage.setItem('patient_v1', JSON.stringify(patient)) }, [patient])
  useEffect(()=>{ localStorage.setItem('answers_v2', JSON.stringify(a)) }, [a])

  const bObj = useMemo(()=>bmi(patient.groesseCm, patient.gewichtKg),[patient.groesseCm, patient.gewichtKg])
  const diet = useMemo(()=>healthyDietScore(a),[a])
  const beh = useMemo(()=>behaviorScore(a),[a])
  const mnaSum = useMemo(()=>a.mnaSfItems.reduce((s,x)=>s+toNum(x),0),[a.mnaSfItems])
  const tfeq = useMemo(()=>tfeqScores(a.tfeqItems),[a.tfeqItems])
  const lmetrics = useMemo(()=>logMetrics(a.log),[a.log])

  function analyze(){
    const base = recsFromProfiles(a)
    const contextNotes = contextualNotes(patient, a)
    const tRecs = tfeqBasedRecs(tfeq)
    const summary = {
      diet: base.diet, beh: base.beh,
      mnaSum, tfeq, log: lmetrics,
      contextNotes,
      recs: base.recs,
      tfeqRecs: tRecs
    }
    setReport(summary)
    window.scrollTo({top:0, behavior:'smooth'})
  }

  function download(name: string, content: string, mime='application/json'){
    const blob = new Blob([content], {type: mime})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  
  async function sendEmail(){
    if (!report){
      alert('Bitte erst die Auswertung erstellen.')
      return
    }
    const md = asMarkdown(patient, a, report)
    try{
      const { EMAIL_PROVIDER, EMAILJS, FORMSPREE } = await import('./config')
      if (EMAIL_PROVIDER === 'emailjs'){
        const payload = {
          service_id: EMAILJS.service_id,
          template_id: EMAILJS.template_id,
          user_id: EMAILJS.public_key,
          accessToken: EMAILJS.public_key,
          template_params: {
            to_email: EMAILJS.to_email,
            subject: `Auswertung Ernährungsanamnese – ${patient.vorname || 'Patient'}`,
            message: md,
          }
        }
        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error(await res.text())
        alert('E-Mail wurde über EmailJS versendet (falls korrekt konfiguriert).')
      } else if (EMAIL_PROVIDER === 'formspree'){
        const res = await fetch(FORMSPREE.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            email: FORMSPREE.to_email,
            subject: `Auswertung Ernährungsanamnese – ${patient.vorname || 'Patient'}`,
            message: md
          })
        })
        if (!res.ok) throw new Error(await res.text())
        alert('E-Mail an Formspree übermittelt (falls Endpoint korrekt ist).')
      } else {
        alert('E-Mail-Versand ist deaktiviert. Bitte in src/config.ts konfigurieren.')
      }
    } catch (e:any){
      alert('E-Mail-Versand fehlgeschlagen: ' + e.message)
    }
  }

  function copyMarkdown(){
    if (!report) return
    const md = asMarkdown(patient, a, report)
    navigator.clipboard.writeText(md)
    alert('Markdown in die Zwischenablage kopiert.')
  }

  function Field({label, children, hint}:{label:string, children:React.ReactNode, hint?:string}){
    return (<label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>)
  }

  function Row({children}:{children:React.ReactNode}){
    return <div className="grid md:grid-cols-2 gap-4">{children}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 text-gray-900">
      <header className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold">Ernährungsanamnese & Analyse</h1>
        <p className="text-sm text-gray-600 mt-1">Validierte Elemente: MNA‑SF (Punkteeingabe), TFEQ‑R18 (ohne Itemwortlaut) + 3‑Tage‑Protokoll. Enthält personalisierte, qualitative Hinweise zu Alter & Beruf.</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-24">
        {report && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/80 rounded-2xl border p-4">
              <div className="text-sm text-gray-500">BMI</div>
              <div className="text-2xl font-semibold">{fmt1(bObj.bmi)}</div>
              <div className="text-sm">{bObj.cat}</div>
            </div>
            <div className="bg-white/80 rounded-2xl border p-4">
              <div className="text-sm text-gray-500">Ernährungs‑Score</div>
              <div className="text-2xl font-semibold">{fmt1(diet)} / 100</div>
              <div className="w-full h-2 bg-gray-100 rounded mt-2"><div className="h-2 rounded bg-emerald-400" style={{width: `${diet}%`}}/></div>
            </div>
            <div className="bg-white/80 rounded-2xl border p-4">
              <div className="text-sm text-gray-500">Essverhalten</div>
              <div className="text-2xl font-semibold">{fmt1(beh)} / 100</div>
              <div className="w-full h-2 bg-gray-100 rounded mt-2"><div className="h-2 rounded bg-teal-400" style={{width: `${beh}%`}}/></div>
            </div>
          </div>
        )}

        <section className="bg-white/70 rounded-2xl shadow-sm border p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">1) Patientendaten</h2>
          <Row>
            <Field label="Vorname">
              <input className="input" value={patient.vorname} onChange={e=>setPatient({...patient, vorname: e.target.value})}/>
            </Field>
            <Field label="Geschlecht">
              <select className="input" value={patient.sex} onChange={e=>setPatient({...patient, sex: e.target.value as Sex})}>
                <option>keine Angabe</option>
                <option>weiblich</option>
                <option>männlich</option>
                <option>divers</option>
              </select>
            </Field>
          </Row>
          <Row>
            <Field label="Alter (Jahre)">
              <input type="number" className="input" value={patient.alter} onChange={e=>setPatient({...patient, alter: toNum(e.target.value)})}/>
            </Field>
            <Field label="Beruf">
              <input className="input" value={patient.beruf} onChange={e=>setPatient({...patient, beruf: e.target.value})}/>
            </Field>
          </Row>
          <Row>
            <Field label="Größe (cm)">
              <input type="number" className="input" value={patient.groesseCm} onChange={e=>setPatient({...patient, groesseCm: toNum(e.target.value)})}/>
            </Field>
            <Field label="Gewicht (kg)">
              <input type="number" className="input" value={patient.gewichtKg} onChange={e=>setPatient({...patient, gewichtKg: toNum(e.target.value)})}/>
            </Field>
          </Row>
          <div className="text-sm text-gray-600 mt-2">BMI: <strong>{bObj.bmi? fmt1(bObj.bmi): '–'}</strong> ({bObj.cat})</div>
        </section>

        <section className="bg-white/70 rounded-2xl shadow-sm border p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">2) Ziele & Muster</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Ernährungsmuster</label>
              <select className="input mt-1" value={a.pattern} onChange={e=>setA({...a, pattern: e.target.value as any})}>
                <option value="omnivor">omnivor</option>
                <option value="pescetarisch">pescetarisch</option>
                <option value="vegetarisch">vegetarisch</option>
                <option value="vegan">vegan</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Ziele</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Gewichtsmanagement','Essverhalten','Chronische Erkrankungen','Nährstoffmangel','Darmgesundheit','Performance'].map(g=>(
                  <button key={g} type="button" onClick={()=>setA({...a, goals: a.goals.includes(g) ? a.goals.filter(x=>x!==g) : [...a.goals, g]})} className={\`px-3 py-1 rounded-full border \${a.goals.includes(g)? 'bg-emerald-100 border-emerald-400':'bg-white hover:bg-gray-50'}\`}>{g}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/70 rounded-2xl shadow-sm border p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">3) MNA‑SF (Punkteeingabe)</h2>
          <p className="text-sm text-gray-600 mb-3">Geben Sie die Punkte je Item gemäß lizenziertem Fragebogen ein (Summe 0–14).</p>
          <div className="grid md:grid-cols-3 gap-4">
            {a.mnaSfItems.map((v, i)=>(
              <label key={i} className="flex flex-col gap-1">
                <span className="text-sm">Item {i+1} (Punkte)</span>
                <input type="number" className="input" value={v} onChange={e=>{
                  const arr = [...a.mnaSfItems]; arr[i] = toNum(e.target.value); setA({...a, mnaSfItems: arr})
                }}/>
              </label>
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-2">Summe: <strong>{mnaSum}</strong> — {mnaClass(mnaSum)}</div>
        </section>

        <section className="bg-white/70 rounded-2xl shadow-sm border p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">4) TFEQ‑R18 (Likert 1–4)</h2>
          <p className="text-sm text-gray-600 mb-3">Tragen Sie die Antworten 1–4 je Item ein (ohne Itemwortlaut; Lizenz beachten).</p>
          <div className="grid md:grid-cols-3 gap-4">
            {a.tfeqItems.map((v, i)=>(
              <label key={i} className="flex flex-col gap-1">
                <span className="text-sm">Item {i+1}</span>
                <input type="number" min={1} max={4} className="input" value={v} onChange={e=>{
                  const arr = [...a.tfeqItems]; arr[i] = toNum(e.target.value); setA({...a, tfeqItems: arr})
                }}/>
              </label>
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-2">CR: <strong>{fmt1(tfeq.CR)}</strong> — UE: <strong>{fmt1(tfeq.UE)}</strong> — EE: <strong>{fmt1(tfeq.EE)}</strong></div>
        </section>

        <section className="bg-white/70 rounded-2xl shadow-sm border p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">5) Aufnahmehäufigkeiten</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {([
              ['Obst pro Tag (Portionen)','fruitPerDay',10],
              ['Gemüse pro Tag (Portionen)','vegPerDay',12],
              ['Vollkorn pro Tag (Portionen)','wholeGrainPerDay',8],
              ['Hülsenfrüchte pro Woche (Portionen)','legumesPerWeek',14],
              ['Nüsse/Samen pro Woche (Portionen)','nutsPerWeek',14],
              ['Fisch pro Woche (Portionen)','fishPerWeek',10],
              ['Milchprodukte pro Tag (Portionen)','dairyPerDay',6],
              ['Rotes/verarbeitetes Fleisch pro Woche (Portionen)','redProcessedMeatPerWeek',14],
              ['Süßigkeiten pro Woche (Portionen)','sweetsPerWeek',21],
              ['Salzige Snacks pro Woche (Portionen)','saltySnacksPerWeek',21],
              ['Fastfood pro Woche (Mahlzeiten)','fastFoodPerWeek',14],
              ['Zuckerhaltige Getränke pro Woche','ssbPerWeek',21],
              ['Alkoholische Getränke pro Woche','alcoholDrinksPerWeek',40],
              ['Wasser pro Tag (Gläser ~250 ml)','waterGlassesPerDay',20],
            ] as const).map(([label, key, max])=> (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-sm">{label}</span>
                <input type="number" min={0} max={max} className="input" value={(a as any)[key]} onChange={e=>setA({...a, [key]: toNum(e.target.value)} as any)}/>
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white/70 rounded-2xl shadow-sm border p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">6) Essverhalten & Symptome</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {([
              ['Frühstückstage/Woche','breakfastDaysPerWeek',7],
              ['Spätes Essen/Woche','lateNightDaysPerWeek',7],
              ['Mahlzeiten‑Regelmäßigkeit (1–5)','mealRegularity',5],
              ['Achtsames Essen (1–5)','mindfulEating',5],
              ['Zuhause kochen (Tage/Woche)','cookAtHomeDaysPerWeek',7],
              ['Blähungen (0–3)','bloating',3],
              ['Sodbrennen (0–3)','heartburn',3],
              ['Verstopfung (Tage/Woche)','constipationDays',7],
              ['Durchfall (Tage/Woche)','diarrheaDays',7],
              ['Energiedip nach Mahlzeiten (0–3)','energyDipAfterMeals',3],
              ['Süßhunger (0–3)','sweetCravings',3],
              ['Salzig‑Gelüste (0–3)','saltyCravings',3],
              ['Stress (0–3)','stress',3],
              ['Schlafstunden/Nacht','sleepHours',12],
            ] as const).map(([label, key, max])=> (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-sm">{label}</span>
                <input type="number" min={0} max={max} className="input" value={(a as any)[key]} onChange={e=>setA({...a, [key]: toNum(e.target.value)} as any)}/>
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white/70 rounded-2xl shadow-sm border p-5 mb-6">
          <h2 className="text-xl font-semibold mb-4">7) 3‑Tage‑Ernährungsprotokoll</h2>
          <div className="flex gap-2 mb-3">
            <button type="button" className="btn" onClick={()=>setShowLogForm(s=>!s)}>{showLogForm? 'Protokoll-Eintrag verbergen':'Protokoll-Eintrag hinzufügen'}</button>
          </div>
          {showLogForm && (
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm">Datum (YYYY-MM-DD)</span>
                <input className="input" value={logDraft.date} onChange={e=>setLogDraft({...logDraft, date: e.target.value})}/>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">Zeit</span>
                <input className="input" value={logDraft.time} onChange={e=>setLogDraft({...logDraft, time: e.target.value})}/>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">Mahlzeit</span>
                <select className="input" value={logDraft.meal} onChange={e=>setLogDraft({...logDraft, meal: e.target.value as any})}>
                  <option>Frühstück</option><option>Mittag</option><option>Abend</option><option>Snack</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 md:col-span-3">
                <span className="text-sm">Beschreibung</span>
                <input className="input" value={logDraft.description} onChange={e=>setLogDraft({...logDraft, description: e.target.value})}/>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">Obst+Gemüse (Port.)</span>
                <input type="number" className="input" value={logDraft.portionsFruitVeg||0} onChange={e=>setLogDraft({...logDraft, portionsFruitVeg: toNum(e.target.value)})}/>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">Zuckerhaltige Getränke</span>
                <input type="number" className="input" value={logDraft.sugaryDrinks||0} onChange={e=>setLogDraft({...logDraft, sugaryDrinks: toNum(e.target.value)})}/>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">Schätzwert kcal</span>
                <input type="number" className="input" value={logDraft.kcal||0} onChange={e=>setLogDraft({...logDraft, kcal: toNum(e.target.value)})}/>
              </label>
              <div className="md:col-span-3">
                <button type="button" className="btn-primary" onClick={()=>{
                  setA({...a, log: [...a.log, logDraft]})
                  setLogDraft({date:'', meal:'Frühstück', time:'', description:'', portionsFruitVeg:0, sugaryDrinks:0, kcal:0})
                  setShowLogForm(false)
                }}>Eintrag speichern</button>
              </div>
            </div>
          )}
          {a.log.length? (
            <div className="text-sm text-gray-700">
              <div className="font-medium mb-1">Erfasste Einträge</div>
              <ul className="list-disc pl-5">
                {a.log.map((e, idx)=>(<li key={idx}>{e.date} {e.time} — {e.meal}: {e.description}</li>))}
              </ul>
              <div className="mt-2 text-xs text-gray-600">Ø Mahlzeiten/Tag: {fmt1(lmetrics.mealsPerDay)} | Ø Obst+Gemüse/Tag: {fmt1(lmetrics.avgFruitVeg)} | Ø SSB/Tag: {fmt1(lmetrics.avgSugary)} {lmetrics.kcalPerDay? \`| Ø kcal/Tag: \${fmt1(lmetrics.kcalPerDay)}\` : ''}</div>
            </div>
          ) : <p className="text-sm text-gray-600">Noch keine Einträge.</p>}
        </section>

        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={analyze}>Auswertung erstellen</button>
          <button className="btn" onClick={()=>{
            const payload = { patient, answers: a }
            const json = JSON.stringify(payload, null, 2)
            const blob = new Blob([json], {type: 'application/json'})
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url; link.download = 'anamnese-daten.json'; link.click()
            URL.revokeObjectURL(url)
          }}>Daten exportieren (JSON)</button>
          {report && <>
            <button className="btn" onClick={copyMarkdown}>Report als Markdown kopieren</button>
            <button className="btn" onClick={()=>window.print()}>Als PDF drucken</button>
            <button className="btn" onClick={sendEmail}>Ergebnis per E-Mail senden</button>
          </>}
          <button className="btn-outline" onClick={()=>{ localStorage.removeItem('patient_v1'); localStorage.removeItem('answers_v2'); location.reload() }}>Zurücksetzen</button>
        </div>

        {report && (
          <div className="mt-8 space-y-6">
            <section className="bg-white/70 rounded-2xl shadow-sm border p-5">
              <h2 className="text-xl font-semibold mb-2">Ergebnis — Übersicht</h2>
              <p className="text-sm text-gray-700"><strong>Kontext:</strong> {(contextualNotes(patient, a)).join(' • ') || '—'}</p>
              <p className="text-sm text-gray-700 mt-2"><strong>MNA‑SF:</strong> {mnaClass(mnaSum)} | <strong>TFEQ‑Profile:</strong> CR {fmt1(tfeq.CR)} · UE {fmt1(tfeq.UE)} · EE {fmt1(tfeq.EE)}</p>
            </section>
            <section className="bg-white/70 rounded-2xl shadow-sm border p-5">
              <h2 className="text-xl font-semibold mb-2">Handlungsempfehlungen (Ernährung & Verhalten)</h2>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {recsFromProfiles(a).recs.map((r,i)=>(<li key={i}>{r}</li>))}
                {tfeqBasedRecs(tfeq).map((r,i)=>(<li key={'t'+i}>{r}</li>))}
              </ul>
            </section>
            <section className="bg-white/70 rounded-2xl shadow-sm border p-5">
              <h2 className="text-xl font-semibold mb-2">Zusatz: Beratungsfokus nach Zielsetzung</h2>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {a.goals.includes('Gewichtsmanagement') && <li>Gewichtsmanagement: moderates Defizit (−300 bis −500 kcal/Tag) oder Erhalt; Proteinziel ~1.2–1.6 g/kg, hohe Sättigungsdichte (Gemüse, Vollkorn, Hülsenfrüchte), Energiegetränke/SSB reduzieren.</li>}
                {a.goals.includes('Essverhalten') && <li>Essverhalten: feste Mahlzeitenstruktur, Snack-Qualität, achtsames Essen, Trigger-Management, Schlaf & Stress adressieren.</li>}
                {a.goals.includes('Chronische Erkrankungen') && <li>Chronische Erkrankungen: ärztliche Therapieplanung beachten; mediterranes Muster, Salz-/Zuckerreduktion je Indikation; individuelle Medikation/Interaktionen berücksichtigen.</li>}
                {a.goals.includes('Nährstoffmangel') && <li>Nährstoffmangel: Blutwerte prüfen (B12, Ferritin, Vitamin D je Kontext); anreichern/fortifizieren; ggf. Supplemente nach Rücksprache.</li>}
                {a.goals.includes('Darmgesundheit') && <li>Darmgesundheit: Ballaststoffe 25–35 g/Tag, schrittweise steigern; fermentierte Lebensmittel; Trigger individuell beobachten.</li>}
                {a.goals.includes('Performance') && <li>Performance: Proteinziel, Carbo‑Timing rund ums Training, Hydration & Elektrolyte, Schlafoptimierung.</li>}
              </ul>
              <p className="text-xs text-gray-500 mt-3">Wichtiger Hinweis: Diese Empfehlungen ersetzen keine medizinische Diagnose/Therapie und sind als allgemeine Orientierung zu verstehen.</p>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
