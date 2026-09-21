import AchievementCard from "./AchievementCard";
export default function AchievementGrid({items}){return <div className="cards">{items.map(x=><AchievementCard key={x.id} item={x}/>)}</div>}
