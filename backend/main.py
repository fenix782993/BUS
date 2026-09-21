from pathlib import Path
from fastapi import FastAPI,Depends,HTTPException,Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel,Field
from sqlalchemy.orm import Session
from .database import Base,engine,get_db,SessionLocal
from .models import *
from .services.seed import seed
from .services.progression import add_xp,next_level_xp
app=FastAPI(title='FENIX CITY V2',version='2.0.0'); app.add_middleware(CORSMiddleware,allow_origins=['*'],allow_methods=['*'],allow_headers=['*'])
Base.metadata.create_all(engine); db=SessionLocal()
try: seed(db)
finally: db.close()
class Auth(BaseModel): nickname:str=Field(min_length=3,max_length=32); password:str=Field(min_length=4,max_length=128)
class Action(BaseModel): action:str
class Donation(BaseModel): package:str
PACKAGES={'starter':(100,1.99),'plus':(250,4.49),'pro':(500,8.49),'mega':(1000,15.99),'ultra':(2500,34.99),'legend':(5000,64.99),'max':(10000,119.99)}
def current(db,authorization):
 if not authorization: raise HTTPException(401,'Требуется авторизация')
 try: pid=int(authorization.replace('Bearer ','').split('-')[-1])
 except: raise HTTPException(401,'Недействительный токен')
 p=db.get(Player,pid)
 if not p: raise HTTPException(401,'Игрок не найден')
 return p
def out(p):
 nx=next_level_xp(p.level+1); return {'id':p.id,'nickname':p.nickname,'cash':round(p.cash,2),'coins':p.coins,'xp':p.xp,'level':p.level,'next_level_xp':nx,'level_progress':min(100,p.xp/max(1,nx)*100),'energy':p.energy,'reputation':p.reputation,'total_earned':p.total_earned,'jobs_completed':p.jobs_completed,'title':p.title,'vip':p.vip}
@app.get('/api/health')
def health(): return {'status':'ok','service':'FENIX CITY V2'}
@app.post('/api/register')
def register(a:Auth,db:Session=Depends(get_db)):
 if db.query(Player).filter_by(nickname=a.nickname).first(): raise HTTPException(409,'Никнейм занят')
 p=Player(nickname=a.nickname,password=a.password); db.add(p); db.commit(); db.refresh(p); return {'token':f'player-{p.id}','player':out(p)}
@app.post('/api/login')
def login(a:Auth,db:Session=Depends(get_db)):
 p=db.query(Player).filter_by(nickname=a.nickname,password=a.password).first()
 if not p: raise HTTPException(401,'Неверный логин или пароль')
 return {'token':f'player-{p.id}','player':out(p)}
@app.post('/api/auth/register')
def ar(a:Auth,db:Session=Depends(get_db)): return register(a,db)
@app.post('/api/auth/login')
def al(a:Auth,db:Session=Depends(get_db)): return login(a,db)
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
 reward=1800+p.level*140; p.energy-=10; p.jobs_completed+=1; p.reputation+=1; p.cash+=reward; p.total_earned+=reward; add_xp(p,35+p.level); db.add(Transaction(player_id=p.id,currency='RUB',amount=reward,description='Оплата за работу')); db.commit(); return {'player':out(p),'reward':reward}
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
  val={'jobs':p.jobs_completed,'earned':int(p.total_earned),'level':p.level}.get(m.metric,0); mp.progress=min(m.target,val)
  result.append({'id':m.id,'title':m.title,'description':m.description,'period':m.period,'progress':mp.progress,'target':m.target,'xp_reward':m.xp_reward,'cash_reward':m.cash_reward,'coin_reward':m.coin_reward,'completed':mp.progress>=m.target,'claimed':mp.claimed})
 db.commit(); return result
@app.post('/api/tasks/{mid}/claim')
def claim(mid:int,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
 p=current(db,authorization); m=db.get(Mission,mid); mp=db.query(MissionProgress).filter_by(player_id=p.id,mission_id=mid).first()
 if not m or not mp or mp.progress<m.target or mp.claimed: raise HTTPException(400,'Награда недоступна')
 mp.claimed=True; p.cash+=m.cash_reward; p.coins+=m.coin_reward; add_xp(p,m.xp_reward); db.commit(); return out(p)
@app.get('/api/achievements')
def achievements(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
 p=current(db,authorization); done={x.achievement_id for x in db.query(PlayerAchievement).filter_by(player_id=p.id)}
 return [{'id':a.id,'title':a.title,'description':a.description,'unlocked':a.id in done,'xp_reward':a.xp_reward,'coin_reward':a.coin_reward} for a in db.query(Achievement).all()]
@app.get('/api/shop')
def shop(db:Session=Depends(get_db)): return [{'id':x.id,'name':x.name,'description':x.description,'category':x.category,'rarity':x.rarity,'price':x.price,'currency':x.currency} for x in db.query(Item).all()]
@app.get('/api/inventory')
def inventory(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
 p=current(db,authorization); return [{'id':i.id,'item_id':i.item_id,'quantity':i.quantity} for i in db.query(Inventory).filter_by(player_id=p.id)]
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
 else: db.add(Inventory(player_id=p.id,item_id=i.id))
 db.add(Transaction(player_id=p.id,currency=i.currency,amount=-i.price,description='Покупка: '+i.name)); db.commit(); return out(p)
@app.get('/api/donations/packages')
def packages(): return [{'code':k,'coins':v[0],'price':v[1],'currency':'EUR'} for k,v in PACKAGES.items()]
@app.post('/api/donations/order')
def order(d:Donation,authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
 p=current(db,authorization)
 if d.package not in PACKAGES: raise HTTPException(400,'Пакет не найден')
 c,a=PACKAGES[d.package]; o=DonationOrder(player_id=p.id,package=d.package,coins=c,amount=a,status='pending'); db.add(o); db.commit(); db.refresh(o); return {'id':o.id,'status':'pending','coins':c,'amount':a,'currency':'EUR'}
@app.get('/api/donations/orders')
def orders(authorization:str|None=Header(default=None),db:Session=Depends(get_db)):
 p=current(db,authorization); return [{'id':o.id,'package':o.package,'coins':o.coins,'amount':o.amount,'status':o.status} for o in db.query(DonationOrder).filter_by(player_id=p.id)]
@app.get('/api/vip')
def vip(): return {'tiers':[{'name':'VIP','price':250,'bonus':'+10% XP'},{'name':'VIP+','price':600,'bonus':'+15% XP'},{'name':'ELITE','price':1200,'bonus':'+25% XP'}]}
@app.get('/api/vehicles')
def vehicles(db:Session=Depends(get_db)): return [{'id':x.id,'name':x.name,'price':x.price,'power':x.power,'class':x.class_name} for x in db.query(Vehicle).all()]
@app.get('/api/properties')
def properties(db:Session=Depends(get_db)): return [{'id':x.id,'name':x.name,'price':x.price,'district':x.district,'income':x.income} for x in db.query(Property).all()]
@app.get('/api/companies')
def companies(): return []
@app.get('/api/districts')
def districts(): return [{'id':1,'name':'Центр'},{'id':2,'name':'Промзона'},{'id':3,'name':'Премиум'}]
@app.get('/api/events')
def events(): return [{'id':1,'title':'Новый рабочий день','description':'Город активен.'}]
@app.get('/api/leaderboard')
def leaderboard(db:Session=Depends(get_db)):
 rows=db.query(Player).order_by(Player.level.desc(),Player.xp.desc()).limit(100).all(); return [{'rank':i+1,'id':p.id,'nickname':p.nickname,'level':p.level,'xp':p.xp,'reputation':p.reputation,'cash':p.cash} for i,p in enumerate(rows)]
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
