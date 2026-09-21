import Card from "../common/Card";import Badge from "../common/Badge";
export default function ShopItem({item,onBuy}){return <Card><Badge>{item.rarity}</Badge><h2>{item.name}</h2><p>{item.description}</p><div className="shop-price">{item.price.toLocaleString()} {item.currency}</div><button onClick={()=>onBuy(item.id)}>Купить</button></Card>}
