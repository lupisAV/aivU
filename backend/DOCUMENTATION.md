# Documentación de aivU Backend

## 📚 Visión General

Este proyecto utiliza **Sphinx** para generar documentación técnica completa y profesional del backend de aivU.

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
pip install -r requirements.txt
```

Esto instalará:
- `sphinx>=7.2.0` - Motor de documentación
- `sphinx-rtd-theme>=2.0.0` - Tema ReadTheDocs
- `sphinx-autodoc-typehints>=1.25.0` - Autodocumentación con type hints
- `myst-parser>=2.0.0` - Soporte para Markdown

### 2. Generar Documentación

#### Opción 1: Script Python (Recomendado)

```bash
# Generar HTML
python generate_docs.py

# Generar y abrir en navegador
python generate_docs.py --open

# Limpiar y regenerar
python generate_docs.py --clean --open

# Generar PDF (requiere LaTeX)
python generate_docs.py --pdf

# Generar todo con estadísticas
python generate_docs.py --all --stats --open
```

#### Opción 2: Make (Manual)

**Windows:**
```bash
cd docs
make.bat html
start _build/html/index.html
```

**Linux/Mac:**
```bash
cd docs
make html
xdg-open _build/html/index.html  # Linux
open _build/html/index.html      # Mac
```

## 📖 Estructura de la Documentación

```
docs/
├── conf.py                      # Configuración de Sphinx
├── index.rst                    # Página principal
│
├── installation.rst             # Guía de instalación
├── quickstart.rst               # Inicio rápido
├── architecture.rst             # Arquitectura del sistema
│
├── api/                         # Referencia de API
│   ├── main.rst                 # Aplicación principal
│   ├── models.rst               # Modelos de datos
│   ├── services.rst             # Servicios
│   └── routes.rst               # Rutas API
│
├── ml/                          # Machine Learning
│   ├── lstm_model.rst           # Modelo LSTM
│   ├── training.rst             # Entrenamiento
│   └── evaluation.rst           # Evaluación
│
└── development/                 # Desarrollo
    ├── setup.rst                # Configuración
    ├── testing.rst              # Testing
    └── contributing.rst         # Contribución
```

## 🎨 Características

### Autodocumentación

La documentación se genera automáticamente desde los docstrings del código:

```python
def predict(self, sequence: np.ndarray) -> Dict[str, Any]:
    """Realiza predicción en una secuencia de keypoints.

    Args:
        sequence: Array de forma (30, 18) con keypoints normalizados

    Returns:
        Diccionario con:
        - classification: "correcto" o "incorrecto"
        - confidence: Nivel de confianza (0-1)
        - probabilities: Probabilidades de cada clase

    Raises:
        ValueError: Si la secuencia no tiene la forma correcta

    Example:
        >>> service = InferenceService()
        >>> result = service.predict(sequence)
        >>> print(result['classification'])
        'correcto'
    """
    pass
```

### Soporte para Markdown

Puedes usar Markdown dentro de archivos `.rst` gracias a MyST Parser:

````rst
```python
# Código Python con syntax highlighting
def hello():
    print("Hello, World!")
```
````

### Type Hints

Los type hints se documentan automáticamente:

```python
def process_data(
    data: List[np.ndarray],
    normalize: bool = True
) -> Tuple[np.ndarray, Dict[str, float]]:
    pass
```

### Intersphinx

Links automáticos a documentación externa:
- Python: https://docs.python.org/3
- NumPy: https://numpy.org/doc/stable/
- PyTorch: https://pytorch.org/docs/stable/

## 📝 Escribir Documentación

### Formato reStructuredText

```rst
Título Principal
================

Sección
-------

Subsección
~~~~~~~~~~

**Negrita** y *cursiva*

Listas:

* Item 1
* Item 2

Listas numeradas:

1. Primero
2. Segundo

Código:

.. code-block:: python

   def example():
       pass

Links:

`Texto del link <https://example.com>`_

Notas:

.. note::
   Esto es una nota

Advertencias:

.. warning::
   Esto es una advertencia
```

### Docstrings (Formato Google)

```python
def function(arg1: int, arg2: str) -> bool:
    """Descripción breve de una línea.

    Descripción más detallada que puede ocupar
    múltiples líneas.

    Args:
        arg1: Descripción del argumento 1
        arg2: Descripción del argumento 2

    Returns:
        Descripción del valor de retorno

    Raises:
        ValueError: Cuando ocurre X
        TypeError: Cuando ocurre Y

    Example:
        >>> function(5, "test")
        True

    Note:
        Notas adicionales sobre la función

    Warning:
        Advertencias importantes
    """
    pass
```

## 🔧 Configuración Avanzada

### Personalizar Tema

Edita `docs/conf.py`:

```python
html_theme_options = {
    'navigation_depth': 4,
    'collapse_navigation': False,
    'sticky_navigation': True,
    'style_external_links': True,
}
```

### Agregar Extensiones

```python
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'sphinx.ext.todo',
    'sphinx.ext.coverage',
    'sphinx.ext.intersphinx',
    'sphinx_autodoc_typehints',
    'myst_parser',
]
```

### Configurar Autodoc

```python
autodoc_default_options = {
    'members': True,
    'member-order': 'bysource',
    'special-members': '__init__',
    'undoc-members': True,
    'exclude-members': '__weakref__'
}
```

## 📊 Generar Diferentes Formatos

### HTML (Por defecto)

```bash
python generate_docs.py
```

### PDF (Requiere LaTeX)

**Instalar LaTeX:**

- **Windows**: [MiKTeX](https://miktex.org/download)
- **Linux**: `sudo apt-get install texlive-full`
- **Mac**: `brew install --cask mactex`

**Generar PDF:**

```bash
python generate_docs.py --pdf
```

### ePub

```bash
cd docs
make epub
```

### Man Pages

```bash
cd docs
make man
```

## 🧪 Verificar Documentación

### Verificar Enlaces

```bash
cd docs
make linkcheck
```

### Verificar Cobertura

```bash
cd docs
make coverage
```

Esto genera un reporte de qué funciones/clases no tienen documentación.

## 🚀 Desplegar Documentación

### GitHub Pages

1. Generar documentación:
   ```bash
   python generate_docs.py
   ```

2. Copiar a carpeta de deploy:
   ```bash
   cp -r docs/_build/html/* ../docs-deploy/
   ```

3. Commit y push:
   ```bash
   cd ../docs-deploy
   git add .
   git commit -m "Update documentation"
   git push
   ```

### ReadTheDocs

1. Crear cuenta en [ReadTheDocs](https://readthedocs.org/)
2. Conectar repositorio de GitHub
3. ReadTheDocs generará automáticamente la documentación en cada push

### Netlify

1. Generar documentación:
   ```bash
   python generate_docs.py
   ```

2. Deploy:
   ```bash
   netlify deploy --dir=docs/_build/html --prod
   ```

## 📚 Recursos

### Sphinx

- [Documentación oficial](https://www.sphinx-doc.org/)
- [Tutorial](https://www.sphinx-doc.org/en/master/tutorial/)
- [reStructuredText Primer](https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html)

### Temas

- [ReadTheDocs Theme](https://sphinx-rtd-theme.readthedocs.io/)
- [Furo](https://pradyunsg.me/furo/)
- [Book Theme](https://sphinx-book-theme.readthedocs.io/)

### Extensiones

- [Autodoc](https://www.sphinx-doc.org/en/master/usage/extensions/autodoc.html)
- [Napoleon](https://www.sphinx-doc.org/en/master/usage/extensions/napoleon.html)
- [MyST Parser](https://myst-parser.readthedocs.io/)

## 🐛 Solución de Problemas

### Error: "sphinx-build not found"

```bash
pip install --upgrade sphinx
```

### Error: "Theme not found"

```bash
pip install sphinx-rtd-theme
```

### Error al generar PDF

Instala LaTeX:
- Windows: https://miktex.org/download
- Linux: `sudo apt-get install texlive-full`
- Mac: `brew install --cask mactex`

### Advertencias de autodoc

Asegúrate de que todos los módulos tengan docstrings:

```python
"""Módulo para procesamiento de poses.

Este módulo contiene funciones para normalizar
y procesar secuencias de keypoints.
"""
```

### Enlaces rotos

Ejecuta:
```bash
cd docs
make linkcheck
```

## 💡 Tips

1. **Regenera frecuentemente**: Usa `python generate_docs.py --open` mientras escribes
2. **Usa autodoc**: Documenta en el código, no en archivos .rst
3. **Sé consistente**: Usa siempre el mismo formato de docstrings
4. **Agrega ejemplos**: Los ejemplos son muy valiosos
5. **Usa intersphinx**: Enlaza a documentación externa cuando sea posible

## 📞 Soporte

Si tienes problemas con la documentación:

1. Revisa los logs de Sphinx en la consola
2. Verifica que todas las dependencias estén instaladas
3. Consulta la [documentación de Sphinx](https://www.sphinx-doc.org/)
4. Abre un issue en GitHub

---

**¡Documentación es código!** Mantenla actualizada y de alta calidad. 📚✨
