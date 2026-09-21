import Card from "../common/Card";
export default function VipCard({tier}){return <Card><small>VIP</small><h2>{tier.name}</h2><strong>{tier.price} FC</strong><p>{tier.bonus}</p></Card>}
