import MissionCard from "./MissionCard";import EmptyState from "../common/EmptyState";
export default function MissionList({missions,onClaim}){if(!missions.length)return <EmptyState title="Задач нет"/>;return <div className="cards">{missions.map(x=><MissionCard key={x.id} mission={x} onClaim={onClaim}/>)}</div>}
