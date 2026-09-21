import {useEffect,useState} from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import {get,post} from '../../api/client';
export default function BusinessPage({player,refresh}){
 const [companies,setCompanies]=useState([]); const [collecting,setCollecting]=useState(false);
 const load=()=>get('/api/companies').then(setCompanies); useEffect(load,[]);
 async function buy(id){try{await post(`/api/player/${player.id}/company/${id}/buy`);await load();refresh()}catch(e){alert(e.message)}}
 async function collect(){setCollecting(true);try{const d=await post(`/api/player/${player.id}/companies/collect`);alert(`Получено ${d.collected.toLocaleString('ru-RU')} ₽`);refresh();load()}catch(e){alert(e.message)}finally{setCollecting(false)}}
 return <><PageHeader title="Бизнес" subtitle="Покупай компании и собирай их доход." action="Забрать доход" onAction={collect}/><div className="cards">{companies.map(x=><Card key={x.id}><span className="badge">{x.sector}</span><h2>{x.name}</h2><p>{x.district}</p><div className="price">{x.price.toLocaleString('ru-RU')} ₽</div><div className="muted">Доход: {x.income.toLocaleString('ru-RU')} ₽ / день</div>{x.owned?<div className="owned">В собственности · уровень {x.level}</div>:<button onClick={()=>buy(x.id)}>Купить</button>}</Card>)}</div></>
}
