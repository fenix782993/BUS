export default function ShopCategory({name,active,onClick}){return <button className={active?"category active":"category"} onClick={onClick}>{name}</button>}
