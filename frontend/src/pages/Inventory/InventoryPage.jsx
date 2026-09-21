import {useEffect,useState} from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import {getInventory} from '../../api/shop';
import {post} from '../../api/client';
export default function InventoryPage({refresh}){
 const [items,setItems]=useState([]); const load=()=>getInventory().then(setItems); useEffect(load,[]);
 async function equip(id){try{await post(`/api/inventory/${id}/equip`);await load();refresh?.()}catch(e){alert(e.message)}}
 return <><PageHeader title="Инвентарь" subtitle="Купленные предметы, эффекты и бустеры."/><div className="cards">{items.map(i=><Card key={i.id}><span className="badge">{i.category}</span><h2>{i.name}</h2><p>{i.description}</p><div className="row"><span>Количество</span><b>x{i.quantity}</b></div><button onClick={()=>equip(i.id)}>{i.equipped?'Активно':'Использовать'}</button></Card>)}</div>{!items.length&&<Card><p className="muted">Инвентарь пуст. Открой магазин.</p></Card>}</>
}
