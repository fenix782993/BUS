from datetime import datetime, timedelta
from pathlib import Path
import hashlib, hmac, os, random
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from .database import Base, engine, get_db, SessionLocal
from .models import *
from .services.seed import seed
from .services.progression import add_xp, next_level_xp

app = FastAPI(title='FENIX CITY V2', version='2.1.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
Base.metadata.create_all(engine)
db = SessionLocal()
try: seed(db)
finally: db.close()

class Auth(BaseModel): nickname: str = Field(min_length=3, max_length=32); password: str = Field(min_length=4, max_length=128)
class Action(BaseModel): action: str
class Donation(BaseModel): package: str
class VipPurchase(BaseModel): tier: str
class MarketTrade(BaseModel): symbol: str; quantity: int = Field(ge=1, le=1000)

PACKAGES = {'starter':(100,1.99),'plus':(250,4.49),'pro':(500,8.49),'mega':(1000,15.99),'ultra':(2500,34.99),'legend':(5000,64.99),'max':(10000,119.99)}
VIP_TIERS = {'VIP':(250,'+10% XP'),'VIP+':(600,'+15% XP'),'ELITE':(1200,'+25% XP'),'FENIX':(2500,'+35% XP')}

def hash_password(value): return hashlib.sha256(value.encode('utf-8')).hexdigest()
def valid_password(stored, supplied): return hmac.compare_digest(stored, hash_password(supplied)) or hmac.compare_digest(stored, supplied)

def current(db, authorization):
    if not authorization: raise HTTPException(401,'Требуется авторизация')
    try: pid = int(authorization.replace('Bearer ','').split('-')[-1])
    except Exception: raise HTTPException(401,'Недействительный токен')
    p = db.get(Player,pid)
    if not p: raise HTTPException(401,'Игрок не найден')
    return p

def out(p):
    nx = next_level_xp(p.level + 1)
    return {'id':p.id,'nickname':p.nickname,'cash':round(p.cash,2),'coins':p.coins,'xp':p.xp,'level':p.level,'next_level_xp':nx,'level_progress':min(100,p.xp/max(1,nx)*100),'energy':p.energy,'reputation':p.reputation,'total_earned':p.total_earned,'jobs_completed':p.jobs_completed,'title':p.title,'vip':p.vip}

def transaction(db,p,currency,amount,description): db.add(Transaction(player_id=p.id,currency=currency,amount=amount,description=description))

def metric_value(db,p,metric):
    if metric == 'jobs': return p.jobs_completed
    if metric == 'earned': return int(p.total_earned)
    if metric == 'level': return p.level
    if metric == 'vehicles': return db.query(PlayerVehicle).filter_by(player_id=p.id).count()
    if metric == 'companies': return db.query(PlayerCompany).filter_by(player_id=p.id).count()
    return 0

def sync_achievements(db,p):
    for a in db.query(Achievement).all():
        if metric_value(db,p,a.metric) >= a.target and not db.query(PlayerAchievement).filter_by(player_id=p.id,achievement_id=a.id).first():
            db.add(PlayerAchievement(player_id=p.id,achievement_id=a.id)); add_xp(p,a.xp_reward); p.coins += a.coin_reward

@app.get('/api/health')
def health(): return {'status':'ok','service':'FENIX CITY V2','version':'2.1.0'}

@app.post('/api/register')
def register(a:Auth,db:Session=Depends(get_db)):
    if db.query(Player).filter_by(nickname=a.nickname).first(): raise HTTPException(409,'Никнейм занят')
    p=Player(nickname=a.nickname,password=hash_password(a.password)); db.add(p); db.commit(); db.refresh(p); return {'token':f'player-{p.id}','player':out(p)}

@app.post('/api/login')
def login(a:Auth,db:Session=Depends(get_db)):
    p=db.query(Player).filter_by(nickname=a.nickname).first()
    if not p or not valid_password(p.password,a.password): raise HTTPException(401,'Неверный логин или пароль')
    return {'token':f'player-{p.id}','player':out(p)}

@app.post('/api/auth/register')
def auth_register(a:Auth,db:Session=Depends(get_db)): return register(a,db)
@app.post('/api/auth/login')
def auth_login(a:Auth,db:Session=Depends(get_db)): return login(a,db)
@app.get('/api/me')
def me(authorization:str|None=Header(default=None),db:Session=Depends(get_db)): return out(current(db,authorization))

@app.get('/api/player/{pid}/full')
def full(pid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    return out(p)

@app.post('/api/player/{pid}/action')
def action(pid:int,a:Action,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    if a.action!='work': raise HTTPException(400,'Неизвестное действие')
    if p.energy<10: raise HTTPException(400,'Недостаточно энергии')
    vip_bonus={'FREE':1,'VIP':1.10,'VIP+':1.15,'ELITE':1.25,'FENIX':1.35}.get(p.vip,1)
    reward=round((1800+p.level*140)*vip_bonus); p.energy-=10; p.jobs_completed+=1; p.reputation+=1; p.cash+=reward; p.total_earned+=reward; add_xp(p,round((35+p.level)*vip_bonus)); transaction(db,p,'RUB',reward,'Оплата за работу'); sync_achievements(db,p); db.commit(); return {'player':out(p),'reward':reward}

@app.post('/api/player/{pid}/rest')
def rest(pid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    p.energy=min(100,p.energy+35); add_xp(p,5); db.commit(); return out(p)

@app.get('/api/tasks')
def tasks(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); result=[]
    for m in db.query(Mission).all():
        mp=db.query(MissionProgress).filter_by(player_id=p.id,mission_id=m.id).first()
        if not mp: mp=MissionProgress(player_id=p.id,mission_id=m.id); db.add(mp)
        mp.progress=min(m.target,metric_value(db,p,m.metric))
        result.append({'id':m.id,'title':m.title,'description':m.description,'period':m.period,'progress':mp.progress,'target':m.target,'xp_reward':m.xp_reward,'cash_reward':m.cash_reward,'coin_reward':m.coin_reward,'completed':mp.progress>=m.target,'claimed':mp.claimed})
    db.commit(); return result

@app.post('/api/tasks/{mid}/claim')
def claim(mid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); m=db.get(Mission,mid); mp=db.query(MissionProgress).filter_by(player_id=p.id,mission_id=mid).first()
    if not m or not mp or mp.progress<m.target or mp.claimed: raise HTTPException(400,'Награда недоступна')
    mp.claimed=True; p.cash+=m.cash_reward; p.coins+=m.coin_reward; add_xp(p,m.xp_reward); sync_achievements(db,p); db.commit(); return out(p)

@app.get('/api/achievements')
def achievements(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); sync_achievements(db,p); db.commit(); done={x.achievement_id for x in db.query(PlayerAchievement).filter_by(player_id=p.id)}
    return [{'id':a.id,'title':a.title,'description':a.description,'unlocked':a.id in done,'xp_reward':a.xp_reward,'coin_reward':a.coin_reward} for a in db.query(Achievement).all()]

@app.get('/api/shop')
def shop(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); owned={x.item_id for x in db.query(Inventory).filter_by(player_id=p.id)}
    return [{'id':x.id,'name':x.name,'description':x.description,'category':x.category,'rarity':x.rarity,'price':x.price,'currency':x.currency,'owned':x.id in owned} for x in db.query(Item).all()]

@app.get('/api/inventory')
def inventory(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); rows=[]
    for i in db.query(Inventory).filter_by(player_id=p.id):
        item=db.get(Item,i.item_id); rows.append({'id':i.id,'item_id':i.item_id,'name':item.name if item else 'Удалённый предмет','description':item.description if item else '','category':item.category if item else 'misc','rarity':item.rarity if item else 'common','quantity':i.quantity,'equipped':i.equipped})
    return rows

@app.post('/api/shop/{iid}/buy')
def buy(iid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); i=db.get(Item,iid)
    if not i: raise HTTPException(404,'Предмет не найден')
    if i.currency=='FC':
        if p.coins<i.price: raise HTTPException(400,'Недостаточно FC')
        p.coins-=i.price
    else:
        if p.cash<i.price: raise HTTPException(400,'Недостаточно ₽')
        p.cash-=i.price
    inv=db.query(Inventory).filter_by(player_id=p.id,item_id=i.id).first()
    if inv: inv.quantity+=1
    else: db.add(Inventory(player_id=p.id,item_id=i.id,quantity=1))
    transaction(db,p,i.currency,-i.price,'Покупка: '+i.name); db.commit(); return out(p)

@app.post('/api/inventory/{iid}/equip')
def equip(iid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); inv=db.get(Inventory,iid)
    if not inv or inv.player_id!=p.id: raise HTTPException(404,'Предмет не найден')
    item=db.get(Item,inv.item_id)
    if item.category in ('frame','effect','title','vip'):
        for x in db.query(Inventory).filter_by(player_id=p.id):
            other=db.get(Item,x.item_id)
            if other and other.category==item.category: x.equipped=False
        inv.equipped=True
        if item.category=='title': p.title=item.name
        if item.category=='vip': p.vip=item.name
    elif item.category=='booster':
        if item.name=='Energy Pack': p.energy=100
        elif item.name=='XP Booster': add_xp(p,150)
    db.commit(); return out(p)

@app.get('/api/donations/packages')
def packages(): return [{'code':k,'coins':v[0],'price':v[1],'currency':'EUR'} for k,v in PACKAGES.items()]
@app.post('/api/donations/order')
def order(d:Donation,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if d.package not in PACKAGES: raise HTTPException(400,'Пакет не найден')
    c,a=PACKAGES[d.package]; o=DonationOrder(player_id=p.id,package=d.package,coins=c,amount=a,status='pending'); db.add(o); db.commit(); db.refresh(o); return {'id':o.id,'status':'pending','coins':c,'amount':a,'currency':'EUR'}
@app.get('/api/donations/orders')
def orders(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); return [{'id':o.id,'package':o.package,'coins':o.coins,'amount':o.amount,'status':o.status} for o in db.query(DonationOrder).filter_by(player_id=p.id).order_by(DonationOrder.id.desc())]

@app.get('/api/vip')
def vip(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); return {'current':p.vip,'tiers':[{'name':k,'price':v[0],'bonus':v[1]} for k,v in VIP_TIERS.items()]}
@app.post('/api/vip/purchase')
def vip_purchase(v:VipPurchase,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if v.tier not in VIP_TIERS: raise HTTPException(400,'VIP уровень не найден')
    price,_=VIP_TIERS[v.tier]
    if p.coins<price: raise HTTPException(400,'Недостаточно FC')
    p.coins-=price; p.vip=v.tier; transaction(db,p,'FC',-price,'Покупка '+v.tier); db.commit(); return out(p)

@app.get('/api/vehicles')
def vehicles(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); owned={x.vehicle_id for x in db.query(PlayerVehicle).filter_by(player_id=p.id)}
    return [{'id':x.id,'name':x.name,'price':x.price,'power':x.power,'class':x.class_name,'speed':x.speed,'handling':x.handling,'owned':x.id in owned} for x in db.query(Vehicle).all()]
@app.get('/api/player/{pid}/vehicles')
def my_vehicles(pid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    return [{'id':pv.id,'vehicle':{'id':(v:=db.get(Vehicle,pv.vehicle_id)).id,'name':v.name,'price':v.price,'power':v.power,'class':v.class_name,'speed':v.speed,'handling':v.handling},'purchased_at':pv.purchased_at} for pv in db.query(PlayerVehicle).filter_by(player_id=p.id)]
@app.post('/api/player/{pid}/vehicle/{vid}/buy')
def buy_vehicle(pid:int,vid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    v=db.get(Vehicle,vid)
    if not v: raise HTTPException(404,'Автомобиль не найден')
    if db.query(PlayerVehicle).filter_by(player_id=p.id,vehicle_id=v.id).first(): raise HTTPException(400,'Автомобиль уже куплен')
    if p.cash<v.price: raise HTTPException(400,'Недостаточно средств')
    p.cash-=v.price; db.add(PlayerVehicle(player_id=p.id,vehicle_id=v.id)); add_xp(p,120); transaction(db,p,'RUB',-v.price,'Покупка автомобиля: '+v.name); sync_achievements(db,p); db.commit(); return out(p)

@app.get('/api/properties')
def properties(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); owned={x.property_id for x in db.query(PlayerProperty).filter_by(player_id=p.id)}
    return [{'id':x.id,'name':x.name,'price':x.price,'district':x.district,'income':x.income,'type':x.type,'owned':x.id in owned} for x in db.query(Property).all()]
@app.get('/api/player/{pid}/properties')
def my_properties(pid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    return [{'id':pp.id,'property_id':pp.property_id,'name':(prop:=db.get(Property,pp.property_id)).name,'income':prop.income,'district':prop.district,'purchased_at':pp.purchased_at} for pp in db.query(PlayerProperty).filter_by(player_id=p.id)]
@app.post('/api/player/{pid}/property/{propid}/buy')
def buy_property(pid:int,propid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    prop=db.get(Property,propid)
    if not prop: raise HTTPException(404,'Недвижимость не найдена')
    if db.query(PlayerProperty).filter_by(player_id=p.id,property_id=prop.id).first(): raise HTTPException(400,'Объект уже куплен')
    if p.cash<prop.price: raise HTTPException(400,'Недостаточно средств')
    p.cash-=prop.price; db.add(PlayerProperty(player_id=p.id,property_id=prop.id)); add_xp(p,100); transaction(db,p,'RUB',-prop.price,'Покупка недвижимости: '+prop.name); db.commit(); return out(p)
@app.post('/api/player/{pid}/properties/collect')
def collect_property_income(pid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    now=datetime.utcnow(); total=0
    for pp in db.query(PlayerProperty).filter_by(player_id=p.id):
        prop=db.get(Property,pp.property_id); days=max(0,(now-pp.last_income_at).total_seconds()/86400); cycles=min(7,int(days))
        if cycles: amount=prop.income*cycles; p.cash+=amount; p.total_earned+=amount; total+=amount; pp.last_income_at=now; transaction(db,p,'RUB',amount,f'Доход: {prop.name}')
    db.commit(); return {'player':out(p),'collected':round(total,2)}

@app.get('/api/companies')
def companies(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); owned={x.company_id:x for x in db.query(PlayerCompany).filter_by(player_id=p.id)}
    return [{'id':x.id,'name':x.name,'sector':x.sector,'district':x.district,'price':x.price,'income':x.income,'level':owned[x.id].level if x.id in owned else 0,'owned':x.id in owned} for x in db.query(Company).all()]
@app.post('/api/player/{pid}/company/{cid}/buy')
def buy_company(pid:int,cid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    c=db.get(Company,cid)
    if not c: raise HTTPException(404,'Компания не найдена')
    if db.query(PlayerCompany).filter_by(player_id=p.id,company_id=c.id).first(): raise HTTPException(400,'Компания уже куплена')
    if p.cash<c.price: raise HTTPException(400,'Недостаточно средств')
    p.cash-=c.price; db.add(PlayerCompany(player_id=p.id,company_id=c.id)); add_xp(p,250); transaction(db,p,'RUB',-c.price,'Покупка компании: '+c.name); sync_achievements(db,p); db.commit(); return out(p)
@app.post('/api/player/{pid}/companies/collect')
def collect_company_income(pid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    now=datetime.utcnow(); total=0
    for pc in db.query(PlayerCompany).filter_by(player_id=p.id):
        c=db.get(Company,pc.company_id); days=max(0,(now-pc.last_income_at).total_seconds()/86400); cycles=min(7,int(days))
        if cycles: amount=c.income*pc.level*cycles; pc.balance+=amount; total+=amount; pc.last_income_at=now
    if total: p.cash+=total; p.total_earned+=total; transaction(db,p,'RUB',total,'Доход бизнеса')
    db.commit(); return {'player':out(p),'collected':round(total,2)}

@app.get('/api/districts')
def districts(): return [{'id':1,'name':'Центр','description':'Деловой район города','activity':94},{'id':2,'name':'Промзона','description':'Автомобили и логистика','activity':82},{'id':3,'name':'Премиум','description':'Элитная недвижимость','activity':76}]
@app.get('/api/events')
def events(): return [{'id':1,'title':'Рабочий день','description':'Доход от работы увеличен за счёт активности города.','reward':'XP +10%'},{'id':2,'title':'Рынок открыт','description':'Следи за изменениями индексов и торгуй активами.','reward':'LIVE'}]

@app.get('/api/market')
def market(db:Session=Depends(get_db)):
    return [{'id':x.id,'symbol':x.symbol,'name':x.name,'price':round(x.price,2),'change':round(x.change,2),'volume':x.volume} for x in db.query(MarketAsset).all()]
@app.post('/api/market/tick')
def market_tick(db:Session=Depends(get_db)):
    for x in db.query(MarketAsset).all():
        x.change=round(random.uniform(-4.5,4.5),2); x.price=max(10,round(x.price*(1+x.change/100),2)); x.volume=random.randint(2500,18000)
    db.commit(); return market(db)
@app.post('/api/market/buy')
def market_buy(t:MarketTrade,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); a=db.query(MarketAsset).filter_by(symbol=t.symbol.upper()).first()
    if not a: raise HTTPException(404,'Актив не найден')
    cost=a.price*t.quantity
    if p.cash<cost: raise HTTPException(400,'Недостаточно средств')
    p.cash-=cost; transaction(db,p,'RUB',-cost,f'Покупка {t.quantity} {a.symbol}'); db.commit(); return out(p)

@app.get('/api/leaderboard')
def leaderboard(db:Session=Depends(get_db)):
    rows=db.query(Player).order_by(Player.level.desc(),Player.xp.desc(),Player.total_earned.desc()).limit(100).all()
    return [{'rank':i+1,'id':p.id,'nickname':p.nickname,'level':p.level,'xp':p.xp,'reputation':p.reputation,'cash':round(p.cash,2),'total_earned':round(p.total_earned,2)} for i,p in enumerate(rows)]

@app.get('/api/transactions')
def transactions(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    return [{'id':x.id,'currency':x.currency,'amount':x.amount,'description':x.description,'created_at':x.created_at.isoformat()} for x in db.query(Transaction).filter_by(player_id=p.id).order_by(Transaction.id.desc()).limit(100)]

dist=Path(__file__).resolve().parents[1]/'frontend'/'dist'
if dist.exists(): app.mount('/assets',StaticFiles(directory=dist/'assets'),name='assets')
@app.get('/')
def root():
    index=dist/'index.html'; return FileResponse(index) if index.exists() else {'service':'FENIX CITY V2','status':'online','docs':'/docs'}
@app.get('/{path:path}')
def spa(path:str):
    if path.startswith('api/'): raise HTTPException(404,'Not Found')
    index=dist/'index.html'
    if index.exists(): return FileResponse(index)
    raise HTTPException(404,'Frontend build not found')
