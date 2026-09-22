import {useEffect,useState} from 'react';
import {Wallet,Coins,Zap,TrendingUp,BrainCircuit,ArrowRight,CarFront,Building2,Home,Activity,MapPinned,BriefcaseBusiness,ShieldCheck} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import ProgressBar from '../../components/common/ProgressBar';
import StatCard from '../../components/common/StatCard';
import {getMissions} from '../../api/missions';
import {get} from '../../api/client';

export default function DashboardPage({player,onWork,onNavigate}){
 const[m,setM]=useState([]),[ai,setAi]=useState(null),[city,setCity]=useState([]);
 useEffect(()=>{
   getMissions().then(setM).catch(()=>{});
   get('/api/ai/advice').then(setAi).catch(()=>{});
   get('/api/districts').then(setCity).catch(()=>{});
 },[player]);
 const activeDistricts=city.filter(x=>Number(x.activity||0)>55).slice(0,3);
 return <>
  <PageHeader title={`ДОБРО ПОЖАЛОВАТЬ, ${player.nickname.toUpperCase()}`} subtitle="FENIX CITY V3 — живая экономика, карьера, транспорт, бизнес и социальная жизнь." action="НАЧАТЬ СМЕНУ" onAction={onWork}/>

  <section className="city-hero-card">
   <div className="city-hero-copy">
    <span className="eyebrow">FENIX CITY · LIVE WORLD</span>
    <h1>Твой город<br/><em>твой капитал.</em></h1>
    <p>Работай, покупай транспорт, развивай бизнес, управляй активами и соревнуйся с другими игроками.</p>
    <div className="hero-actions">
      <button onClick={onWork}><BriefcaseBusiness size={18}/> Начать работу</button>
      <button className="ghost" onClick={()=>onNavigate?.('city')}><MapPinned size={18}/> Открыть город</button>
    </div>
   </div>
   <div className="city-hero-visual" aria-hidden="true">
    <div className="city-orbit orbit-one"/><div className="city-orbit orbit-two"/>
    <div className="city-core"><span>F</span><small>CITY</small></div>
    <div className="city-tile tile-a">HQ</div><div className="city-tile tile-b">BANK</div><div className="city-tile tile-c">CAR</div><div className="city-tile tile-d">PORT</div>
   </div>
  </section>

  <div className="stats">
   <StatCard icon={<Wallet/>} title="Баланс" value={`${Math.round(player.cash).toLocaleString('ru-RU')} ₽`}/>
   <StatCard icon={<Coins/>} title="FENIX Coins" value={`${player.coins} FC`}/>
   <StatCard icon={<Zap/>} title="Энергия" value={`${player.energy}%`}/>
   <StatCard icon={<TrendingUp/>} title="Репутация" value={player.reputation}/>
  </div>

  <div className="dashboard-grid-top">
   <Card className="dashboard-progress-card">
    <div className="section-title"><div><span className="eyebrow">CAREER</span><h2>УРОВЕНЬ {player.level}</h2></div><span className="level-badge">LVL {player.level}</span></div>
    <ProgressBar value={player.level_progress}/>
    <div className="progress-numbers"><b>{player.xp} XP</b><span>до следующего уровня {player.next_level_xp}</span></div>
    <div className="career-mini"><span><Activity size={15}/> {player.jobs_completed} смен</span><span><Wallet size={15}/> {Math.round(player.total_earned).toLocaleString('ru-RU')} ₽ заработано</span></div>
   </Card>
   <Card className="ai-card"><div className="ai-orb"><BrainCircuit size={28}/></div><div><span className="eyebrow">FENIX AI</span><h2>{ai?.advice||'Анализирую твой прогресс…'}</h2><p>Персональный совет по капиталу, энергии, транспорту и развитию города.</p></div></Card>
  </div>

  <div className="quick-grid dashboard-actions">
   <button onClick={onWork}><Zap/><b>ЗАРАБОТАТЬ</b><span>Открыть смены</span><ArrowRight/></button>
   <button onClick={()=>onNavigate?.('garage')}><CarFront/><b>ГАРАЖ</b><span>Машины и тюнинг</span><ArrowRight/></button>
   <button onClick={()=>onNavigate?.('business')}><Building2/><b>БИЗНЕС</b><span>Доход и развитие</span><ArrowRight/></button>
   <button onClick={()=>onNavigate?.('properties')}><Home/><b>НЕДВИЖИМОСТЬ</b><span>Активы города</span><ArrowRight/></button>
  </div>

  <div className="dashboard-grid-bottom">
   <Card><div className="section-title"><div><span className="eyebrow">MISSIONS</span><h2>АКТИВНЫЕ ЗАДАЧИ</h2></div><span>{m.filter(x=>x.completed).length}/{m.length}</span></div>{m.slice(0,4).map(x=><div className="mission-row" key={x.id}><div><b>{x.title}</b><p>{x.description}</p></div><div className="mission-progress"><span>{x.progress}/{x.target}</span><ProgressBar value={x.target?x.progress/x.target*100:0}/></div></div>)}</Card>
   <Card><div className="section-title"><div><span className="eyebrow">CITY PULSE</span><h2>АКТИВНЫЕ РАЙОНЫ</h2></div><MapPinned size={20}/></div>{activeDistricts.length?activeDistricts.map(d=><div className="district-live-row" key={d.id}><div className="district-dot"/><div><b>{d.name}</b><span>{d.description}</span></div><strong>{d.activity}%</strong></div>):<div className="muted">Город собирает данные об активности районов.</div>}</Card>
  </div>

  <Card className="security-strip"><ShieldCheck size={20}/><div><b>FENIX CITY SERVER</b><span>Экономика, награды и операции проверяются сервером.</span></div><span className="online-dot">● ONLINE</span></Card>
 </>;
}
