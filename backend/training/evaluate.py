"""
Evaluación del modelo LSTM con scikit-learn
"""
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
    roc_curve
)
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import Dict, Tuple, List
import json
import sys
import os

# Añadir el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.lstm_model import PoseLSTM, PoseLSTMLight


class ModelEvaluator:
    """
    Clase para evaluar el modelo LSTM usando scikit-learn
    """
    
    def __init__(self, model: nn.Module, device: str = "cpu"):
        """
        Inicializa el evaluador
        
        Args:
            model: Modelo a evaluar
            device: Dispositivo (cpu o cuda)
        """
        self.model = model.to(device)
        self.device = device
        self.model.eval()
    
    def predict(self, dataloader: DataLoader) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Genera predicciones para un dataset
        
        Args:
            dataloader: DataLoader con los datos
        
        Returns:
            Tupla (y_true, y_pred, y_proba)
        """
        y_true = []
        y_pred = []
        y_proba = []
        
        with torch.no_grad():
            for sequences, labels in dataloader:
                sequences = sequences.to(self.device)
                
                # Forward pass
                outputs = self.model(sequences)
                probabilities = torch.softmax(outputs, dim=1)
                _, predicted = torch.max(outputs, 1)
                
                # Guardar resultados
                y_true.extend(labels.cpu().numpy())
                y_pred.extend(predicted.cpu().numpy())
                y_proba.extend(probabilities[:, 1].cpu().numpy())  # Probabilidad de clase 1
        
        return np.array(y_true), np.array(y_pred), np.array(y_proba)
    
    def evaluate(self, dataloader: DataLoader) -> Dict:
        """
        Evalúa el modelo y calcula métricas
        
        Args:
            dataloader: DataLoader con los datos
        
        Returns:
            Diccionario con métricas
        """
        y_true, y_pred, y_proba = self.predict(dataloader)
        
        # Calcular métricas
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='binary'),
            'recall': recall_score(y_true, y_pred, average='binary'),
            'f1_score': f1_score(y_true, y_pred, average='binary'),
            'roc_auc': roc_auc_score(y_true, y_proba),
            'confusion_matrix': confusion_matrix(y_true, y_pred).tolist(),
            'classification_report': classification_report(
                y_true, y_pred,
                target_names=['Incorrecto', 'Correcto'],
                output_dict=True
            )
        }
        
        return metrics
    
    def print_metrics(self, metrics: Dict):
        """
        Imprime las métricas de forma legible
        
        Args:
            metrics: Diccionario con métricas
        """
        print("\n" + "=" * 60)
        print("MÉTRICAS DE EVALUACIÓN")
        print("=" * 60)
        
        print(f"\n📊 Métricas Generales:")
        print(f"   Accuracy:  {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
        print(f"   Precision: {metrics['precision']:.4f}")
        print(f"   Recall:    {metrics['recall']:.4f}")
        print(f"   F1-Score:  {metrics['f1_score']:.4f}")
        print(f"   ROC-AUC:   {metrics['roc_auc']:.4f}")
        
        print(f"\n🔢 Matriz de Confusión:")
        cm = np.array(metrics['confusion_matrix'])
        print(f"   [[TN={cm[0,0]}, FP={cm[0,1]}],")
        print(f"    [FN={cm[1,0]}, TP={cm[1,1]}]]")
        
        print(f"\n📋 Reporte de Clasificación:")
        report = metrics['classification_report']
        for class_name in ['Incorrecto', 'Correcto']:
            if class_name in report:
                class_metrics = report[class_name]
                print(f"\n   {class_name}:")
                print(f"      Precision: {class_metrics['precision']:.4f}")
                print(f"      Recall:    {class_metrics['recall']:.4f}")
                print(f"      F1-Score:  {class_metrics['f1-score']:.4f}")
                print(f"      Support:   {class_metrics['support']}")
        
        # Métricas macro y weighted
        if 'macro avg' in report:
            print(f"\n   Macro Average:")
            print(f"      F1-Score: {report['macro avg']['f1-score']:.4f}")
        
        if 'weighted avg' in report:
            print(f"\n   Weighted Average:")
            print(f"      F1-Score: {report['weighted avg']['f1-score']:.4f}")
    
    def plot_confusion_matrix(
        self,
        metrics: Dict,
        save_path: str = None,
        figsize: Tuple[int, int] = (8, 6)
    ):
        """
        Grafica la matriz de confusión
        
        Args:
            metrics: Diccionario con métricas
            save_path: Ruta para guardar la figura
            figsize: Tamaño de la figura
        """
        cm = np.array(metrics['confusion_matrix'])
        
        plt.figure(figsize=figsize)
        sns.heatmap(
            cm,
            annot=True,
            fmt='d',
            cmap='Blues',
            xticklabels=['Incorrecto', 'Correcto'],
            yticklabels=['Incorrecto', 'Correcto'],
            cbar_kws={'label': 'Número de muestras'}
        )
        plt.title('Matriz de Confusión', fontsize=14, fontweight='bold')
        plt.ylabel('Etiqueta Real', fontsize=12)
        plt.xlabel('Etiqueta Predicha', fontsize=12)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"   ✅ Matriz de confusión guardada en: {save_path}")
        else:
            plt.show()
        
        plt.close()
    
    def plot_roc_curve(
        self,
        y_true: np.ndarray,
        y_proba: np.ndarray,
        save_path: str = None,
        figsize: Tuple[int, int] = (8, 6)
    ):
        """
        Grafica la curva ROC
        
        Args:
            y_true: Etiquetas verdaderas
            y_proba: Probabilidades predichas
            save_path: Ruta para guardar la figura
            figsize: Tamaño de la figura
        """
        fpr, tpr, thresholds = roc_curve(y_true, y_proba)
        roc_auc = roc_auc_score(y_true, y_proba)
        
        plt.figure(figsize=figsize)
        plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.4f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', label='Random')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate', fontsize=12)
        plt.ylabel('True Positive Rate', fontsize=12)
        plt.title('Receiver Operating Characteristic (ROC) Curve', fontsize=14, fontweight='bold')
        plt.legend(loc="lower right")
        plt.grid(alpha=0.3)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"   ✅ Curva ROC guardada en: {save_path}")
        else:
            plt.show()
        
        plt.close()
    
    def plot_metrics_comparison(
        self,
        metrics: Dict,
        save_path: str = None,
        figsize: Tuple[int, int] = (10, 6)
    ):
        """
        Grafica comparación de métricas
        
        Args:
            metrics: Diccionario con métricas
            save_path: Ruta para guardar la figura
            figsize: Tamaño de la figura
        """
        metric_names = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC']
        metric_values = [
            metrics['accuracy'],
            metrics['precision'],
            metrics['recall'],
            metrics['f1_score'],
            metrics['roc_auc']
        ]
        
        plt.figure(figsize=figsize)
        bars = plt.bar(metric_names, metric_values, color=['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'])
        
        # Añadir valores sobre las barras
        for bar in bars:
            height = bar.get_height()
            plt.text(
                bar.get_x() + bar.get_width()/2.,
                height,
                f'{height:.4f}',
                ha='center',
                va='bottom',
                fontsize=10,
                fontweight='bold'
            )
        
        plt.ylim([0, 1.1])
        plt.ylabel('Score', fontsize=12)
        plt.title('Métricas de Evaluación del Modelo', fontsize=14, fontweight='bold')
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"   ✅ Comparación de métricas guardada en: {save_path}")
        else:
            plt.show()
        
        plt.close()
    
    def save_evaluation_report(
        self,
        metrics: Dict,
        save_dir: str = "evaluation",
        model_name: str = "pose_lstm"
    ):
        """
        Guarda un reporte completo de evaluación
        
        Args:
            metrics: Diccionario con métricas
            save_dir: Directorio para guardar el reporte
            model_name: Nombre del modelo
        """
        save_path = Path(save_dir)
        save_path.mkdir(exist_ok=True)
        
        # Guardar métricas en JSON
        json_path = save_path / f"{model_name}_metrics.json"
        with open(json_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        print(f"   ✅ Métricas guardadas en: {json_path}")
        
        # Guardar gráficas
        self.plot_confusion_matrix(
            metrics,
            save_path=save_path / f"{model_name}_confusion_matrix.png"
        )
        
        self.plot_metrics_comparison(
            metrics,
            save_path=save_path / f"{model_name}_metrics_comparison.png"
        )


def load_model(model_path: str, device: str = "cpu") -> nn.Module:
    """
    Carga un modelo desde un checkpoint
    
    Args:
        model_path: Ruta al checkpoint
        device: Dispositivo
    
    Returns:
        Modelo cargado
    """
    checkpoint = torch.load(model_path, map_location=device)
    
    # Crear modelo
    model = PoseLSTM()
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    
    print(f"✅ Modelo cargado desde: {model_path}")
    print(f"   Época: {checkpoint.get('epoch', 'N/A')}")
    print(f"   Val Loss: {checkpoint.get('val_loss', 'N/A'):.4f}")
    print(f"   Val Acc: {checkpoint.get('val_acc', 'N/A'):.2f}%")
    
    return model


def main():
    """Función principal de evaluación"""
    
    print("\n" + "=" * 60)
    print("EVALUACIÓN DEL MODELO LSTM - aivU")
    print("=" * 60)
    
    # Configuración
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"\nDevice: {device}")
    
    # Nota: Este es un ejemplo con datos sintéticos
    # En producción, cargarías tu modelo entrenado y datos reales
    print("\n⚠️  Nota: Usando datos sintéticos para demostración")
    print("   En producción, carga tu modelo entrenado y datos reales\n")
    
    # Crear modelo y datos de ejemplo
    from training.dataset import create_synthetic_dataset, split_dataset, create_dataloaders
    
    print("1️⃣ Creando dataset de prueba...")
    sequences, labels = create_synthetic_dataset(num_samples=500)
    _, _, test_data = split_dataset(sequences, labels)
    _, _, test_loader = create_dataloaders(
        (sequences[:100], labels[:100]),
        (sequences[100:200], labels[100:200]),
        test_data,
        batch_size=32
    )
    print(f"   ✅ Test set: {len(test_data[0])} muestras")
    
    print("\n2️⃣ Creando modelo...")
    model = PoseLSTM()
    print(f"   ✅ Modelo creado")
    
    print("\n3️⃣ Evaluando modelo...")
    evaluator = ModelEvaluator(model, device=device)
    
    # Obtener predicciones
    y_true, y_pred, y_proba = evaluator.predict(test_loader)
    
    # Calcular métricas
    metrics = evaluator.evaluate(test_loader)
    
    # Imprimir métricas
    evaluator.print_metrics(metrics)
    
    # Guardar reporte
    print("\n4️⃣ Guardando reporte de evaluación...")
    evaluator.save_evaluation_report(metrics, save_dir="evaluation")
    
    # Graficar curva ROC
    print("\n5️⃣ Generando curva ROC...")
    evaluator.plot_roc_curve(
        y_true,
        y_proba,
        save_path="evaluation/pose_lstm_roc_curve.png"
    )
    
    print("\n" + "=" * 60)
    print("✅ Evaluación completada exitosamente!")
    print("📁 Reportes guardados en: ./evaluation/")
    print("=" * 60)


if __name__ == "__main__":
    main()
