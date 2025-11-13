"""
Dataset loader para entrenamiento del modelo LSTM
"""
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from typing import Tuple, List, Optional
import json
import os
from pathlib import Path


class PoseDataset(Dataset):
    """
    Dataset para secuencias de pose
    
    Estructura esperada de datos:
    - sequences: numpy array de shape (num_samples, 30, 18)
    - labels: numpy array de shape (num_samples,) con valores 0 o 1
    """
    
    def __init__(
        self,
        sequences: np.ndarray,
        labels: np.ndarray,
        transform=None
    ):
        """
        Inicializa el dataset
        
        Args:
            sequences: Array de secuencias (num_samples, 30, 18)
            labels: Array de etiquetas (num_samples,)
            transform: Transformaciones opcionales
        """
        assert len(sequences) == len(labels), "Sequences y labels deben tener la misma longitud"
        
        self.sequences = torch.FloatTensor(sequences)
        self.labels = torch.LongTensor(labels)
        self.transform = transform
    
    def __len__(self) -> int:
        """Retorna el número de muestras"""
        return len(self.sequences)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Obtiene una muestra
        
        Args:
            idx: Índice de la muestra
        
        Returns:
            Tupla (sequence, label)
        """
        sequence = self.sequences[idx]
        label = self.labels[idx]
        
        if self.transform:
            sequence = self.transform(sequence)
        
        return sequence, label
    
    def get_class_distribution(self) -> dict:
        """Retorna la distribución de clases"""
        unique, counts = torch.unique(self.labels, return_counts=True)
        return {
            "class_0_incorrect": counts[0].item() if 0 in unique else 0,
            "class_1_correct": counts[1].item() if 1 in unique else 0,
            "total": len(self.labels)
        }


class PoseDatasetFromFiles(Dataset):
    """
    Dataset que carga datos desde archivos
    Útil para datasets grandes que no caben en memoria
    """
    
    def __init__(
        self,
        data_dir: str,
        split: str = "train",
        transform=None
    ):
        """
        Inicializa el dataset desde archivos
        
        Args:
            data_dir: Directorio con los datos
            split: "train", "val" o "test"
            transform: Transformaciones opcionales
        """
        self.data_dir = Path(data_dir)
        self.split = split
        self.transform = transform
        
        # Cargar índice de archivos
        index_file = self.data_dir / f"{split}_index.json"
        if not index_file.exists():
            raise FileNotFoundError(f"No se encontró {index_file}")
        
        with open(index_file, 'r') as f:
            self.index = json.load(f)
        
        self.file_list = self.index['files']
        self.labels = self.index['labels']
    
    def __len__(self) -> int:
        return len(self.file_list)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        # Cargar secuencia desde archivo
        file_path = self.data_dir / self.file_list[idx]
        sequence = np.load(file_path)
        sequence = torch.FloatTensor(sequence)
        
        label = torch.LongTensor([self.labels[idx]])[0]
        
        if self.transform:
            sequence = self.transform(sequence)
        
        return sequence, label


def create_synthetic_dataset(
    num_samples: int = 1000,
    sequence_length: int = 30,
    num_features: int = 18,
    class_balance: float = 0.5
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Crea un dataset sintético para pruebas
    
    Args:
        num_samples: Número de muestras a generar
        sequence_length: Longitud de cada secuencia
        num_features: Número de features por frame
        class_balance: Proporción de clase 1 (correcto)
    
    Returns:
        Tupla (sequences, labels)
    """
    # Generar secuencias aleatorias
    sequences = np.random.randn(num_samples, sequence_length, num_features).astype(np.float32)
    
    # Generar labels balanceados
    num_correct = int(num_samples * class_balance)
    labels = np.array([1] * num_correct + [0] * (num_samples - num_correct))
    np.random.shuffle(labels)
    
    # Añadir patrones para diferenciar clases (opcional)
    for i in range(num_samples):
        if labels[i] == 1:
            # Clase "correcto": añadir patrón sinusoidal
            t = np.linspace(0, 2 * np.pi, sequence_length)
            pattern = np.sin(t)[:, np.newaxis]
            sequences[i] += pattern * 0.5
        else:
            # Clase "incorrecto": añadir ruido adicional
            sequences[i] += np.random.randn(sequence_length, num_features) * 0.3
    
    return sequences, labels


def split_dataset(
    sequences: np.ndarray,
    labels: np.ndarray,
    train_ratio: float = 0.7,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    shuffle: bool = True,
    random_seed: int = 42
) -> Tuple[Tuple[np.ndarray, np.ndarray], ...]:
    """
    Divide el dataset en train, validation y test
    
    Args:
        sequences: Array de secuencias
        labels: Array de etiquetas
        train_ratio: Proporción para entrenamiento
        val_ratio: Proporción para validación
        test_ratio: Proporción para test
        shuffle: Si mezclar los datos antes de dividir
        random_seed: Semilla para reproducibilidad
    
    Returns:
        Tupla ((train_seq, train_labels), (val_seq, val_labels), (test_seq, test_labels))
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, "Las proporciones deben sumar 1"
    
    num_samples = len(sequences)
    indices = np.arange(num_samples)
    
    if shuffle:
        np.random.seed(random_seed)
        np.random.shuffle(indices)
    
    # Calcular índices de división
    train_end = int(num_samples * train_ratio)
    val_end = train_end + int(num_samples * val_ratio)
    
    # Dividir índices
    train_indices = indices[:train_end]
    val_indices = indices[train_end:val_end]
    test_indices = indices[val_end:]
    
    # Dividir datos
    train_data = (sequences[train_indices], labels[train_indices])
    val_data = (sequences[val_indices], labels[val_indices])
    test_data = (sequences[test_indices], labels[test_indices])
    
    return train_data, val_data, test_data


def create_dataloaders(
    train_data: Tuple[np.ndarray, np.ndarray],
    val_data: Tuple[np.ndarray, np.ndarray],
    test_data: Tuple[np.ndarray, np.ndarray],
    batch_size: int = 32,
    num_workers: int = 0
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Crea DataLoaders para train, val y test
    
    Args:
        train_data: Tupla (sequences, labels) para entrenamiento
        val_data: Tupla (sequences, labels) para validación
        test_data: Tupla (sequences, labels) para test
        batch_size: Tamaño del batch
        num_workers: Número de workers para carga de datos
    
    Returns:
        Tupla (train_loader, val_loader, test_loader)
    """
    train_dataset = PoseDataset(*train_data)
    val_dataset = PoseDataset(*val_data)
    test_dataset = PoseDataset(*test_data)
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    return train_loader, val_loader, test_loader


if __name__ == "__main__":
    print("=" * 60)
    print("Test del Dataset Loader")
    print("=" * 60)
    
    # Crear dataset sintético
    print("\n1. Creando dataset sintético...")
    sequences, labels = create_synthetic_dataset(num_samples=1000)
    print(f"   ✅ Sequences shape: {sequences.shape}")
    print(f"   ✅ Labels shape: {labels.shape}")
    print(f"   ✅ Clase 0 (incorrecto): {(labels == 0).sum()}")
    print(f"   ✅ Clase 1 (correcto): {(labels == 1).sum()}")
    
    # Dividir dataset
    print("\n2. Dividiendo dataset...")
    train_data, val_data, test_data = split_dataset(sequences, labels)
    print(f"   ✅ Train: {len(train_data[0])} muestras")
    print(f"   ✅ Val: {len(val_data[0])} muestras")
    print(f"   ✅ Test: {len(test_data[0])} muestras")
    
    # Crear datasets
    print("\n3. Creando PyTorch Datasets...")
    train_dataset = PoseDataset(*train_data)
    val_dataset = PoseDataset(*val_data)
    test_dataset = PoseDataset(*test_data)
    print(f"   ✅ Train dataset: {len(train_dataset)} muestras")
    print(f"   ✅ Val dataset: {len(val_dataset)} muestras")
    print(f"   ✅ Test dataset: {len(test_dataset)} muestras")
    
    # Test distribución de clases
    print("\n4. Distribución de clases (train):")
    dist = train_dataset.get_class_distribution()
    for key, value in dist.items():
        print(f"   {key}: {value}")
    
    # Crear dataloaders
    print("\n5. Creando DataLoaders...")
    train_loader, val_loader, test_loader = create_dataloaders(
        train_data, val_data, test_data, batch_size=32
    )
    print(f"   ✅ Train loader: {len(train_loader)} batches")
    print(f"   ✅ Val loader: {len(val_loader)} batches")
    print(f"   ✅ Test loader: {len(test_loader)} batches")
    
    # Test iteración
    print("\n6. Test de iteración...")
    batch_seq, batch_labels = next(iter(train_loader))
    print(f"   ✅ Batch sequences shape: {batch_seq.shape}")
    print(f"   ✅ Batch labels shape: {batch_labels.shape}")
    
    print("\n✅ Todos los tests del dataset pasaron!")
