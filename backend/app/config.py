"""
Configuración del backend aivU
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # API Settings
    APP_NAME: str = "aivU Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:4200",  # Angular dev server
        "http://localhost:8080",
    ]
    
    # Pose Detection Settings
    WINDOW_SIZE: int = 30  # Número de frames para el buffer
    ARM_KEYPOINTS: List[int] = [11, 12, 13, 14, 15, 16]  # Solo brazos
    KEYPOINT_COORDS: int = 3  # x, y, z
    
    # WebSocket Settings
    WS_HEARTBEAT_INTERVAL: int = 30  # segundos
    
    # Database Settings (para futuras fases)
    # DATABASE_URL: str = "postgresql://user:password@localhost/aivU"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
