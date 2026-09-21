import Card from '../common/Card';
export default function DistrictCard({item}){return <Card><small>DISTRICT</small><h2>{item.name}</h2><p>{item.description}</p><div className="row"><span>Активность</span><b>{item.activity}%</b></div><div className="bar"><i style={{width:`${item.activity}%`}}/></div></Card>}
