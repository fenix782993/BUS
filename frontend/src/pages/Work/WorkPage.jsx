import {useEffect,useMemo,useState} from 'react';
import {BriefcaseBusiness,Clock,Zap,CarTaxiFront,Truck,HardHat,Coffee,Wrench,Code2,Timer,ShoppingCart,RotateCcw,CheckCircle2} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import {get,post} from '../../api/client';
const ICONS={courier:Truck,taxi:CarTaxiFront,construction:HardHat,mechanic:Wrench,driver:Truck,developer:Code2};
export default function WorkPage({player,refresh}){
 const [jobs,setJobs]=useState([]),[active,setActive]=useState(null),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false),[tick,setTick]=useState(0);
 const load=async()=>{try{const d=await get('/api/work/status');setActive(d.active);if(d.completed?.length){setMsg(`${d.completed[0].title}: +${d.completed[0].reward.toLocaleString('ru-RU')} ₽ · +${d.completed[0].xp} XP`);refresh()}}catch(e){setMsg(e.message)}};
 useEffect(()=>{get('/api/work/jobs').then(d=>setJobs(d.jobs||[])).catch(()=>{});load()},[]);
 useEffect(()=>{const t=setInterval(()=>setTick(x=>x+1),1000);return()=>clearInterval(t)},[]);
 useEffect(()=>{if(active)load()},[tick]);
 const remaining=useMemo(()=>active?Math.max(0,Math.ceil((new Date(active.finish_at)-Date.now())/1000)):0,[active,tick]);
 async function start(code){setBusy(true);setMsg('');try{const d=await post('/api/work/start',{job_code:code});setActive(d.active);refresh()}catch(e){setMsg(e.message)}finally{setBusy(false)}}
 async function rest(){setBusy(true);try{const d=await post(`/api/player/${player.id}/rest`);setMsg('Отдых: энергия восстановлена на 35%');refresh();}catch(e){setMsg(e.message)}finally{setBusy(false)}}
 async function buyEnergy(){setBusy(true);try{await post('/api/energy/buy');setMsg('Энергия восстановлена за 35 FC');refresh()}catch(e){setMsg(e.message)}finally{setBusy(false)}}
 return <>
  <PageHeader title="РАБОТА" subtitle="Реальные смены: начни работу, подожди завершения и получи оплату."/>
  <div className="work-hero live-work"><div><span className="eyebrow">ЭНЕРГИЯ · АВТОРЕГЕНЕРАЦИЯ</span><strong>{player.energy}%</strong><p>+1 энергия каждую минуту до 100%. Отдых и Energy Pack восстанавливают быстрее.</p></div><div className="work-hero-actions"><button onClick={rest} disabled={busy}><Coffee size={18}/> Отдохнуть +35</button><button className="ghost-orange" onClick={buyEnergy} disabled={busy}><ShoppingCart size={18}/> 35 FC → 100%</button></div></div>
  {active&&<Card className="active-shift"><div className="active-shift-top"><div><span className="badge live">● LIVE SHIFT</span><h2>{active.title}</h2><p>Смена идёт автоматически. Можно оставить страницу открытой или вернуться позже.</p></div><div className="shift-timer"><Timer size={22}/><b>{remaining}с</b></div></div><div className="shift-progress"><span style={{width:`${Math.max(0,Math.min(100,active.progress+(active.duration-remaining)/Math.max(1,active.duration)*100-active.progress))}%`}}/></div><div className="shift-meta"><span>Награда после смены</span><strong>≈ {Math.round(active.duration?active.duration:0)}с</strong></div></Card>}
  <div className="cards work-grid real-jobs">{jobs.map(job=>{const Icon=ICONS[job.code]||BriefcaseBusiness;const disabled=busy||!!active||player.energy<job.energy;return <Card key={job.code} className="work-card real-job"><div className="job-art"><div className="job-icon"><Icon size={30}/></div><span className="job-glow"/></div><span className="badge">СМЕНА · {job.duration} СЕК</span><h2>{job.title}</h2><p>{job.desc}</p><div className="job-specs"><span><Zap size={15}/> -{job.energy}</span><span><Clock size={15}/> {job.duration}с</span><span><BriefcaseBusiness size={15}/> +{job.xp} XP</span></div><div className="job-bottom"><strong>+{(job.reward+player.level*140).toLocaleString('ru-RU')} ₽</strong><button disabled={disabled} onClick={()=>start(job.code)}>{active?'Смена идёт':player.energy<job.energy?'Нет энергии':'Начать смену'}</button></div></Card>})}</div>
  <Card className="work-loop"><div className="section-title"><div><span className="eyebrow">ИГРОВОЙ ЦИКЛ</span><h2>РАБОТАЙ → ЗАРАБАТЫВАЙ → РАЗВИВАЙСЯ</h2></div><CheckCircle2/></div><div className="loop-steps"><span>🚕 Смена</span><i>→</i><span>💰 ₽ + XP</span><i>→</i><span>🚗 Машина</span><i>→</i><span>🏢 Бизнес</span><i>→</i><span>📈 Капитал</span></div></Card>
  {msg&&<div className="notice">{msg}</div>}
 </>
}
