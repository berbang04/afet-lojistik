from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, admin, toplama, dagitim, notifications, arac_sofor, bolge,bolge_yonetim

app = FastAPI(title="Afet Sonrası Lojistik Yönetimi", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(toplama.router, prefix="/api/toplama", tags=["Toplama Merkezi"])
app.include_router(dagitim.router, prefix="/api/dagitim", tags=["Dağıtım Merkezi"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Bildirimler"])
app.include_router(arac_sofor.router, prefix="/api", tags=["Arac-Sofor"])
app.include_router(bolge.router, prefix="/api/bolge", tags=["Bölge Müdürü"])
app.include_router(bolge_yonetim.router, prefix="/api/admin", tags=["Bolge Yonetim"])


@app.get("/")
def root():
    return {"message": "Afet Lojistik API çalışıyor"}