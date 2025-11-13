#!/usr/bin/env python
"""
Script para generar la documentación de aivU Backend con Sphinx.

Uso:
    python generate_docs.py              # Generar HTML
    python generate_docs.py --clean      # Limpiar y generar
    python generate_docs.py --open       # Generar y abrir en navegador
    python generate_docs.py --pdf        # Generar PDF (requiere LaTeX)
"""

import argparse
import os
import platform
import subprocess
import sys
from pathlib import Path


def get_docs_dir():
    """Obtiene el directorio de documentación."""
    script_dir = Path(__file__).parent
    docs_dir = script_dir / "docs"
    
    if not docs_dir.exists():
        print(f"❌ Error: Directorio de documentación no encontrado: {docs_dir}")
        sys.exit(1)
    
    return docs_dir


def check_sphinx_installed():
    """Verifica que Sphinx esté instalado."""
    try:
        import sphinx
        print(f"✓ Sphinx {sphinx.__version__} encontrado")
        return True
    except ImportError:
        print("❌ Error: Sphinx no está instalado")
        print("\nInstala las dependencias con:")
        print("  pip install -r requirements.txt")
        return False


def clean_build(docs_dir):
    """Limpia el directorio de build."""
    build_dir = docs_dir / "_build"
    
    if build_dir.exists():
        print(f"🧹 Limpiando {build_dir}...")
        
        if platform.system() == "Windows":
            subprocess.run(["rmdir", "/s", "/q", str(build_dir)], shell=True)
        else:
            subprocess.run(["rm", "-rf", str(build_dir)])
        
        print("✓ Directorio limpiado")
    else:
        print("ℹ️  No hay nada que limpiar")


def generate_html(docs_dir):
    """Genera documentación HTML."""
    print("\n📚 Generando documentación HTML...")
    
    os.chdir(docs_dir)
    
    if platform.system() == "Windows":
        cmd = ["make.bat", "html"]
    else:
        cmd = ["make", "html"]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✓ Documentación HTML generada exitosamente")
        
        html_index = docs_dir / "_build" / "html" / "index.html"
        print(f"\n📄 Archivo principal: {html_index}")
        
        return html_index
    else:
        print("❌ Error al generar documentación:")
        print(result.stderr)
        return None


def generate_pdf(docs_dir):
    """Genera documentación PDF."""
    print("\n📄 Generando documentación PDF...")
    print("⚠️  Requiere LaTeX instalado (MiKTeX en Windows, TeX Live en Linux)")
    
    os.chdir(docs_dir)
    
    if platform.system() == "Windows":
        cmd = ["make.bat", "latexpdf"]
    else:
        cmd = ["make", "latexpdf"]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✓ Documentación PDF generada exitosamente")
        
        pdf_file = docs_dir / "_build" / "latex" / "aivubackend.pdf"
        if pdf_file.exists():
            print(f"\n📄 Archivo PDF: {pdf_file}")
            return pdf_file
    else:
        print("❌ Error al generar PDF:")
        print(result.stderr)
        print("\nAsegúrate de tener LaTeX instalado:")
        print("  Windows: https://miktex.org/download")
        print("  Linux: sudo apt-get install texlive-full")
        print("  Mac: brew install --cask mactex")
    
    return None


def open_in_browser(file_path):
    """Abre el archivo en el navegador."""
    if not file_path or not file_path.exists():
        print("❌ Error: Archivo no encontrado")
        return
    
    print(f"\n🌐 Abriendo {file_path.name} en el navegador...")
    
    system = platform.system()
    
    try:
        if system == "Windows":
            os.startfile(file_path)
        elif system == "Darwin":  # Mac
            subprocess.run(["open", str(file_path)])
        else:  # Linux
            subprocess.run(["xdg-open", str(file_path)])
        
        print("✓ Documentación abierta")
    except Exception as e:
        print(f"❌ Error al abrir navegador: {e}")
        print(f"Abre manualmente: {file_path}")


def show_statistics(docs_dir):
    """Muestra estadísticas de la documentación."""
    print("\n📊 Estadísticas:")
    
    # Contar archivos .rst
    rst_files = list(docs_dir.rglob("*.rst"))
    print(f"  • Archivos .rst: {len(rst_files)}")
    
    # Contar líneas totales
    total_lines = 0
    for rst_file in rst_files:
        try:
            with open(rst_file, 'r', encoding='utf-8') as f:
                total_lines += len(f.readlines())
        except:
            pass
    
    print(f"  • Líneas de documentación: {total_lines:,}")
    
    # Tamaño del build
    build_dir = docs_dir / "_build" / "html"
    if build_dir.exists():
        html_files = list(build_dir.rglob("*.html"))
        print(f"  • Páginas HTML generadas: {len(html_files)}")


def main():
    parser = argparse.ArgumentParser(
        description="Genera la documentación de aivU Backend con Sphinx",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python generate_docs.py              # Generar HTML
  python generate_docs.py --clean      # Limpiar y generar
  python generate_docs.py --open       # Generar y abrir
  python generate_docs.py --pdf        # Generar PDF
  python generate_docs.py --all        # Generar HTML y PDF
        """
    )
    
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Limpiar directorio de build antes de generar"
    )
    
    parser.add_argument(
        "--open",
        action="store_true",
        help="Abrir documentación en navegador después de generar"
    )
    
    parser.add_argument(
        "--pdf",
        action="store_true",
        help="Generar documentación en PDF (requiere LaTeX)"
    )
    
    parser.add_argument(
        "--all",
        action="store_true",
        help="Generar HTML y PDF"
    )
    
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Mostrar estadísticas de la documentación"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("  📚 Generador de Documentación aivU Backend")
    print("=" * 60)
    
    # Verificar Sphinx
    if not check_sphinx_installed():
        sys.exit(1)
    
    # Obtener directorio de docs
    docs_dir = get_docs_dir()
    print(f"📁 Directorio de documentación: {docs_dir}")
    
    # Limpiar si se solicita
    if args.clean:
        clean_build(docs_dir)
    
    # Generar HTML (por defecto o si se especifica --all)
    html_file = None
    if not args.pdf or args.all:
        html_file = generate_html(docs_dir)
    
    # Generar PDF si se solicita
    pdf_file = None
    if args.pdf or args.all:
        pdf_file = generate_pdf(docs_dir)
    
    # Mostrar estadísticas
    if args.stats or args.all:
        show_statistics(docs_dir)
    
    # Abrir en navegador
    if args.open and html_file:
        open_in_browser(html_file)
    
    print("\n" + "=" * 60)
    print("✅ Proceso completado")
    print("=" * 60)
    
    # Mostrar comandos útiles
    print("\n💡 Comandos útiles:")
    print("  • Ver HTML: python generate_docs.py --open")
    print("  • Limpiar: python generate_docs.py --clean")
    print("  • Generar PDF: python generate_docs.py --pdf")
    print("  • Todo: python generate_docs.py --all --open")


if __name__ == "__main__":
    main()
