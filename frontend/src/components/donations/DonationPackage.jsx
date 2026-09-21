import Card from "../common/Card";
export default function DonationPackage({item,onBuy}){return <Card className="donation"><small>FENIX STORE</small><h2>{item.coins.toLocaleString()} FC</h2><strong>{item.price} {item.currency}</strong><button onClick={()=>onBuy(item.code)}>Создать заказ</button></Card>}
