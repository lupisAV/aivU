import re
import sys

path = r"C:\Users\danie\OneDrive\Documentos\Escritorio\aivU\src\app\exercise-recommendation\exercise-recommendation.component.css"

try:
    with open(path, "r", encoding="utf-8") as f:
        css = f.read()

    # Replace Grid with Carousel
    css = css.replace(".exercises-grid {", ".exercises-carousel {\n  display: flex;\n  gap: 1.5rem;\n  overflow-x: auto;\n  scroll-snap-type: x mandatory;\n  padding-bottom: 1.5rem;\n  scroll-behavior: smooth;\n  scrollbar-width: thin;\n  scrollbar-color: var(--accent-violet) var(--bg-elevated);\n}\n\n.exercises-carousel::-webkit-scrollbar {\n  height: 8px;\n}\n.exercises-carousel::-webkit-scrollbar-track {\n  background: var(--bg-elevated);\n  border-radius: 4px;\n}\n.exercises-carousel::-webkit-scrollbar-thumb {\n  background: var(--accent-violet);\n  border-radius: 4px;\n}\n\n.old-grid {")

    # Remove the grid columns
    css = css.replace("grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));", "")

    # Modify the exercise card for carousel
    css = css.replace(".exercise-card {", ".exercise-card {\n  flex: 0 0 calc(50% - 1rem);\n  min-width: 250px;\n  scroll-snap-align: start;\n  cursor: pointer;")

    # Add Modal CSS
    modal_css = """
/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid rgba(123, 47, 214, 0.2);
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.3s;
  z-index: 10;
}
.modal-close:hover { color: var(--text-primary); }

.modal-header {
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid rgba(123, 47, 214, 0.1);
}
.modal-header h3 { font-size: 1.8rem; margin: 0 0 0.5rem; color: var(--text-primary); }

.modal-header.recommended h3 { color: var(--status-green); }
.modal-header.caution h3 { color: var(--status-yellow); }
.modal-header.not-recommended h3 { color: var(--status-red); }

.modal-body {
  padding: 2rem;
}

.modal-description {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.modal-section {
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(123, 47, 214, 0.1);
}

.modal-section h4 {
  display: flex; align-items: center; gap: 0.5rem;
  color: var(--text-primary); margin-bottom: 1rem;
  font-size: 1.1rem;
}

.modal-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
}

.reason-section.recommended { border-left: 4px solid var(--status-green); }
.reason-section.caution { border-left: 4px solid var(--status-yellow); }
.reason-section.not-recommended { border-left: 4px solid var(--status-red); }

.risks-list { color: var(--status-red); }

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(123, 47, 214, 0.1);
  display: flex;
  justify-content: flex-end;
}
"""
    css += modal_css

    # Color Replacements
    replacements = {
        r'(#0a0f1c|#111827|#1e293b|rgba\(17, 24, 39, \d\.\d\)|rgba\(30, 41, 59, \d\.\d\))': 'var(--bg-elevated)',
        r'(#e2e8f0|#fff|white|rgba\(255, 255, 255, \d\.\d\))': 'var(--text-primary)',
        r'#94a3b8': 'var(--text-muted)',
        r'(#38bdf8|#0ea5e9|rgba\(56, 189, 248, \d\.\d\))': 'var(--accent-violet)',
        r'(#4caf50|#2e7d32|#84fab0|#8fd3f4|#d4edda|#155724|#e8f5e9)': 'var(--status-green)',
        r'(#ff9800|#e65100|#ffeaa7|#fdcb6e|#fff3cd|#856404|#fff3e0)': 'var(--status-yellow)',
        r'(#f44336|#c62828|#ff7675|#d63031|#f8d7da|#721c24|#ffebee)': 'var(--status-red)'
    }

    for pattern, repl in replacements.items():
        css = re.sub(pattern, repl, css, flags=re.IGNORECASE)

    with open(path, "w", encoding="utf-8") as f:
        f.write(css)

    print("Success")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
