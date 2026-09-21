import Card from "../common/Card";
export default function ProfileInventory({items=[]}){return <Card><h2>Инвентарь</h2>{items.length?<div className="inventory">{items.map(x=><div className="inventory-item" key={x.id}>#{x.item_id}<b>x{x.quantity}</b></div>)}</div>:<p className="muted">Предметов пока нет.</p>}</Card>}
