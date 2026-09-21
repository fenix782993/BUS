from ..models import Mission,Achievement,Item,Vehicle,Property
def seed(db):
 if not db.query(Mission).count():
  for x in [('daily_jobs','daily','Рабочий день','Выполни 3 работы.',3,'jobs',80,2500,5),('daily_money','daily','Деньги любят счёт','Заработай 10000 ₽.',10000,'earned',120,5000,8),('weekly_jobs','weekly','Неделя продуктивности','Выполни 30 работ.',30,'jobs',400,25000,25),('million','goal','Первый миллион','Заработай миллион.',1000000,'earned',2000,100000,150)]: db.add(Mission(code=x[0],period=x[1],title=x[2],description=x[3],target=x[4],metric=x[5],xp_reward=x[6],cash_reward=x[7],coin_reward=x[8]))
 if not db.query(Achievement).count():
  for x in [('Первый заработок','Выполни первую работу.','jobs',1,50,2),('100 работ','Выполни 100 работ.','jobs',100,500,20),('Первый миллион','Заработай миллион.','earned',1000000,2000,100),('Уровень 10','Достигни 10 уровня.','level',10,500,30)]: db.add(Achievement(title=x[0],description=x[1],metric=x[2],target=x[3],xp_reward=x[4],coin_reward=x[5]))
 if not db.query(Item).count():
  for x in [('VIP','VIP статус','vip','rare',250,'FC'),('Gold Frame','Золотая рамка','frame','epic',150,'FC'),('Fenix Flame','Эффект профиля','effect','legendary',300,'FC'),('XP Booster','Бустер XP','booster','rare',75,'FC')]: db.add(Item(name=x[0],description=x[1],category=x[2],rarity=x[3],price=x[4],currency=x[5]))
 if not db.query(Vehicle).count():
  for x in [('Fenix Compact',18000,95,'C'),('Fenix Sport',75000,180,'B'),('Fenix GT',240000,310,'A'),('Fenix Hyper',850000,520,'S')]: db.add(Vehicle(name=x[0],price=x[1],power=x[2],class_name=x[3]))
 if not db.query(Property).count():
  for x in [('Студия',120000,'Центр',800),('Пентхаус',650000,'Центр',4500),('Особняк',1800000,'Премиум',12000)]: db.add(Property(name=x[0],price=x[1],district=x[2],income=x[3]))
 db.commit()
