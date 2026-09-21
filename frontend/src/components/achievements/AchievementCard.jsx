import Card from "../common/Card";
export default function AchievementCard({item}){return <Card className={item.unlocked?"":"locked"}><div className="achievement-icon">★</div><h2>{item.title}</h2><p>{item.description}</p><span>+{item.xp_reward} XP · +{item.coin_reward} FC</span></Card>}
