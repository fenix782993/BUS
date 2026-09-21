import {useEffect,useState} from 'react';
import {Gauge,CarFront} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import {get,post} from '../../api/client';
export default function GaragePage({player,refresh}){
 const [cars,setCars]=useState([]),[owned,setOwned]=useState([]);
 const load=async()=>{const [all,mine]=await Promise.all([get('/api/vehicles'),get(`/api/player/${player.id}/vehicles`)]);setCars(all);setOwned(mine)};useEffect(()=>{load()},[player.id]);
 async function buy(id){try{await post(`/api/player/${player.id}/vehicle/${id}/buy`);await load();refresh()}catch(e){alert(e.message)}}
 return <><PageHeader title="Гараж" subtitle={`${owned.length} автомобилей в коллекции.`}/><Card><div className="section-title"><h2>Моя коллекция</h2><span>{owned.length} авто</span></div>{owned.length?<div className="cards">{owned.map(x=><Card key={x.id}><CarFront size={24}/><h3>{x.vehicle.name}</h3><p>{x.vehicle.power} л.с. · {x.vehicle.class}</p></Card>)}</div>:<p className="muted">Пока нет автомобилей.</p>}</Card><div className="section"><div className="section-title"><h2>Автосалон</h2></div><div className="cards">{cars.map(x=><Card key={x.id}><span className="badge">CLASS {x.class}</span><h2>{x.name}</h2><div className="car-stats"><span><Gauge size={15}/> {x.speed}</span><span>⚡ {x.power} л.с.</span><span>↪ {x.handling}</span></div><div className="price">{x.price.toLocaleString('ru-RU')} ₽</div>{x.owned?<div className="owned">Уже куплен</div>:<button onClick={()=>buy(x.id)}>Купить</button>}</Card>)}</div></div></>
}
