import Card from './Card';export default function StatCard({icon,title,value}){return <Card><div className="stat"><span>{icon}</span><small>{title}</small><strong>{value}</strong></div></Card>}
