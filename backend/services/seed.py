from ..models import Mission, Achievement, Item, Vehicle, Property, Company, MarketAsset

def seed(db):
    if not db.query(Mission).count():
        rows = [
            ('daily_jobs','daily','Рабочий день','Выполни 3 работы.',3,'jobs',80,2500,5),
            ('daily_money','daily','Деньги любят счёт','Заработай 10000 ₽.',10000,'earned',120,5000,8),
            ('weekly_jobs','weekly','Неделя продуктивности','Выполни 30 работ.',30,'jobs',400,25000,25),
            ('million','goal','Первый миллион','Заработай 1000000 ₽.',1000000,'earned',2000,100000,150),
        ]
        for x in rows:
            db.add(Mission(code=x[0], period=x[1], title=x[2], description=x[3], target=x[4], metric=x[5], xp_reward=x[6], cash_reward=x[7], coin_reward=x[8]))
    if not db.query(Achievement).count():
        rows = [
            ('Первый заработок','Выполни первую работу.','jobs',1,50,2),
            ('100 работ','Выполни 100 работ.','jobs',100,500,20),
            ('Первый миллион','Заработай миллион.','earned',1000000,2000,100),
            ('Уровень 10','Достигни 10 уровня.','level',10,500,30),
            ('Предприниматель','Купи компанию.','companies',1,750,50),
            ('Автолюбитель','Купи 3 автомобиля.','vehicles',3,600,35),
        ]
        for x in rows:
            db.add(Achievement(title=x[0], description=x[1], metric=x[2], target=x[3], xp_reward=x[4], coin_reward=x[5]))
    if not db.query(Item).count():
        rows = [
            ('VIP','VIP статус','vip','rare',250,'FC'),('VIP+','Расширенный VIP','vip','epic',600,'FC'),
            ('Gold Frame','Золотая рамка профиля','frame','epic',150,'FC'),('Fenix Flame','Эффект профиля','effect','legendary',300,'FC'),
            ('XP Booster','Бустер XP','booster','rare',75,'FC'),('Energy Pack','Полное восстановление энергии','booster','common',40,'FC'),
            ('Founder Title','Титул Founder','title','legendary',500,'FC'),
        ]
        for x in rows: db.add(Item(name=x[0], description=x[1], category=x[2], rarity=x[3], price=x[4], currency=x[5]))
    if not db.query(Vehicle).count():
        for x in [('Fenix Compact',18000,95,'C',150,70),('Fenix Sport',75000,180,'B',220,78),('Fenix GT',240000,310,'A',285,86),('Fenix Hyper',850000,520,'S',350,92),('Fenix Royale',2200000,700,'S+',420,96)]:
            db.add(Vehicle(name=x[0],price=x[1],power=x[2],class_name=x[3],speed=x[4],handling=x[5]))
    if not db.query(Property).count():
        for x in [('Студия',120000,'Центр',800,'apartment'),('Квартира',320000,'Центр',2200,'apartment'),('Пентхаус',650000,'Центр',4500,'penthouse'),('Особняк',1800000,'Премиум',12000,'house'),('Башня',5000000,'Премиум',40000,'estate')]:
            db.add(Property(name=x[0],price=x[1],district=x[2],income=x[3],type=x[4]))
    if not db.query(Company).count():
        for x in [('Fenix Auto','Автосервис','Промзона',400000,6500),('Fenix Cafe','Общепит','Центр',650000,9500),('Fenix Logistics','Логистика','Промзона',1200000,18000),('Fenix Bank','Финансы','Премиум',3500000,55000)]:
            db.add(Company(name=x[0],sector=x[1],district=x[2],price=x[3],income=x[4]))
    if not db.query(MarketAsset).count():
        for x in [('FNX','FENIX Index',1000,2.4,12000),('AUTO','Auto Market',760,1.1,8500),('REAL','Real Estate',1320,-0.8,6200),('TECH','City Tech',1880,3.7,9100)]:
            db.add(MarketAsset(symbol=x[0],name=x[1],price=x[2],change=x[3],volume=x[4]))
    db.commit()
