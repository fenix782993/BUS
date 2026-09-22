from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from .database import Base

class Player(Base):
    __tablename__ = 'players'
    id = Column(Integer, primary_key=True)
    nickname = Column(String(32), unique=True, nullable=False)
    password = Column(String(128), nullable=False)
    cash = Column(Float, default=25000)
    coins = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    energy = Column(Integer, default=100)
    reputation = Column(Integer, default=0)
    total_earned = Column(Float, default=0)
    jobs_completed = Column(Integer, default=0)
    title = Column(String(64), default='Новичок')
    vip = Column(String(32), default='FREE')
    role = Column(String(16), default='user', nullable=False)
    registered_at = Column(DateTime, default=datetime.utcnow)

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    currency = Column(String(8))
    amount = Column(Float)
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class Mission(Base):
    __tablename__ = 'missions'
    id = Column(Integer, primary_key=True)
    code = Column(String(64), unique=True)
    period = Column(String(16))
    title = Column(String(120))
    description = Column(String(255))
    target = Column(Integer)
    metric = Column(String(32))
    xp_reward = Column(Integer, default=0)
    cash_reward = Column(Float, default=0)
    coin_reward = Column(Integer, default=0)

class MissionProgress(Base):
    __tablename__ = 'mission_progress'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    mission_id = Column(Integer, ForeignKey('missions.id'))
    progress = Column(Integer, default=0)
    claimed = Column(Boolean, default=False)

class Achievement(Base):
    __tablename__ = 'achievements'
    id = Column(Integer, primary_key=True)
    title = Column(String(120))
    description = Column(String(255))
    metric = Column(String(32))
    target = Column(Integer)
    xp_reward = Column(Integer, default=0)
    coin_reward = Column(Integer, default=0)

class PlayerAchievement(Base):
    __tablename__ = 'player_achievements'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    achievement_id = Column(Integer, ForeignKey('achievements.id'))
    unlocked_at = Column(DateTime, default=datetime.utcnow)

class Item(Base):
    __tablename__ = 'items'
    id = Column(Integer, primary_key=True)
    name = Column(String(120))
    description = Column(String(255))
    category = Column(String(32))
    rarity = Column(String(32))
    price = Column(Integer)
    currency = Column(String(8))

class Inventory(Base):
    __tablename__ = 'inventory'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    item_id = Column(Integer, ForeignKey('items.id'))
    quantity = Column(Integer, default=1)
    equipped = Column(Boolean, default=False)

class Vehicle(Base):
    __tablename__ = 'vehicles'
    id = Column(Integer, primary_key=True)
    name = Column(String(120))
    price = Column(Float)
    power = Column(Integer)
    class_name = Column(String(8))
    speed = Column(Integer, default=100)
    handling = Column(Integer, default=70)

class PlayerVehicle(Base):
    __tablename__ = 'player_vehicles'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'))
    purchased_at = Column(DateTime, default=datetime.utcnow)

class Property(Base):
    __tablename__ = 'properties'
    id = Column(Integer, primary_key=True)
    name = Column(String(120))
    price = Column(Float)
    district = Column(String(64))
    income = Column(Float)
    type = Column(String(32), default='property')

class PlayerProperty(Base):
    __tablename__ = 'player_properties'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    property_id = Column(Integer, ForeignKey('properties.id'))
    purchased_at = Column(DateTime, default=datetime.utcnow)
    last_income_at = Column(DateTime, default=datetime.utcnow)

class Company(Base):
    __tablename__ = 'companies'
    id = Column(Integer, primary_key=True)
    name = Column(String(120), unique=True)
    sector = Column(String(64))
    district = Column(String(64))
    price = Column(Float)
    income = Column(Float)
    level = Column(Integer, default=1)
    max_level = Column(Integer, default=10)

class PlayerCompany(Base):
    __tablename__ = 'player_companies'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    company_id = Column(Integer, ForeignKey('companies.id'))
    level = Column(Integer, default=1)
    balance = Column(Float, default=0)
    last_income_at = Column(DateTime, default=datetime.utcnow)

class MarketAsset(Base):
    __tablename__ = 'market_assets'
    id = Column(Integer, primary_key=True)
    symbol = Column(String(16), unique=True)
    name = Column(String(120))
    price = Column(Float)
    change = Column(Float, default=0)
    volume = Column(Integer, default=0)

class MarketHolding(Base):
    __tablename__ = 'market_holdings'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    asset_id = Column(Integer, ForeignKey('market_assets.id'))
    quantity = Column(Integer, default=0)
    average_price = Column(Float, default=0)

class DonationOrder(Base):
    __tablename__ = 'donation_orders'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'))
    package = Column(String(32))
    coins = Column(Integer)
    amount = Column(Float)
    status = Column(String(24), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)

class PlayerState(Base):
    __tablename__ = 'player_states'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'), unique=True, nullable=False)
    last_energy_at = Column(DateTime, default=datetime.utcnow)
    active_vehicle_id = Column(Integer, ForeignKey('vehicles.id'), nullable=True)
    last_work_at = Column(DateTime, nullable=True)

class JobSession(Base):
    __tablename__ = 'job_sessions'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    job_code = Column(String(32), nullable=False)
    title = Column(String(120), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    finish_at = Column(DateTime, nullable=False)
    reward = Column(Float, default=0)
    xp_reward = Column(Integer, default=0)
    energy_cost = Column(Integer, default=0)
    status = Column(String(16), default='active')

class VehicleState(Base):
    __tablename__ = 'vehicle_states'
    id = Column(Integer, primary_key=True)
    player_vehicle_id = Column(Integer, ForeignKey('player_vehicles.id'), unique=True, nullable=False)
    level = Column(Integer, default=1)
    condition = Column(Integer, default=100)
    mileage = Column(Integer, default=0)
    tuned_power = Column(Integer, default=0)
    tuned_speed = Column(Integer, default=0)
    handling_bonus = Column(Integer, default=0)

class Family(Base):
    __tablename__ = 'families'
    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True, nullable=False)
    tag = Column(String(8), unique=True, nullable=False)
    description = Column(String(255), default='')
    level = Column(Integer, default=1)
    rating = Column(Integer, default=0)
    treasury = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class FamilyMember(Base):
    __tablename__ = 'family_members'
    id = Column(Integer, primary_key=True)
    family_id = Column(Integer, ForeignKey('families.id'), nullable=False)
    player_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    role = Column(String(24), default='member')
    joined_at = Column(DateTime, default=datetime.utcnow)

class FamilyMessage(Base):
    __tablename__ = 'family_messages'
    id = Column(Integer, primary_key=True)
    family_id = Column(Integer, ForeignKey('families.id'), nullable=False)
    player_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    text = Column(String(1000), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    recipient_id = Column(Integer, ForeignKey('players.id'), nullable=True)
    channel = Column(String(16), default='global')
    text = Column(String(1000), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class CurrencyTransfer(Base):
    __tablename__ = 'currency_transfers'
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    recipient_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    currency = Column(String(8), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    title = Column(String(120), nullable=False)
    text = Column(String(500), nullable=False)
    kind = Column(String(24), default='info')
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuctionListing(Base):
    __tablename__ = 'auction_listings'
    id = Column(Integer, primary_key=True)
    seller_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    vehicle_id = Column(Integer, ForeignKey('player_vehicles.id'), nullable=True)
    title = Column(String(160), nullable=False)
    price = Column(Float, nullable=False)
    status = Column(String(16), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)

class AuctionBid(Base):
    __tablename__ = 'auction_bids'
    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey('auction_listings.id'), nullable=False)
    bidder_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FamilyBattle(Base):
    __tablename__ = 'family_battles'
    id = Column(Integer, primary_key=True)
    family_a = Column(Integer, ForeignKey('families.id'), nullable=False)
    family_b = Column(Integer, ForeignKey('families.id'), nullable=False)
    score_a = Column(Integer, default=0)
    score_b = Column(Integer, default=0)
    status = Column(String(16), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)

class DonationProof(Base):
    __tablename__ = 'donation_proofs'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('donation_orders.id'), nullable=False)
    player_id = Column(Integer, ForeignKey('players.id'), nullable=False)
    filename = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
