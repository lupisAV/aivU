"""
Modelo LSTM para clasificación de ejercicios
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple


class PoseLSTM(nn.Module):
    """
    Red LSTM para clasificación de secuencias de pose
    
    Arquitectura:
    - Input: (batch, sequence_length, features) -> (batch, 30, 18)
    - LSTM bidireccional de 2 capas
    - Dropout para regularización
    - Fully connected layers
    - Output: (batch, 2) -> [correcto, incorrecto]
    """
    
    def __init__(
        self,
        input_size: int = 18,
        hidden_size: int = 128,
        num_layers: int = 2,
        num_classes: int = 2,
        dropout: float = 0.3,
        bidirectional: bool = True
    ):
        """
        Inicializa el modelo LSTM
        
        Args:
            input_size: Número de features por frame (default: 18)
            hidden_size: Tamaño del estado oculto del LSTM
            num_layers: Número de capas LSTM
            num_classes: Número de clases (2: correcto/incorrecto)
            dropout: Tasa de dropout para regularización
            bidirectional: Si usar LSTM bidireccional
        """
        super(PoseLSTM, self).__init__()
        
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.num_classes = num_classes
        self.bidirectional = bidirectional
        self.num_directions = 2 if bidirectional else 1
        
        # LSTM Layer
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional
        )
        
        # Dropout layer
        self.dropout = nn.Dropout(dropout)
        
        # Fully connected layers
        fc_input_size = hidden_size * self.num_directions
        
        self.fc1 = nn.Linear(fc_input_size, 64)
        self.bn1 = nn.BatchNorm1d(64)
        
        self.fc2 = nn.Linear(64, 32)
        self.bn2 = nn.BatchNorm1d(32)
        
        self.fc3 = nn.Linear(32, num_classes)
        
        # Inicialización de pesos
        self._init_weights()
    
    def _init_weights(self):
        """Inicializa los pesos de las capas"""
        for name, param in self.lstm.named_parameters():
            if 'weight_ih' in name:
                nn.init.xavier_uniform_(param.data)
            elif 'weight_hh' in name:
                nn.init.orthogonal_(param.data)
            elif 'bias' in name:
                param.data.fill_(0)
        
        for fc in [self.fc1, self.fc2, self.fc3]:
            nn.init.xavier_uniform_(fc.weight)
            nn.init.zeros_(fc.bias)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass del modelo
        
        Args:
            x: Input tensor de shape (batch, sequence_length, features)
               Ejemplo: (32, 30, 18)
        
        Returns:
            Output tensor de shape (batch, num_classes)
            Ejemplo: (32, 2)
        """
        batch_size = x.size(0)
        
        # LSTM forward
        # lstm_out: (batch, seq_len, hidden_size * num_directions)
        # h_n: (num_layers * num_directions, batch, hidden_size)
        # c_n: (num_layers * num_directions, batch, hidden_size)
        lstm_out, (h_n, c_n) = self.lstm(x)
        
        # Tomar el último estado oculto
        # Si es bidireccional, concatenar forward y backward
        if self.bidirectional:
            # h_n[-2]: último estado forward
            # h_n[-1]: último estado backward
            hidden = torch.cat((h_n[-2], h_n[-1]), dim=1)
        else:
            hidden = h_n[-1]
        
        # hidden shape: (batch, hidden_size * num_directions)
        
        # Fully connected layers con activaciones y dropout
        out = self.dropout(hidden)
        
        out = self.fc1(out)
        out = self.bn1(out)
        out = F.relu(out)
        out = self.dropout(out)
        
        out = self.fc2(out)
        out = self.bn2(out)
        out = F.relu(out)
        out = self.dropout(out)
        
        out = self.fc3(out)
        
        return out
    
    def predict(self, x: torch.Tensor) -> Tuple[int, float]:
        """
        Realiza predicción y retorna clase y confianza
        
        Args:
            x: Input tensor de shape (1, sequence_length, features)
        
        Returns:
            Tupla (clase_predicha, confianza)
            clase_predicha: 0 (incorrecto) o 1 (correcto)
            confianza: probabilidad de la clase predicha (0-1)
        """
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probabilities = F.softmax(logits, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            
            return predicted.item(), confidence.item()
    
    def get_model_info(self) -> dict:
        """
        Retorna información del modelo
        
        Returns:
            Diccionario con información del modelo
        """
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        
        return {
            "model_name": "PoseLSTM",
            "input_size": self.input_size,
            "hidden_size": self.hidden_size,
            "num_layers": self.num_layers,
            "num_classes": self.num_classes,
            "bidirectional": self.bidirectional,
            "total_parameters": total_params,
            "trainable_parameters": trainable_params
        }


class PoseLSTMLight(nn.Module):
    """
    Versión ligera del modelo LSTM para inferencia rápida
    Menos parámetros, más rápido
    """
    
    def __init__(
        self,
        input_size: int = 18,
        hidden_size: int = 64,
        num_classes: int = 2,
        dropout: float = 0.2
    ):
        super(PoseLSTMLight, self).__init__()
        
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_classes = num_classes
        
        # LSTM simple (1 capa, unidireccional)
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=1,
            batch_first=True
        )
        
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_size, num_classes)
        
        self._init_weights()
    
    def _init_weights(self):
        """Inicializa los pesos"""
        for name, param in self.lstm.named_parameters():
            if 'weight' in name:
                nn.init.xavier_uniform_(param.data)
            elif 'bias' in name:
                param.data.fill_(0)
        
        nn.init.xavier_uniform_(self.fc.weight)
        nn.init.zeros_(self.fc.bias)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass"""
        lstm_out, (h_n, c_n) = self.lstm(x)
        out = self.dropout(h_n[-1])
        out = self.fc(out)
        return out
    
    def predict(self, x: torch.Tensor) -> Tuple[int, float]:
        """Predicción con confianza"""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probabilities = F.softmax(logits, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            return predicted.item(), confidence.item()


def create_model(model_type: str = "full", **kwargs) -> nn.Module:
    """
    Factory function para crear modelos
    
    Args:
        model_type: "full" o "light"
        **kwargs: Argumentos adicionales para el modelo
    
    Returns:
        Instancia del modelo
    """
    if model_type == "full":
        return PoseLSTM(**kwargs)
    elif model_type == "light":
        return PoseLSTMLight(**kwargs)
    else:
        raise ValueError(f"Tipo de modelo desconocido: {model_type}")


if __name__ == "__main__":
    # Test del modelo
    print("=" * 60)
    print("Test del Modelo LSTM")
    print("=" * 60)
    
    # Crear modelo
    model = PoseLSTM()
    print(f"\n✅ Modelo creado: {model.__class__.__name__}")
    
    # Información del modelo
    info = model.get_model_info()
    print(f"\n📊 Información del modelo:")
    for key, value in info.items():
        print(f"   {key}: {value}")
    
    # Test forward pass
    print(f"\n🧪 Test forward pass:")
    batch_size = 4
    seq_length = 30
    features = 18
    
    x = torch.randn(batch_size, seq_length, features)
    print(f"   Input shape: {x.shape}")
    
    output = model(x)
    print(f"   Output shape: {output.shape}")
    
    # Test predicción
    print(f"\n🎯 Test predicción:")
    x_single = torch.randn(1, seq_length, features)
    predicted_class, confidence = model.predict(x_single)
    print(f"   Clase predicha: {predicted_class} ({'Correcto' if predicted_class == 1 else 'Incorrecto'})")
    print(f"   Confianza: {confidence:.4f}")
    
    # Test modelo ligero
    print(f"\n🚀 Test modelo ligero:")
    model_light = PoseLSTMLight()
    output_light = model_light(x)
    print(f"   Output shape: {output_light.shape}")
    
    total_params_light = sum(p.numel() for p in model_light.parameters())
    print(f"   Parámetros: {total_params_light} (vs {info['total_parameters']} del modelo completo)")
    
    print(f"\n✅ Todos los tests pasaron!")
