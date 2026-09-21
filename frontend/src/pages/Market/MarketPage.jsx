import {useEffect,useMemo,useState} from 'react';
import {RefreshCw,TrendingDown,TrendingUp,ShoppingCart,ArrowDownToLine,WalletCards,ChartNoAxesCombined} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import {get,post} from '../../api/client';
export default function MarketPage({refresh}){
 const [assets,setAssets]=useState([]); const [busy,setBusy]=useState(false); const [qty,setQty]=useState({});
 const load=()=>get('/api/market').then(setAssets).catch(()=>{}); useEffect(()=>{load()},[]);
 const portfolio=useMemo(()=>assets.reduce((s,a)=>s+a.position_value,0),[assets]);
 async function tick(){setBusy(true);try{setAssets(await post('/api/market/tick'))}catch(e){alert(e.message)}finally{setBusy(false)}}
 async function trade(symbol,action){const q=Number(qty[symbol]||1);if(!Number.isInteger(q)||q<1||q>1000)return alert('Количество: от 1 до 1000');setBusy(true);try{await post(`/api/market/${action}`,{symbol,quantity:q});await load();refresh()}catch(e){alert(e.message)}finally{setBusy(false)}}
 return <><PageHeader title="Биржа" subtitle="Покупай активы, собирай портфель и продавай их обратно по текущей цене." action="Обновить котировки" onAction={tick}/>
 <div className="market-summary"><Card><WalletCards size={22}/><span>Портфель</span><strong>{portfolio.toLocaleString('ru-RU')} ₽</strong></Card><Card><ChartNoAxesCombined size={22}/><span>Активов</span><strong>{assets.filter(x=>x.owned>0).length}</strong></Card><Card><RefreshCw size={22}/><span>Статус</span><strong>LIVE</strong></Card></div>
 <div className="cards">{assets.map(a=>{const up=a.change>=0;return <Card key={a.symbol} className="market-card"><div className="market-card-top"><div><span className="badge">{a.symbol}</span><h2>{a.name}</h2></div>{up?<TrendingUp className="up"/>:<TrendingDown className="down"/>}</div><div className="price">{a.price.toLocaleString('ru-RU')} ₽</div><div className={up?'market-change up':'market-change down'}>{up?'+':''}{a.change}%</div><div className="market-meta"><span>Объём {a.volume.toLocaleString('ru-RU')}</span><span>У вас: <b>{a.owned}</b></span></div><div className="market-trade"><input type="number" min="1" max="1000" value={qty[a.symbol]||1} onChange={e=>setQty(v=>({...v,[a.symbol]:e.target.value}))}/><button disabled={busy} onClick={()=>trade(a.symbol,'buy')}><ShoppingCart size={16}/> Купить</button><button className="btn-sell" disabled={busy||!a.owned} onClick={()=>trade(a.symbol,'sell')}><ArrowDownToLine size={16}/> Продать</button></div>{a.owned>0&&<div className="position">Средняя: {a.average_price.toLocaleString('ru-RU')} ₽ · позиция {a.position_value.toLocaleString('ru-RU')} ₽</div>}</Card>})}</div>
 <Card><div className="section-title"><div><h2>Как работает биржа</h2><p className="muted">Цена меняется сервером. Покупка создаёт реальный портфель игрока, продажа возвращает ₽ по текущей котировке.</p></div><ChartNoAxesCombined/></div></Card></>}
