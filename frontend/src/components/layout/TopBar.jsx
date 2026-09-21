export default function TopBar({ player }) {
  return (
    <header className="top">
      <div className="top-brand">
        <strong>FENIX CITY</strong>
      </div>

      <div className="top-balance">
        <span>{Math.round(player?.cash || 0).toLocaleString("ru-RU")} ₽</span>
        <span>{player?.coins || 0} FC</span>
      </div>
    </header>
  );
}
