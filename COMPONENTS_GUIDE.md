# Documentación de Componentes Reutilizables

## ⚙️ Importaciones y Configuración

**Importante:** Todos los componentes usan **GSAP** para animaciones, no Angular Animations.

### Importar GSAP
```typescript
import gsap from 'gsap';

// Las animaciones se manejan en ngOnInit(), ngAfterViewInit(), etc.
gsap.from(element, {
  duration: 0.3,
  opacity: 0,
  x: 100,
  ease: 'power2.out'
});
```

---

### 1. **ToastContainerComponent**
El contenedor global de notificaciones toast.

**Ubicación:** `src/app/components/toast-container/`

**Uso:**
```html
<!-- Agregar en app.html (ya incluido) -->
<app-toast-container></app-toast-container>
```

**Desde TypeScript:**
```typescript
import { FeedbackService } from '@app/services/feedback.service';

constructor(private feedbackService: FeedbackService) {}

// Mostrar notificaciones
this.feedbackService.success('¡Guardado!');
this.feedbackService.error('Ocurrió un error');
this.feedbackService.warning('Confirma esta acción');
this.feedbackService.info('Información importante');
```

---

### 2. **GlobalLoaderComponent**
Componente de carga global que cubre toda la pantalla.

**Ubicación:** `src/app/components/global-loader/`

**Uso:**
```typescript
import { LoadingService } from '@app/services/loading.service';

constructor(private loadingService: LoadingService) {}

// Mostrar loader
this.loadingService.show('Cargando datos...');

// Ocultar loader
this.loadingService.hide();

// Verificar si está cargando
if (this.loadingService.isLoadingNow()) {
  console.log('Está cargando');
}
```

---

### 3. **MetricCardComponent**
Tarjeta reutilizable para mostrar métricas.

**Ubicación:** `src/app/components/metric-card/`

**Uso:**
```html
<app-metric-card
  title="Precisión"
  value="95.2%"
  icon="🎯"
  theme="success"
  label="Última sesión"
  footer="Mejora del 5% respecto a ayer">
</app-metric-card>
```

**Props:**
- `title`: string - Título de la métrica
- `value`: string | number - Valor a mostrar
- `icon`: string - Emoji o icono
- `label`: string (opcional) - Etiqueta debajo del valor
- `theme`: 'success' | 'error' | 'warning' | 'info' | 'default'
- `footer`: string (opcional) - Texto adicional abajo

---

### 4. **ButtonComponent**
Botón reutilizable con múltiples variantes.

**Ubicación:** `src/app/components/button/`

**Uso:**
```html
<!-- Primary Button -->
<app-button 
  variant="primary"
  icon="🚀"
  (clicked)="handleClick()">
  Guardar Cambios
</app-button>

<!-- Danger Button -->
<app-button 
  variant="danger"
  icon="🗑"
  (clicked)="handleDelete()">
  Eliminar
</app-button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'text'
- `icon`: string (opcional)
- `disabled`: boolean
- `type`: 'button' | 'submit' | 'reset'
- `ariaLabel`: string (accesibilidad)

---

### 5. **ModalComponent**
Modal reutilizable flexible.

**Ubicación:** `src/app/components/modal/`

**Uso:**
```typescript
// En el componente TypeScript
export class MyComponent {
  showModal = false;

  openModal() {
    this.showModal = true;
  }

  handleClose() {
    this.showModal = false;
  }

  handleConfirm() {
    this.showModal = false;
    // Hacer algo
  }
}
```

```html
<app-modal
  [isOpen]="showModal"
  title="Mi Modal"
  size="medium"
  showFooter="true"
  confirmText="Guardar"
  cancelText="Cancelar"
  (closed)="handleClose()"
  (confirmed)="handleConfirm()">
  
  <p>Contenido del modal aquí</p>

</app-modal>
```

**Props:**
- `isOpen`: boolean
- `title`: string
- `size`: 'small' | 'medium' | 'large'
- `showFooter`: boolean
- `confirmText`: string
- `cancelText`: string

---

### 6. **ConfirmationDialogComponent**
Diálogo de confirmación para acciones importantes.

**Ubicación:** `src/app/components/confirmation-dialog/`

**Uso:**
```typescript
export class MyComponent {
  showDeleteConfirm = false;

  confirmDelete() {
    this.showDeleteConfirm = true;
  }

  onDeleteConfirmed() {
    // Realizar eliminación
    this.feedbackService.success('Eliminado correctamente');
    this.showDeleteConfirm = false;
  }
}
```

```html
<app-confirmation-dialog
  [isOpen]="showDeleteConfirm"
  title="Eliminar Ejercicio"
  message="¿Estás seguro que deseas eliminar esto?"
  detail="Esta acción no se puede deshacer"
  confirmText="Sí, eliminar"
  cancelText="Cancelar"
  severity="danger"
  (confirmed)="onDeleteConfirmed()"
  (cancelled)="showDeleteConfirm = false">
</app-confirmation-dialog>
```

**Props:**
- `isOpen`: boolean
- `title`: string
- `message`: string
- `detail`: string (opcional)
- `severity`: 'info' | 'warning' | 'danger' | 'success'
- `confirmText`: string
- `cancelText`: string

---

### 7. **SkeletonLoaderComponent**
Componente skeleton para estados de carga.

**Ubicación:** `src/app/components/skeleton-loader/`

**Uso:**
```html
<!-- Para líneas de texto -->
<app-skeleton-loader 
  variant="text"
  [count]="3">
</app-skeleton-loader>

<!-- Para tarjetas -->
<app-skeleton-loader 
  variant="card"
  [count]="1">
</app-skeleton-loader>

<!-- Para filas de tabla -->
<app-skeleton-loader 
  variant="table-row"
  [count]="5">
</app-skeleton-loader>
```

**Props:**
- `count`: number - Cantidad de skeletons
- `variant`: 'text' | 'heading' | 'card' | 'avatar' | 'button' | 'table-row'

---

## Servicios Disponibles

### **FeedbackService**
Servicio centralizado para notificaciones.

```typescript
import { FeedbackService } from '@app/services/feedback.service';

constructor(private feedback: FeedbackService) {}

// Métodos disponibles
this.feedback.success(message, duration?);
this.feedback.error(message, duration?);
this.feedback.warning(message, duration?);
this.feedback.info(message, duration?);
this.feedback.removeToast(id);
this.feedback.clearAll();
```

### **LoadingService**
Servicio para controlar loader global.

```typescript
import { LoadingService } from '@app/services/loading.service';

constructor(private loading: LoadingService) {}

// Métodos disponibles
this.loading.show(message?);
this.loading.hide();
this.loading.isLoadingNow(); // boolean
this.loading.getLoadingState(); // Observable<boolean>
```

---

## Constantes Globales

Se pueden importar desde `@app/constants/app.constants.ts`:

```typescript
import { 
  FEEDBACK_MESSAGES, 
  BUTTON_LABELS,
  TOAST_DURATIONS,
  VALIDATION_PATTERNS
} from '@app/constants/app.constants';

// Uso
this.feedbackService.success(FEEDBACK_MESSAGES.SUCCESS.SAVE);
```

---

## Mejores Prácticas

1. **Siempre usa componentes reutilizables** en lugar de crear nuevos
2. **Utiliza FeedbackService** para todas las notificaciones
3. **Envuelve operaciones asincrónicas** con LoadingService
4. **Usa ConfirmationDialog** para acciones irreversibles
5. **Mantén tipos TypeScript fuerte** - importa interfaces cuando sea necesario

---

## Ejemplos de Uso Completo

### Guardar un Ejercicio
```typescript
saveExercise() {
  this.loading.show('Guardando ejercicio...');
  
  this.exerciseService.save(this.exercise).subscribe({
    next: (result) => {
      this.loading.hide();
      this.feedback.success(FEEDBACK_MESSAGES.SUCCESS.SAVE);
      this.router.navigate(['/home']);
    },
    error: (error) => {
      this.loading.hide();
      this.feedback.error(error.message);
    }
  });
}
```

### Eliminar con Confirmación
```typescript
deleteExercise() {
  this.showDeleteConfirm = true;
}

onDeleteConfirmed() {
  this.loading.show('Eliminando...');
  
  this.exerciseService.delete(this.exerciseId).subscribe({
    next: () => {
      this.loading.hide();
      this.feedback.success('Ejercicio eliminado correctamente');
      this.showDeleteConfirm = false;
      this.router.navigate(['/home']);
    },
    error: () => {
      this.loading.hide();
      this.feedback.error('No se pudo eliminar el ejercicio');
    }
  });
}
```

---

## Importación en Componentes

Siempre asegúrate de importar los componentes en `standalone: true`:

```typescript
import { MetricCardComponent } from '@app/components/metric-card/metric-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MetricCardComponent],
  templateUrl: './dashboard.html'
})
export class DashboardComponent { }
```
