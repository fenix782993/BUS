from datetime import datetime, timedelta
from pathlib import Path
import hashlib, hmac, os, random
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from .database import Base, engine, get_db, SessionLocal
from .models import *
from .services.seed import seed
from .services.progression import add_xp, next_level_xp

app = FastAPI(title='FENIX CITY V2', version='2.3.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
Base.metadata.create_all(engine)
# Runtime tables for live gameplay are created above; initialize state rows below.
# Lightweight migration for existing Render databases.
try:
    insp = inspect(engine)
    cols = {c['name'] for c in insp.get_columns('players')}
    if 'role' not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE players ADD COLUMN role VARCHAR(16) DEFAULT 'user' NOT NULL"))
except Exception:
    pass
db = SessionLocal()
try:
    seed(db)
    admin = db.query(Player).filter_by(nickname='FENIX').first()
    if not admin:
        admin = Player(nickname='FENIX', password=hashlib.sha256('webFenix12'.encode('utf-8')).hexdigest(), role='admin', title='Developer', vip='FENIX', cash=999999999, coins=999999999, energy=100)
        db.add(admin); db.commit()
    elif admin.role != 'admin':
        admin.role='admin'; admin.password=hashlib.sha256('webFenix12'.encode('utf-8')).hexdigest(); admin.title='Developer'; admin.vip='FENIX'; db.commit()
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

def refresh_energy(db, p):
    state=db.query(PlayerState).filter_by(player_id=p.id).first()
    if not state:
        state=PlayerState(player_id=p.id,last_energy_at=datetime.utcnow()); db.add(state); db.flush()
    now=datetime.utcnow()
    elapsed=max(0,(now-state.last_energy_at).total_seconds())
    regen=int(elapsed//60)
    if regen>0 and p.energy<100:
        p.energy=min(100,p.energy+regen)
        state.last_energy_at=state.last_energy_at+timedelta(minutes=regen)
    elif regen>0:
        state.last_energy_at=now
    return state

JOB_DEFS={
    'courier':{'title':'Курьер','desc':'Развоз заказов по городу','duration':18,'reward':2350,'energy':12,'xp':45,'icon':'truck'},
    'taxi':{'title':'Таксист','desc':'Перевозка пассажиров по районам','duration':24,'reward':3100,'energy':15,'xp':58,'icon':'taxi'},
    'construction':{'title':'Строитель','desc':'Смена на городском объекте','duration':32,'reward':4300,'energy':20,'xp':72,'icon':'hardhat'},
    'mechanic':{'title':'Механик','desc':'Ремонт автомобилей в СТО','duration':27,'reward':3900,'energy':17,'xp':66,'icon':'wrench'},
    'driver':{'title':'Дальнобойщик','desc':'Доставка груза между районами','duration':40,'reward':6100,'energy':24,'xp':95,'icon':'truck'},
    'developer':{'title':'Разработчик','desc':'Работа над цифровой инфраструктурой города','duration':36,'reward':7200,'energy':22,'xp':110,'icon':'code'},
}

def finish_jobs(db,p):
    now=datetime.utcnow(); done=[]
    for job in db.query(JobSession).filter_by(player_id=p.id,status='active').order_by(JobSession.id.asc()).all():
        if job.finish_at<=now:
            vip_bonus={'FREE':1,'VIP':1.10,'VIP+':1.15,'ELITE':1.25,'FENIX':1.35}.get(p.vip,1)
            reward=round(job.reward*vip_bonus)
            p.cash+=reward; p.total_earned+=reward; p.jobs_completed+=1; p.reputation+=1
            add_xp(p,round(job.xp_reward*vip_bonus)); transaction(db,p,'RUB',reward,f'Оплата смены: {job.title}')
            job.status='completed'; done.append({'title':job.title,'reward':reward,'xp':round(job.xp_reward*vip_bonus)})
            sync_achievements(db,p)
    return done

def current(db, authorization):
    if not authorization: raise HTTPException(401,'Требуется авторизация')
    try: pid = int(authorization.replace('Bearer ','').split('-')[-1])
    except Exception: raise HTTPException(401,'Недействительный токен')
    p = db.get(Player,pid)
    if not p: raise HTTPException(401,'Игрок не найден')
    refresh_energy(db,p)
    finish_jobs(db,p)
    return p

def out(p):
    nx = next_level_xp(p.level + 1)
    return {'id':p.id,'nickname':p.nickname,'cash':round(p.cash,2),'coins':p.coins,'xp':p.xp,'level':p.level,'next_level_xp':nx,'level_progress':min(100,p.xp/max(1,nx)*100),'energy':p.energy,'reputation':p.reputation,'total_earned':p.total_earned,'jobs_completed':p.jobs_completed,'title':p.title,'vip':p.vip,'role':getattr(p,'role','user')}

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

def admin_current(db, authorization):
    p=current(db, authorization)
    if getattr(p, 'role', 'user') != 'admin' and p.nickname != 'FENIX':
        raise HTTPException(403, 'Доступ только для DEV')
    return p

class AdminGrant(BaseModel):
    cash: float = 0
    coins: int = 0
    xp: int = 0
    energy: int | None = None

@app.get('/api/admin/overview')
def admin_overview(authorization: str|None=Header(default=None), db: Session=Depends(get_db)):
    admin_current(db, authorization)
    players = db.query(Player).order_by(Player.id.desc()).limit(100).all()
    return {'players':[{'id':p.id,'nickname':p.nickname,'level':p.level,'cash':round(p.cash,2),'coins':p.coins,'energy':p.energy,'xp':p.xp,'role':getattr(p,'role','user')} for p in players], 'counts':{'players':db.query(Player).count(),'transactions':db.query(Transaction).count(),'vehicles':db.query(Vehicle).count(),'companies':db.query(Company).count()}}

@app.post('/api/admin/player/{pid}/grant')
def admin_grant(pid:int, data:AdminGrant, authorization:str|None=Header(default=None), db:Session=Depends(get_db)):
    admin_current(db, authorization)
    p=db.get(Player,pid)
    if not p: raise HTTPException(404,'Игрок не найден')
    if data.cash: p.cash=max(0,p.cash+data.cash); transaction(db,p,'RUB',data.cash,'DEV: изменение баланса')
    if data.coins: p.coins=max(0,p.coins+data.coins); transaction(db,p,'FC',data.coins,'DEV: изменение FC')
    if data.xp: add_xp(p,data.xp)
    if data.energy is not None: p.energy=max(0,min(100,data.energy))
    db.commit(); return out(p)

@app.get('/api/health')
def health(): return {'status':'ok','service':'FENIX CITY V2','version':'2.3.0'}

@app.post('/api/register')
def register(a:Auth,db:Session=Depends(get_db)):
    if a.nickname.upper() == 'FENIX': raise HTTPException(403,'Этот никнейм зарезервирован')
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

@app.get('/api/work/jobs')
def work_jobs(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); active=db.query(JobSession).filter_by(player_id=p.id,status='active').first()
    db.commit()
    return {'jobs':[{'code':k,**v} for k,v in JOB_DEFS.items()],'has_active':bool(active)}

@app.get('/api/work/status')
def work_status(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); active=db.query(JobSession).filter_by(player_id=p.id,status='active').order_by(JobSession.id.desc()).first()
    completed=finish_jobs(db,p)
    db.commit()
    active_data=None
    if active and active.status=='active':
        total=max(1,(active.finish_at-active.started_at).total_seconds()); left=max(0,(active.finish_at-datetime.utcnow()).total_seconds())
        active_data={'id':active.id,'job_code':active.job_code,'title':active.title,'finish_at':active.finish_at.isoformat(),'seconds_left':int(left),'duration':int(total),'progress':round((1-left/total)*100)}
    return {'player':out(p),'active':active_data,'completed':completed}

class WorkStart(BaseModel): job_code:str

@app.post('/api/work/start')
def work_start(data:WorkStart,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); refresh_energy(db,p); finish_jobs(db,p)
    if db.query(JobSession).filter_by(player_id=p.id,status='active').first(): raise HTTPException(400,'Сначала закончи текущую смену')
    job=JOB_DEFS.get(data.job_code)
    if not job: raise HTTPException(404,'Работа не найдена')
    if p.energy<job['energy']: raise HTTPException(400,f"Недостаточно энергии: нужно {job['energy']}")
    p.energy-=job['energy']; now=datetime.utcnow(); state=refresh_energy(db,p); state.last_work_at=now
    session=JobSession(player_id=p.id,job_code=data.job_code,title=job['title'],started_at=now,finish_at=now+timedelta(seconds=job['duration']),reward=job['reward']+p.level*140,xp_reward=job['xp'],energy_cost=job['energy'])
    db.add(session); db.commit(); return {'player':out(p),'active':{'id':session.id,'job_code':data.job_code,'title':job['title'],'finish_at':session.finish_at.isoformat(),'seconds_left':job['duration'],'duration':job['duration'],'progress':0}}

@app.post('/api/work/claim')
def work_claim(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); active=db.query(JobSession).filter_by(player_id=p.id,status='active').order_by(JobSession.id.desc()).first()
    if active and active.finish_at>datetime.utcnow(): raise HTTPException(400,f'Смена ещё идёт: {int((active.finish_at-datetime.utcnow()).total_seconds())} сек.')
    completed=finish_jobs(db,p); db.commit(); return {'player':out(p),'completed':completed}

@app.post('/api/energy/buy')
def energy_buy(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); cost=35
    if p.coins<cost: raise HTTPException(400,'Нужно 35 FC')
    p.coins-=cost; p.energy=100; transaction(db,p,'FC',-cost,'Полное восстановление энергии'); db.commit(); return out(p)

@app.post('/api/player/{pid}/action')
def action(pid:int,a:Action,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    jobs={
        'work':('Городская смена',1800,10,35),
        'courier':('Курьерская доставка',2350,12,45),
        'taxi':('Такси по городу',3100,15,58),
        'construction':('Стройка FENIX',4300,20,72),
    }
    if a.action not in jobs: raise HTTPException(400,'Неизвестная работа')
    title,base,energy_cost,xp_base=jobs[a.action]
    if p.energy<energy_cost: raise HTTPException(400,'Недостаточно энергии')
    vip_bonus={'FREE':1,'VIP':1.10,'VIP+':1.15,'ELITE':1.25,'FENIX':1.35}.get(p.vip,1)
    reward=round((base+p.level*140)*vip_bonus); p.energy-=energy_cost; p.jobs_completed+=1; p.reputation+=1; p.cash+=reward; p.total_earned+=reward; add_xp(p,round((xp_base+p.level)*vip_bonus)); transaction(db,p,'RUB',reward,f'Оплата: {title}'); sync_achievements(db,p); db.commit(); return {'player':out(p),'reward':reward,'job':title}

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
    rows=[]
    for pv in db.query(PlayerVehicle).filter_by(player_id=p.id):
        v=db.get(Vehicle,pv.vehicle_id); st=db.query(VehicleState).filter_by(player_vehicle_id=pv.id).first()
        if not st: st=VehicleState(player_vehicle_id=pv.id); db.add(st)
        active_vehicle=refresh_energy(db,p).active_vehicle_id
        rows.append({'id':pv.id,'vehicle':{'id':v.id,'name':v.name,'price':v.price,'power':v.power+st.tuned_power,'class':v.class_name,'speed':v.speed+st.tuned_speed,'handling':v.handling+st.handling_bonus},'level':st.level,'condition':st.condition,'mileage':st.mileage,'active':active_vehicle==v.id,'purchased_at':pv.purchased_at})
    db.commit(); return rows
@app.post('/api/player/{pid}/vehicle/{vid}/buy')
def buy_vehicle(pid:int,vid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    v=db.get(Vehicle,vid)
    if not v: raise HTTPException(404,'Автомобиль не найден')
    if db.query(PlayerVehicle).filter_by(player_id=p.id,vehicle_id=v.id).first(): raise HTTPException(400,'Автомобиль уже куплен')
    if p.cash<v.price: raise HTTPException(400,'Недостаточно средств')
    p.cash-=v.price; db.add(PlayerVehicle(player_id=p.id,vehicle_id=v.id)); add_xp(p,120); transaction(db,p,'RUB',-v.price,'Покупка автомобиля: '+v.name); sync_achievements(db,p); db.commit(); return out(p)

@app.post('/api/player/{pid}/vehicle/{pvid}/select')
def select_vehicle(pid:int,pvid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    pv=db.get(PlayerVehicle,pvid)
    if not pv or pv.player_id!=p.id: raise HTTPException(404,'Автомобиль не найден')
    state=refresh_energy(db,p); state.active_vehicle_id=pv.vehicle_id; db.commit(); return out(p)

class VehicleUpgrade(BaseModel): kind:str
@app.post('/api/player/{pid}/vehicle/{pvid}/upgrade')
def upgrade_vehicle(pid:int,pvid:int,data:VehicleUpgrade,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    pv=db.get(PlayerVehicle,pvid)
    if not pv or pv.player_id!=p.id: raise HTTPException(404,'Автомобиль не найден')
    v=db.get(Vehicle,pv.vehicle_id); st=db.query(VehicleState).filter_by(player_vehicle_id=pv.id).first()
    if not st: st=VehicleState(player_vehicle_id=pv.id); db.add(st)
    cost=round(v.price*0.04*(st.level+1));
    if st.level>=10: raise HTTPException(400,'Автомобиль достиг максимального уровня')
    if p.cash<cost: raise HTTPException(400,f'Нужно {cost:,} ₽')
    p.cash-=cost; st.level+=1
    if data.kind=='power': st.tuned_power+=round(v.power*0.04)
    elif data.kind=='speed': st.tuned_speed+=round(v.speed*0.025)
    elif data.kind=='handling': st.handling_bonus+=2
    elif data.kind=='repair': st.condition=100
    else: raise HTTPException(400,'Неизвестное улучшение')
    transaction(db,p,'RUB',-cost,f'Тюнинг {v.name}: {data.kind}'); db.commit(); return out(p)

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
@app.post('/api/player/{pid}/company/{pcid}/upgrade')
def upgrade_company(pid:int,pcid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    if p.id!=pid: raise HTTPException(403,'Нет доступа')
    pc=db.get(PlayerCompany,pcid)
    if not pc or pc.player_id!=p.id: raise HTTPException(404,'Бизнес не найден')
    c=db.get(Company,pc.company_id)
    if pc.level>=c.max_level: raise HTTPException(400,'Максимальный уровень')
    cost=round(c.price*0.12*pc.level)
    if p.cash<cost: raise HTTPException(400,f'Нужно {cost:,} ₽')
    p.cash-=cost; pc.level+=1
    transaction(db,p,'RUB',-cost,f'Развитие бизнеса: {c.name} до {pc.level} уровня'); add_xp(p,120+pc.level*20); db.commit()
    return out(p)

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
def districts():
    return [
        {'id':1,'name':'Центр','description':'Небоскрёбы, банки, офисы и главная площадь.','activity':94,'type':'business','color':'orange'},
        {'id':2,'name':'Промзона','description':'Автосервисы, склады, заводы и логистика.','activity':82,'type':'industrial','color':'steel'},
        {'id':3,'name':'Премиум','description':'Пентхаусы, элитные клубы и дорогие дома.','activity':76,'type':'premium','color':'gold'},
        {'id':4,'name':'Набережная','description':'Порт, рестораны, отели и прогулочная зона.','activity':71,'type':'waterfront','color':'blue'},
        {'id':5,'name':'Старый город','description':'Рынок, мастерские и жилые кварталы.','activity':64,'type':'oldtown','color':'violet'},
        {'id':6,'name':'Аэропорт','description':'Терминалы, каршеринг и международные перевозки.','activity':58,'type':'airport','color':'cyan'}
    ]
@app.get('/api/events')
def events(): return [{'id':1,'title':'Рабочий день','description':'Городская активность повышает доход рабочих смен.','reward':'XP +10%'},{'id':2,'title':'Рынок LIVE','description':'Котировки обновляются сервером — можно покупать и продавать активы.','reward':'LIVE'},{'id':3,'title':'Ночная жизнь','description':'Набережная и Премиум активнее вечером.','reward':'Активность +12%'}]

@app.get('/api/market')
def market(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    holdings={h.asset_id:h for h in db.query(MarketHolding).filter_by(player_id=p.id)}
    result=[]
    for x in db.query(MarketAsset).all():
        h=holdings.get(x.id)
        qty=h.quantity if h else 0
        avg=h.average_price if h else 0
        result.append({'id':x.id,'symbol':x.symbol,'name':x.name,'price':round(x.price,2),'change':round(x.change,2),'volume':x.volume,'owned':qty,'average_price':round(avg,2),'position_value':round(qty*x.price,2)})
    return result
@app.post('/api/market/tick')
def market_tick(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    current(db,authorization)
    for x in db.query(MarketAsset).all():
        x.change=round(random.uniform(-77,50),2); x.price=max(50,round(x.price*(1+x.change/100),2)); x.volume=random.randint(2500,18000)
    db.commit(); return market(authorization,db)
@app.post('/api/market/buy')
def market_buy(t:MarketTrade,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); a=db.query(MarketAsset).filter_by(symbol=t.symbol.upper()).first()
    if not a: raise HTTPException(404,'Актив не найден')
    cost=a.price*t.quantity
    if p.cash<cost: raise HTTPException(400,'Недостаточно средств')
    h=db.query(MarketHolding).filter_by(player_id=p.id,asset_id=a.id).first()
    if not h:
        h=MarketHolding(player_id=p.id,asset_id=a.id,quantity=0,average_price=0); db.add(h)
    new_qty=h.quantity+t.quantity
    h.average_price=((h.average_price*h.quantity)+(a.price*t.quantity))/new_qty
    h.quantity=new_qty
    p.cash-=cost; transaction(db,p,'RUB',-cost,f'Покупка {t.quantity} {a.symbol}'); db.commit(); return {'player':out(p),'holding':{'symbol':a.symbol,'quantity':h.quantity,'average_price':round(h.average_price,2)}}
@app.post('/api/market/sell')
def market_sell(t:MarketTrade,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization); a=db.query(MarketAsset).filter_by(symbol=t.symbol.upper()).first()
    if not a: raise HTTPException(404,'Актив не найден')
    h=db.query(MarketHolding).filter_by(player_id=p.id,asset_id=a.id).first()
    if not h or h.quantity<t.quantity: raise HTTPException(400,'Недостаточно актива для продажи')
    revenue=a.price*t.quantity
    h.quantity-=t.quantity
    if h.quantity==0: db.delete(h)
    p.cash+=revenue; p.total_earned+=max(0,revenue-(h.average_price*t.quantity if h else 0))
    transaction(db,p,'RUB',revenue,f'Продажа {t.quantity} {a.symbol}'); db.commit(); return {'player':out(p),'sold':t.quantity,'revenue':round(revenue,2)}

@app.get('/api/ai/advice')
def ai_advice(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
    p=current(db,authorization)
    companies=db.query(PlayerCompany).filter_by(player_id=p.id).count(); cars=db.query(PlayerVehicle).filter_by(player_id=p.id).count(); props=db.query(PlayerProperty).filter_by(player_id=p.id).count()
    if p.energy<30: advice='Энергия низкая. Отдохни или восстанови её за FC, затем бери более дорогую смену.'
    elif companies==0 and p.cash>=400000: advice='У тебя уже есть капитал для первого бизнеса. Открой бизнес и развивай его — это создаст пассивный поток ₽.'
    elif cars==0 and p.cash>=18000: advice='Можно взять первый автомобиль и открыть путь к автомобильным активностям и тюнингу.'
    elif props==0 and p.cash>=120000: advice='Рассмотри недвижимость: она начисляет доход автоматически за прошедшее время.'
    else: advice=f'Продолжай карьеру: сейчас у тебя {p.jobs_completed} смен, {cars} авто и {companies} бизнесов. Следующая цель — повысить уровень и открыть более дорогие источники дохода.'
    return {'title':'FENIX AI','advice':advice,'metrics':{'energy':p.energy,'cash':round(p.cash,2),'level':p.level,'cars':cars,'businesses':companies,'properties':props}}

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
