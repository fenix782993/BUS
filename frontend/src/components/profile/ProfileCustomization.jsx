import {useEffect,useState} from 'react';
import Card from '../common/Card';
import {getInventory} from '../../api/shop';
import {post} from '../../api/client';
export default function ProfileCustomization({onChanged}){const [items,setItems]=useState([]);const load=()=>getInventory().then(setItems);useEffect(load,[]);async function equip(id){try{await post(`/api/inventory/${id}/equip`);await load();onChanged?.()}catch(e){alert(e.message)}}return <Card><h2>Кастомизация</h2>{items.filter(x=>['frame','effect','title','vip'].includes(x.category)).length?<div className="choice-grid">{items.filter(x=>['frame','effect','title','vip'].includes(x.category)).map(x=><button key={x.id} className={x.equipped?'active':''} onClick={()=>equip(x.id)}>{x.name}{x.equipped?' · активно':''}</button>)}</div>:<p className="muted">Купи рамки, эффекты или титулы в магазине.</p>}</Card>}
