import {useEffect,useState} from 'react';
import {MapPinned, Zap, Gift, CarFront, Dumbbell, MoonStar, Handshake, Building2, Trophy, Timer, Flame, RefreshCw} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import {get,post} from '../../api/client';

const ACTIONS=[
 {id:'center',title:'Центр',desc:'Прогуляться и поймать городской поток',icon:MapPinned},
 {id:'port',title:'Порт',desc:'Быстрая подработка у грузовых терминалов',icon:Building2},
 {id:'nightlife',title:'Ночная жизнь',desc:'Активность и репутация после заката',icon:MoonStar},
 {id:'gym',title:'Тренировка',desc:'Восстановить форму и получить XP',icon:Dumbbell},
 {id:'deal',title:'Уличная сделка',desc:'Рискованная, но прибыльная операция',icon:Handshake},
];
export default function CityPage(){
 const[live,setLive]=useState(null),[raceCars,setRaceCars]=useState([]),[history,setHistory]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function load(){try{const me=await get('/api/me');const [c,h,v]=await Promise.all([get('/api/city/live'),get('/api/race/history'),get('/api/player/'+me.id+'/vehicles').catch(()=>[])]);setLive(c);setHistory(h);setRaceCars(v)}catch{}}
 useEffect(()=>{load();const t=setInterval(load,10000);return()=>clearInterval(t)},[]);
 async function action(id){setBusy(true);setMessage('');try{const r=await post('/api/city/action',{action:id});setMessage(`${r.title}: +${Math.round(r.reward).toLocaleString('ru-RU')} ₽ · +${r.xp} XP`);load()}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 async function bonus(){setBusy(true);try{const r=await post('/api/daily-bonus');setMessage(`Ежедневный бонус: +${r.cash.toLocaleString('ru-RU')} ₽ · +${r.coins} FC`);load()}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 async function race(id,difficulty){setBusy(true);try{const r=await post('/api/race/start',{player_vehicle_id:Number(id),difficulty});setMessage(`${r.result==='win'?'🏆 Победа':'🏁 Финиш'} против ${r.opponent}: +${r.reward.toLocaleString('ru-RU')} ₽ · +${r.xp} XP`);load()}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 return <>
  <PageHeader title="FENIX CITY" subtitle="Живой город: активности, ежедневные награды, районы и уличные гонки." action="Обновить" onAction={load}/>
  <section className="city-v3-hero"><div><span className="eyebrow">LIVE CITY · SERVER TIME</span><h1>Город не стоит на месте.</h1><p>Заходи в районы, получай награды, тренируйся, рискуй и прокачивай свой автомобиль.</p><div className="city-live-stats"><span><b>{live?.online||0}</b> игроков</span><span><b>{live?.districts?.filter(x=>x.activity>60).length||0}</b> активных районов</span><span><b>LIVE</b> экономика</span></div></div><div className="city-signal"><span></span><span></span><span></span><b>F</b></div></section>
  <div className="city-v3-grid">
   <Card className="city-actions-card"><div className="section-title"><div><span className="eyebrow">CITY ACTIONS</span><h2>Активности</h2></div><Timer size={18}/></div><div className="city-actions-grid">{ACTIONS.map(({id,title,desc,icon:Icon})=><button className="city-action" disabled={busy||live?.city_action_cooldown>0} onClick={()=>action(id)} key={id}><Icon/><b>{title}</b><span>{desc}</span><small>{live?.city_action_cooldown>0?`${live.city_action_cooldown}с`:'доступно'}</small></button>)}</div>{message&&<div className="city-result">{message}</div>}</Card>
   <Card className="daily-card"><div className="daily-orb"><Gift size={30}/></div><span className="eyebrow">DAILY DROP</span><h2>Ежедневная награда</h2><p>Каждый день забирай RUB, FC и XP. Сервер сам контролирует таймер.</p><button disabled={busy||live?.daily_bonus_cooldown>0} onClick={bonus}><Gift size={16}/>{live?.daily_bonus_cooldown>0?'Уже получено':'Забрать бонус'}</button></Card>
  </div>
  <Card><div className="section-title"><div><span className="eyebrow">CITY MAP</span><h2>Районы FENIX CITY</h2></div><MapPinned size={18}/></div><div className="district-live-grid">{(live?.districts||[]).map(d=><div className="district-live-card" key={d.id}><div className="district-ring" style={{'--p':`${d.activity*3.6}deg`}}><b>{d.activity}%</b></div><div><h3>{d.name}</h3><span>Множитель дохода ×{d.income_bonus}</span></div><strong className={d.activity>60?'hot':''}>{d.activity>60?'АКТИВЕН':'СПОКОЙНО'}</strong></div>)}</div></Card>
  <Card className="race-card"><div className="section-title"><div><span className="eyebrow">STREET RACING</span><h2><CarFront/> Уличные гонки</h2></div><Flame size={18}/></div><p className="muted">Выбери свою машину. Победа приносит деньги и XP, поражение всё равно даёт опыт. Автомобиль получает износ.</p>{raceCars.length?<div className="race-grid">{raceCars.slice(0,6).map(car=><div className="race-car" key={car.id}><div className="race-art"><CarFront size={44}/><span>{car.class_name}</span></div><b>{car.name}</b><small>{car.speed} км/ч · управление {car.handling}</small><div className="race-buttons"><button disabled={busy} onClick={()=>race(car.id,'normal')}>Гонка</button><button className="ghost" disabled={busy} onClick={()=>race(car.id,'hard')}>HARD</button></div></div>)}</div>:<div className="empty-state"><CarFront size={32}/><b>Нет автомобилей</b><span>Купи машину в гараже, чтобы выйти на улицу.</span></div>}</Card>
  <Card><div className="section-title"><div><span className="eyebrow">RACE HISTORY</span><h2>Последние заезды</h2></div><RefreshCw size={16}/></div>{history.length?<div className="race-history">{history.map(r=><div key={r.id}><span className={r.result==='win'?'race-win':'race-loss'}>{r.result==='win'?'ПОБЕДА':'ПОРАЖЕНИЕ'}</span><b>{r.opponent}</b><small>{r.difficulty} · +{r.reward.toLocaleString('ru-RU')} ₽ · +{r.xp} XP</small></div>)}</div>:<div className="muted">История появится после первой гонки.</div>}</Card>
 </>
}
