"""
Script para ejecutar el servidor FastAPI
"""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        reload_excludes=["venv/*", "*.pyc", "__pycache__/*"],
        log_level="info"
    )
