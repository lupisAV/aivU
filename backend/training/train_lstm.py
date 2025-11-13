"""
Script de entrenamiento para el modelo LSTM
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import numpy as np
from pathlib import Path
import json
from datetime import datetime
from typing import Dict, Tuple, Optional
import sys
import os

# Añadir el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.lstm_model import PoseLSTM, PoseLSTMLight
from training.dataset import create_synthetic_dataset, split_dataset, create_dataloaders


class Trainer:
    """
    Clase para entrenar el modelo LSTM
    """
    
    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader,
        device: str = "cpu",
        learning_rate: float = 0.001,
        weight_decay: float = 1e-5
    ):
        """
        Inicializa el entrenador
        
        Args:
            model: Modelo a entrenar
            train_loader: DataLoader de entrenamiento
            val_loader: DataLoader de validación
            device: Dispositivo (cpu o cuda)
            learning_rate: Tasa de aprendizaje
            weight_decay: Regularización L2
        """
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device
        
        # Loss function
        self.criterion = nn.CrossEntropyLoss()
        
        # Optimizer
        self.optimizer = optim.Adam(
            model.parameters(),
            lr=learning_rate,
            weight_decay=weight_decay
        )
        
        # Learning rate scheduler
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer,
            mode='min',
            factor=0.5,
            patience=5
        )
        
        # Historial de entrenamiento
        self.history = {
            'train_loss': [],
            'train_acc': [],
            'val_loss': [],
            'val_acc': []
        }
        
        self.best_val_loss = float('inf')
        self.best_model_state = None
    
    def train_epoch(self) -> Tuple[float, float]:
        """
        Entrena una época
        
        Returns:
            Tupla (loss promedio, accuracy)
        """
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        for batch_idx, (sequences, labels) in enumerate(self.train_loader):
            sequences = sequences.to(self.device)
            labels = labels.to(self.device)
            
            # Forward pass
            self.optimizer.zero_grad()
            outputs = self.model(sequences)
            loss = self.criterion(outputs, labels)
            
            # Backward pass
            loss.backward()
            
            # Gradient clipping para evitar explosión de gradientes
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            
            self.optimizer.step()
            
            # Estadísticas
            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
        
        avg_loss = total_loss / len(self.train_loader)
        accuracy = 100 * correct / total
        
        return avg_loss, accuracy
    
    def validate(self) -> Tuple[float, float]:
        """
        Valida el modelo
        
        Returns:
            Tupla (loss promedio, accuracy)
        """
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for sequences, labels in self.val_loader:
                sequences = sequences.to(self.device)
                labels = labels.to(self.device)
                
                outputs = self.model(sequences)
                loss = self.criterion(outputs, labels)
                
                total_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        avg_loss = total_loss / len(self.val_loader)
        accuracy = 100 * correct / total
        
        return avg_loss, accuracy
    
    def train(
        self,
        num_epochs: int,
        save_dir: str = "models",
        model_name: str = "pose_lstm"
    ) -> Dict:
        """
        Entrena el modelo por múltiples épocas
        
        Args:
            num_epochs: Número de épocas
            save_dir: Directorio para guardar modelos
            model_name: Nombre base del modelo
        
        Returns:
            Historial de entrenamiento
        """
        save_path = Path(save_dir)
        save_path.mkdir(exist_ok=True)
        
        print("=" * 60)
        print("Iniciando Entrenamiento")
        print("=" * 60)
        print(f"Device: {self.device}")
        print(f"Épocas: {num_epochs}")
        print(f"Train batches: {len(self.train_loader)}")
        print(f"Val batches: {len(self.val_loader)}")
        print("=" * 60)
        
        for epoch in range(num_epochs):
            # Entrenar
            train_loss, train_acc = self.train_epoch()
            
            # Validar
            val_loss, val_acc = self.validate()
            
            # Actualizar scheduler
            self.scheduler.step(val_loss)
            
            # Guardar historial
            self.history['train_loss'].append(train_loss)
            self.history['train_acc'].append(train_acc)
            self.history['val_loss'].append(val_loss)
            self.history['val_acc'].append(val_acc)
            
            # Imprimir progreso
            print(f"Epoch [{epoch+1}/{num_epochs}]")
            print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
            print(f"  Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%")
            
            # Guardar mejor modelo
            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                self.best_model_state = self.model.state_dict().copy()
                
                # Guardar checkpoint
                checkpoint_path = save_path / f"{model_name}_best.pth"
                self.save_checkpoint(checkpoint_path, epoch, val_loss, val_acc)
                print(f"  ✅ Mejor modelo guardado (val_loss: {val_loss:.4f})")
            
            print("-" * 60)
        
        # Cargar mejor modelo
        if self.best_model_state is not None:
            self.model.load_state_dict(self.best_model_state)
        
        # Guardar modelo final
        final_path = save_path / f"{model_name}_final.pth"
        self.save_checkpoint(final_path, num_epochs, val_loss, val_acc)
        
        # Guardar historial
        history_path = save_path / f"{model_name}_history.json"
        with open(history_path, 'w') as f:
            json.dump(self.history, f, indent=2)
        
        print("=" * 60)
        print("Entrenamiento Completado")
        print(f"Mejor Val Loss: {self.best_val_loss:.4f}")
        print(f"Modelo guardado en: {save_path}")
        print("=" * 60)
        
        return self.history
    
    def save_checkpoint(
        self,
        path: Path,
        epoch: int,
        val_loss: float,
        val_acc: float
    ):
        """Guarda un checkpoint del modelo"""
        torch.save({
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'val_loss': val_loss,
            'val_acc': val_acc,
            'history': self.history,
            'model_info': self.model.get_model_info() if hasattr(self.model, 'get_model_info') else {}
        }, path)


def main():
    """Función principal de entrenamiento"""
    
    print("\n" + "=" * 60)
    print("ENTRENAMIENTO DEL MODELO LSTM - aivU")
    print("=" * 60)
    
    # Configuración
    config = {
        'num_samples': 2000,
        'batch_size': 32,
        'num_epochs': 50,
        'learning_rate': 0.001,
        'hidden_size': 128,
        'num_layers': 2,
        'dropout': 0.3,
        'device': 'cuda' if torch.cuda.is_available() else 'cpu'
    }
    
    print("\n📋 Configuración:")
    for key, value in config.items():
        print(f"   {key}: {value}")
    
    # Crear dataset sintético
    print("\n1️⃣ Creando dataset sintético...")
    sequences, labels = create_synthetic_dataset(num_samples=config['num_samples'])
    print(f"   ✅ Dataset creado: {sequences.shape}")
    print(f"   ✅ Clase 0: {(labels == 0).sum()}, Clase 1: {(labels == 1).sum()}")
    
    # Dividir dataset
    print("\n2️⃣ Dividiendo dataset...")
    train_data, val_data, test_data = split_dataset(sequences, labels)
    print(f"   ✅ Train: {len(train_data[0])} muestras")
    print(f"   ✅ Val: {len(val_data[0])} muestras")
    print(f"   ✅ Test: {len(test_data[0])} muestras")
    
    # Crear dataloaders
    print("\n3️⃣ Creando DataLoaders...")
    train_loader, val_loader, test_loader = create_dataloaders(
        train_data, val_data, test_data,
        batch_size=config['batch_size']
    )
    print(f"   ✅ DataLoaders creados")
    
    # Crear modelo
    print("\n4️⃣ Creando modelo...")
    model = PoseLSTM(
        input_size=18,
        hidden_size=config['hidden_size'],
        num_layers=config['num_layers'],
        num_classes=2,
        dropout=config['dropout'],
        bidirectional=True
    )
    
    model_info = model.get_model_info()
    print(f"   ✅ Modelo creado: {model_info['model_name']}")
    print(f"   ✅ Parámetros totales: {model_info['total_parameters']:,}")
    print(f"   ✅ Parámetros entrenables: {model_info['trainable_parameters']:,}")
    
    # Crear entrenador
    print("\n5️⃣ Inicializando entrenador...")
    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        device=config['device'],
        learning_rate=config['learning_rate']
    )
    print(f"   ✅ Entrenador inicializado en {config['device']}")
    
    # Entrenar
    print("\n6️⃣ Entrenando modelo...\n")
    history = trainer.train(
        num_epochs=config['num_epochs'],
        save_dir="models",
        model_name="pose_lstm"
    )
    
    # Resumen final
    print("\n📊 Resumen Final:")
    print(f"   Train Loss: {history['train_loss'][-1]:.4f}")
    print(f"   Train Acc: {history['train_acc'][-1]:.2f}%")
    print(f"   Val Loss: {history['val_loss'][-1]:.4f}")
    print(f"   Val Acc: {history['val_acc'][-1]:.2f}%")
    print(f"   Mejor Val Loss: {trainer.best_val_loss:.4f}")
    
    print("\n✅ Entrenamiento completado exitosamente!")
    print(f"📁 Modelos guardados en: ./models/")


if __name__ == "__main__":
    main()
