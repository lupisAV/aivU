"""Script para verificar instalación de PyTorch"""
import torch
import sys

print("=" * 60)
print("Verificación de PyTorch")
print("=" * 60)
print(f"Python: {sys.version}")
print(f"PyTorch: {torch.__version__}")
print(f"CUDA disponible: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA version: {torch.version.cuda}")
    print(f"GPU: {torch.cuda.get_device_name(0)}")
print("=" * 60)
print("✅ PyTorch instalado correctamente")
