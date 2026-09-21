import {useEffect,useState} from 'react';
import {RefreshCw,TrendingDown,TrendingUp,ShoppingCart} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import {get,post} from '../../api/client';
export default function MarketPage({refresh}){
 const [assets,setAssets]=useState([]); const [busy,setBusy]=useState(false);
 const load=()=>get('/api/market').then(setAssets);
 useEffect(()=>{load()},[]);
 async function tick(){setBusy(true);try{setAssets(await post('/api/market/tick'))}finally{setBusy(false)}}
 async function buy(symbol){const q=Number(prompt(`Количество ${symbol}:`,'1'));if(!Number.isInteger(q)||q<1)return;try{await post('/api/market/buy',{symbol,quantity:q});refresh()}catch(e){alert(e.message)}}
 return <><PageHeader title="Рынок" subtitle="Живые серверные индексы и сделки." action="Обновить рынок" onAction={tick}/><div className="cards">{assets.map(a=>{const up=a.change>=0;return <Card key={a.symbol}><div className="section-title"><div><span className="badge">{a.symbol}</span><h2>{a.name}</h2></div>{up?<TrendingUp className="up"/>:<TrendingDown className="down"/>}</div><div className="price">{a.price.toLocaleString('ru-RU')} ₽</div><div className={up?'market-change up':'market-change down'}>{up?'+':''}{a.change}%</div><p className="muted">Объём: {a.volume.toLocaleString('ru-RU')}</p><button disabled={busy} onClick={()=>buy(a.symbol)}><ShoppingCart size={16}/> Купить</button></Card>})}</div><Card><div className="section-title"><h2>Обновление котировок</h2><RefreshCw size={18} className={busy?'spin':''}/></div><p className="muted">Кнопка обновляет цены на сервере. Сделки списывают реальные игровые ₽.</p></Card></>
}
