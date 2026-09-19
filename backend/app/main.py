import os, uuid, random, json
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, String, Text, Float, Integer, DateTime, ForeignKey, select, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session

DATABASE_URL=os.getenv("DATABASE_URL","postgresql+psycopg://civic:civic@localhost:5432/civic_intel")
engine_kwargs={"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
 engine_kwargs["connect_args"]={"check_same_thread": False}
engine=create_engine(DATABASE_URL,**engine_kwargs)
SECRET=os.getenv("JWT_SECRET","change-me"); ALGORITHM="HS256"
pwd=CryptContext(schemes=["bcrypt"],deprecated="auto"); oauth=OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
app=FastAPI(title="JanSamadhan API",description="From Citizen Signals to Government Action",version="1.0.0")
app.add_middleware(CORSMiddleware,allow_origins=os.getenv("CORS_ORIGINS","http://localhost:3000").split(","),allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
class Base(DeclarativeBase): pass
class User(Base):
 __tablename__="users"; id:Mapped[str]=mapped_column(String(36),primary_key=True); email:Mapped[str]=mapped_column(String(255),unique=True,index=True); name:Mapped[str]=mapped_column(String(120)); role:Mapped[str]=mapped_column(String(40)); password_hash:Mapped[str]=mapped_column(String(255))
class Incident(Base):
 __tablename__="master_incidents"; id:Mapped[str]=mapped_column(String(30),primary_key=True); title:Mapped[str]=mapped_column(String(200)); category:Mapped[str]=mapped_column(String(100),index=True); area:Mapped[str]=mapped_column(String(100)); lat:Mapped[float]=mapped_column(Float); lon:Mapped[float]=mapped_column(Float); complaint_count:Mapped[int]=mapped_column(Integer,default=0); affected:Mapped[int]=mapped_column(Integer,default=0); velocity:Mapped[float]=mapped_column(Float,default=0); priority:Mapped[int]=mapped_column(Integer,default=0); severity:Mapped[str]=mapped_column(String(20)); status:Mapped[str]=mapped_column(String(40)); department:Mapped[str]=mapped_column(String(100)); sla_deadline:Mapped[datetime]=mapped_column(DateTime(timezone=True)); root_cause:Mapped[str]=mapped_column(Text); confidence:Mapped[int]=mapped_column(Integer)
class Complaint(Base):
 __tablename__="complaints"; id:Mapped[str]=mapped_column(String(40),primary_key=True); description:Mapped[str]=mapped_column(Text); category:Mapped[str]=mapped_column(String(100)); status:Mapped[str]=mapped_column(String(40)); incident_id:Mapped[Optional[str]]=mapped_column(ForeignKey("master_incidents.id"),nullable=True,index=True); department:Mapped[str]=mapped_column(String(100)); priority:Mapped[int]=mapped_column(Integer); lat:Mapped[float]=mapped_column(Float); lon:Mapped[float]=mapped_column(Float); submitted_at:Mapped[datetime]=mapped_column(DateTime(timezone=True)); ai_json:Mapped[str]=mapped_column(Text); user_id:Mapped[Optional[str]]=mapped_column(String(36),nullable=True,index=True)
class WorkOrder(Base):
 __tablename__="work_orders"; id:Mapped[str]=mapped_column(String(30),primary_key=True); incident_id:Mapped[str]=mapped_column(ForeignKey("master_incidents.id")); action:Mapped[str]=mapped_column(Text); status:Mapped[str]=mapped_column(String(40)); created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True))
class Audit(Base):
 __tablename__="audit_logs"; id:Mapped[str]=mapped_column(String(36),primary_key=True); action:Mapped[str]=mapped_column(String(100)); entity_id:Mapped[str]=mapped_column(String(50)); created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True))
class ComplaintIn(BaseModel): description:str=Field(min_length=8); category:Optional[str]=None; lat:float=19.12; lon:float=72.88; urgency:str="medium"
class FeedbackIn(BaseModel): resolved:bool; rating:Optional[int]=Field(None,ge=1,le=5); comment:Optional[str]=None
class WorkOrderIn(BaseModel): incident_id:str; action:str="Field inspection"
class WorkOrderStatusIn(BaseModel): status:str
def now():return datetime.now(timezone.utc)
def session():
 with Session(engine) as s: yield s
def auth_token(u):return jwt.encode({"sub":u.id,"role":u.role,"exp":now()+timedelta(hours=12)},SECRET,algorithm=ALGORITHM)
def current(token=Depends(oauth),s:Session=Depends(session)):
 try: uid=jwt.decode(token,SECRET,algorithms=[ALGORITHM])["sub"]
 except JWTError: raise HTTPException(401,"Invalid authentication credentials")
 u=s.get(User,uid)
 if not u: raise HTTPException(401,"User not found")
 return u
def roles(*allowed):
 def dep(u=Depends(current)):
  if u.role not in allowed: raise HTTPException(403,"Insufficient permissions")
  return u
 return dep
def complaint_view(c):return {"id":c.id,"description":c.description,"category":c.category,"status":c.status,"incident_id":c.incident_id,"department":c.department,"priority":c.priority,"lat":c.lat,"lon":c.lon,"submitted_at":c.submitted_at.isoformat(),"ai":json.loads(c.ai_json) if c.ai_json else None}
def local_ai(text):
 t=text.lower(); water=any(k in t for k in ["water","tap","odor","smell","sewage"]); cat="Water & Sanitation" if water else ("Waste Management" if any(k in t for k in ["garbage","waste","litter"]) else "Roads"); return {"category":cat,"subcategory":"Water Quality" if water else "General","severity":"high" if water else "medium","symptoms":["dirty water","unusual odor"] if water else ["reported civic disruption"],"department":"Water Supply" if water else cat,"confidence":92 if water else 78,"summary":"Potential civic service disruption requiring field review"}
def seed(s):
 if s.scalar(select(func.count()).select_from(User)):return
 for e,n,r in [("citizen.demo@example.test","Demo Citizen","citizen"),("field.demo@example.test","Aarav Nair","field_officer"),("department.demo@example.test","Meera Rao","department_officer"),("admin.demo@example.test","Command Admin","admin")]:s.add(User(id=str(uuid.uuid4()),email=e,name=n,role=r,password_hash=pwd.hash("demo123")))
 for x,(cat,count,lat,lon) in enumerate([("Water & Sanitation",43,19.12,72.88),("Roads",18,19.10,72.91),("Waste Management",42,19.15,72.86),("Streetlights",25,19.08,72.90)]):s.add(Incident(id=f"MI-{482+x:05d}",title=f"{cat} Cluster",category=cat,area=f"Sector {x+4}",lat=lat,lon=lon,complaint_count=count,affected=count*10+20,velocity=200-x*25,priority=92-x*5,severity="critical" if x==0 else "high",status="under_investigation",department=cat,sla_deadline=now()+timedelta(hours=4+x*8),root_cause="Possible infrastructure fault",confidence=86-x*8))
 s.commit()
@app.on_event("startup")
def startup():Base.metadata.create_all(engine);s=Session(engine);seed(s);s.close()
@app.get("/health")
def health(s:Session=Depends(session)):return {"status":"ok","database":s.scalar(select(func.count()).select_from(User))>=0,"ai_provider":os.getenv("AI_PROVIDER","local")}
@app.post("/api/v1/auth/login")
def login(form:OAuth2PasswordRequestForm=Depends(),s:Session=Depends(session)):
 u=s.scalar(select(User).where(User.email==form.username))
 if not u or not pwd.verify(form.password,u.password_hash):raise HTTPException(401,"Invalid email or password")
 return {"access_token":auth_token(u),"token_type":"bearer","user":{"id":u.id,"email":u.email,"name":u.name,"role":u.role}}
@app.get("/api/v1/auth/me")
def me(u=Depends(current)):return {"id":u.id,"email":u.email,"name":u.name,"role":u.role}
@app.post("/api/v1/complaints")
def create_complaint(data:ComplaintIn,u=Depends(current),s:Session=Depends(session)):
 ai=local_ai(data.description);cat=data.category or ai["category"];matches=s.scalars(select(Incident).where(Incident.category==cat)).all();inc=next((i for i in matches if abs(i.lat-data.lat)<.02 and abs(i.lon-data.lon)<.02),None);cid=f"CIV-2026-{random.randint(100000,999999)}";c=Complaint(id=cid,description=data.description,category=cat,status="linked" if inc else "analyzed",incident_id=inc.id if inc else None,department=ai["department"],priority=inc.priority if inc else 55,lat=data.lat,lon=data.lon,submitted_at=now(),ai_json=json.dumps(ai));s.add(c)
 if inc:inc.complaint_count+=1;inc.affected+=1;inc.velocity=max(inc.velocity,100)
 c.user_id=u.id;s.add(Audit(id=str(uuid.uuid4()),action="complaint_created",entity_id=cid,created_at=now()));s.commit();return {"id":cid,"description":data.description,"category":cat,"status":c.status,"incident_id":c.incident_id,"department":c.department,"priority":c.priority,"ai":ai}
@app.get("/api/v1/complaints/mine")
def my_complaints(u=Depends(current),s:Session=Depends(session)):return [complaint_view(c) for c in s.scalars(select(Complaint).where(Complaint.user_id==u.id).order_by(Complaint.submitted_at.desc())).all()]
@app.get("/api/v1/complaints/{cid}")
def get_complaint(cid:str,u=Depends(current),s:Session=Depends(session)):
 c=s.get(Complaint,cid)
 if not c:raise HTTPException(404,"Complaint not found")
 if u.role=="citizen" and c.user_id!=u.id:raise HTTPException(403,"Insufficient permissions")
 return complaint_view(c)
def incident_view(i):
 breached=i.status!="resolved" and i.sla_deadline<now()
 return {"id":i.id,"reference":i.id,"title":i.title,"category":i.category,"area":i.area,"lat":i.lat,"lon":i.lon,"complaints":i.complaint_count,"affected":i.affected,"velocity":i.velocity,"priority":i.priority,"severity":i.severity,"status":i.status,"department":i.department,"sla_deadline":i.sla_deadline.isoformat(),"sla_breached":breached,"root_cause":i.root_cause,"confidence":i.confidence}
@app.get("/api/v1/incidents")
def list_incidents(u=Depends(current),s:Session=Depends(session)):return [incident_view(i) for i in s.scalars(select(Incident)).all()]
@app.get("/api/v1/incidents/{iid}")
def get_incident(iid:str,u=Depends(current),s:Session=Depends(session)):
 i=s.get(Incident,iid)
 if not i:raise HTTPException(404,"Incident not found")
 return incident_view(i)
@app.get("/api/v1/incidents/{iid}/related-complaints")
def related(iid:str,u=Depends(current),s:Session=Depends(session)):return [complaint_view(c) for c in s.scalars(select(Complaint).where(Complaint.incident_id==iid)).all()]
@app.get("/api/v1/dashboard/overview")
def overview(u=Depends(current),s:Session=Depends(session)):
 incidents=s.scalars(select(Incident)).all();breaches=sum(1 for i in incidents if i.status!="resolved" and i.sla_deadline<now());resolved=sum(1 for i in incidents if i.status=="resolved");rate=round(100*resolved/len(incidents),1) if incidents else 0.0
 return {"total_complaints":s.scalar(select(func.count()).select_from(Complaint)),"active_incidents":s.scalar(select(func.count()).select_from(Incident)),"critical_incidents":s.scalar(select(func.count()).select_from(Incident).where(Incident.severity=="critical")),"citizens_affected":s.scalar(select(func.sum(Incident.affected))) or 0,"sla_breaches":breaches,"resolution_rate":rate}
@app.get("/api/v1/dashboard/emerging")
def emerging(u=Depends(current),s:Session=Depends(session)):return [incident_view(i) for i in s.scalars(select(Incident).order_by(Incident.velocity.desc())).all()]
@app.get("/api/v1/dashboard/hotspots")
def hotspots(u=Depends(current),s:Session=Depends(session)):return [{"id":i.id,"lat":i.lat,"lon":i.lon,"priority":i.priority,"severity":i.severity} for i in s.scalars(select(Incident)).all()]
@app.post("/api/v1/work-orders")
def create_work(data:WorkOrderIn,u=Depends(roles("admin","department_officer")),s:Session=Depends(session)):
 if not s.get(Incident,data.incident_id):raise HTTPException(404,"Incident not found")
 w=WorkOrder(id=f"WO-{random.randint(10000,99999)}",incident_id=data.incident_id,action=data.action,status="created",created_at=now());s.add(w);s.commit();return {"id":w.id,"incident_id":w.incident_id,"action":w.action,"status":w.status}
@app.get("/api/v1/work-orders")
def list_work(u=Depends(current),s:Session=Depends(session)):return [{"id":w.id,"incident_id":w.incident_id,"action":w.action,"status":w.status} for w in s.scalars(select(WorkOrder)).all()]
WO_TRANSITIONS={"created":"dispatched","dispatched":"in_progress","in_progress":"completed"}
@app.patch("/api/v1/work-orders/{wid}")
def update_work(wid:str,data:WorkOrderStatusIn,u=Depends(roles("admin","department_officer","field_officer")),s:Session=Depends(session)):
 w=s.get(WorkOrder,wid)
 if not w:raise HTTPException(404,"Work order not found")
 expected=WO_TRANSITIONS.get(w.status)
 if data.status!=expected:raise HTTPException(400,f"Invalid transition from '{w.status}' to '{data.status}'")
 w.status=data.status;s.add(Audit(id=str(uuid.uuid4()),action=f"work_order_{data.status}",entity_id=w.id,created_at=now()));s.commit()
 return {"id":w.id,"incident_id":w.incident_id,"action":w.action,"status":w.status}
@app.post("/api/v1/complaints/{cid}/feedback")
def feedback(cid:str,data:FeedbackIn,u=Depends(current),s:Session=Depends(session)):
 c=s.get(Complaint,cid)
 if not c:raise HTTPException(404,"Complaint not found")
 c.status="verified" if data.resolved else "reopened";s.commit();return {"id":c.id,"status":c.status,"feedback":data.model_dump()}
@app.get("/api/v1/audit-logs")
def audit(u=Depends(roles("admin","department_officer")),s:Session=Depends(session)):return [{"id":a.id,"action":a.action,"entity_id":a.entity_id,"created_at":a.created_at.isoformat()} for a in s.scalars(select(Audit).order_by(Audit.created_at.desc())).all()]
