# 🚀 Inicio Rápido - Documentación

## Instalación en 3 Pasos

### 1️⃣ Instalar Dependencias

```bash
pip install -r requirements.txt
```

Esto instalará Sphinx y todas las herramientas necesarias.

### 2️⃣ Generar Documentación

```bash
python generate_docs.py --open
```

Esto generará la documentación HTML y la abrirá automáticamente en tu navegador.

### 3️⃣ ¡Listo! 🎉

Explora la documentación completa en tu navegador.

---

## Comandos Útiles

### Generar Documentación

```bash
# Generar HTML
python generate_docs.py

# Generar y abrir en navegador
python generate_docs.py --open

# Limpiar y regenerar
python generate_docs.py --clean

# Ver estadísticas
python generate_docs.py --stats

# Generar PDF (requiere LaTeX)
python generate_docs.py --pdf

# Hacer todo
python generate_docs.py --all --stats --open
```

### Usando Make (Alternativa)

**Windows:**
```bash
cd docs
make.bat html
start _build\html\index.html
```

**Linux/Mac:**
```bash
cd docs
make html
xdg-open _build/html/index.html  # Linux
open _build/html/index.html      # Mac
```

---

## Estructura de la Documentación

```
📚 Documentación aivU Backend
│
├── 📖 Guías
│   ├── Instalación
│   ├── Inicio Rápido
│   └── Arquitectura
│
├── 🔌 API Reference
│   ├── Aplicación Principal
│   ├── Modelos de Datos
│   ├── Servicios
│   └── Rutas API
│
├── 🤖 Machine Learning
│   ├── Modelo LSTM
│   ├── Entrenamiento
│   └── Evaluación
│
└── 💻 Desarrollo
    ├── Configuración
    ├── Testing
    └── Contribución
```

---

## Contenido Destacado

### 🎯 Para Usuarios

- **Installation**: Cómo instalar el backend paso a paso
- **Quickstart**: Ejemplos prácticos de uso inmediato
- **Architecture**: Entender cómo funciona el sistema

### 🔧 Para Desarrolladores

- **API Reference**: Documentación completa de todas las funciones
- **Development Setup**: Configurar entorno de desarrollo
- **Testing Guide**: Cómo escribir y ejecutar tests

### 🧠 Para ML Engineers

- **LSTM Model**: Arquitectura detallada del modelo
- **Training**: Proceso completo de entrenamiento
- **Evaluation**: Métricas y evaluación del modelo

---

## Características

✅ **Autodocumentación**: Se genera desde el código  
✅ **Búsqueda Integrada**: Busca cualquier función o clase  
✅ **Syntax Highlighting**: Código con colores  
✅ **Responsive**: Funciona en móvil y desktop  
✅ **Links Externos**: Enlaces a Python, NumPy, PyTorch docs  
✅ **Navegación Fácil**: Sidebar con todos los temas  

---

## Actualizar Documentación

Cuando hagas cambios en el código:

```bash
# Regenerar documentación
python generate_docs.py --clean --open
```

La documentación se actualizará automáticamente desde tus docstrings.

---

## Formato de Docstrings

Usa formato Google en tu código:

```python
def mi_funcion(param1: int, param2: str) -> bool:
    """Descripción breve de una línea.

    Descripción más detallada que puede ocupar
    múltiples líneas.

    Args:
        param1: Descripción del parámetro 1
        param2: Descripción del parámetro 2

    Returns:
        Descripción del valor de retorno

    Example:
        >>> mi_funcion(5, "test")
        True
    """
    pass
```

---

## Solución de Problemas

### Error: "sphinx-build not found"

```bash
pip install --upgrade sphinx
```

### Error: "Theme not found"

```bash
pip install sphinx-rtd-theme
```

### La documentación no se actualiza

```bash
python generate_docs.py --clean --open
```

---

## Más Información

📖 **Guía Completa**: Ver [DOCUMENTATION.md](DOCUMENTATION.md)  
📝 **Resumen de Setup**: Ver [SPHINX_SETUP_COMPLETE.md](SPHINX_SETUP_COMPLETE.md)  
🔗 **Sphinx Docs**: https://www.sphinx-doc.org/  

---

## ¿Necesitas Ayuda?

1. Revisa [DOCUMENTATION.md](DOCUMENTATION.md) para guía completa
2. Consulta la [documentación de Sphinx](https://www.sphinx-doc.org/)
3. Abre un issue en GitHub

---

**¡Disfruta de tu documentación profesional!** 📚✨
