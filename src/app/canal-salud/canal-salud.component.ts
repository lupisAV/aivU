import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';

interface Physiotherapist {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  emoji: string;
  description: string;
  availableHours: string[];
}

interface Appointment {
  id: string;
  therapistId: string;
  therapistName: string;
  therapistEmoji: string;
  date: string;
  time: string;
  reason: string;
  createdAt: string;
}

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasAppointment: boolean;
}

@Component({
  selector: 'app-canal-salud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './canal-salud.component.html',
  styleUrls: ['./canal-salud.component.css']
})
export class CanalSaludComponent implements OnInit, AfterViewInit {
  physiotherapists: Physiotherapist[] = [
    {
      id: '1',
      name: 'Dr. Carlos Martínez',
      specialty: 'Rehabilitación Deportiva',
      experience: '8 años',
      emoji: '🩺',
      description: 'Especialista en recuperación de lesiones musculares y articulares. Enfoque personalizado en la rehabilitación post-ejercicio.',
      availableHours: ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00']
    },
    {
      id: '2',
      name: 'Dra. Laura López',
      specialty: 'Fisioterapia Deportiva',
      experience: '12 años',
      emoji: '🏃',
      description: 'Enfocada en optimización del rendimiento físico y prevención de lesiones deportivas. Amplia experiencia con atletas.',
      availableHours: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00']
    },
    {
      id: '3',
      name: 'Dr. Miguel Ramírez',
      specialty: 'Postura y Columna',
      experience: '15 años',
      emoji: '💆',
      description: 'Experto en corrección postural, escoliosis y dolor de espalda crónico. Terapias manuales y ejercicios correctivos.',
      availableHours: ['10:00', '11:00', '12:00', '16:00', '17:00', '18:00']
    }
  ];

  appointments: Appointment[] = [];
  selectedTherapist: Physiotherapist | null = null;
  showModal = false;
  showDeleteConfirm = false;
  appointmentToDelete: string | null = null;

  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  appointmentForm = {
    therapistId: '',
    date: '',
    time: '',
    reason: ''
  };

  availableTimes: string[] = [];

  ngOnInit(): void {
    this.loadAppointments();
    this.buildCalendar();
  }

  ngAfterViewInit(): void {
    this.animateEntrance();
  }

  private animateEntrance(): void {
    setTimeout(() => {
      gsap.fromTo('.cs-header', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });

      gsap.fromTo('.cs-therapist-card', {
        y: 30, opacity: 0
      }, {
        y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.2
      });

      gsap.fromTo('.cs-calendar-panel', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.3 });

      gsap.fromTo('.cs-appointments-list', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.4 });

      gsap.fromTo('.cs-cta-button', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.5 });
    }, 10);
  }

  selectTherapist(therapist: Physiotherapist): void {
    if (this.selectedTherapist?.id === therapist.id) {
      this.selectedTherapist = null;
      return;
    }
    this.selectedTherapist = therapist;
    gsap.fromTo('.cs-therapist-card.selected', { scale: 0.95 }, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
  }

  openAppointmentModal(therapist?: Physiotherapist): void {
    if (therapist) {
      this.selectedTherapist = therapist;
    }

    this.appointmentForm = {
      therapistId: this.selectedTherapist?.id || '',
      date: this.formatDate(new Date()),
      time: '',
      reason: ''
    };

    this.availableTimes = this.selectedTherapist?.availableHours || [];
    this.showModal = true;

    setTimeout(() => {
      gsap.fromTo('.cs-modal-overlay', { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo('.cs-modal-content', { y: 40, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.3)' });
    }, 10);
  }

  closeModal(): void {
    gsap.to('.cs-modal-overlay', { opacity: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to('.cs-modal-content', {
      y: 30, opacity: 0, scale: 0.95, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        this.showModal = false;
      }
    });
  }

  onTherapistChange(): void {
    const therapist = this.physiotherapists.find(t => t.id === this.appointmentForm.therapistId);
    this.availableTimes = therapist?.availableHours || [];
    this.appointmentForm.time = '';
  }

  submitAppointment(): void {
    if (!this.appointmentForm.therapistId || !this.appointmentForm.date || !this.appointmentForm.time) {
      return;
    }

    const therapist = this.physiotherapists.find(t => t.id === this.appointmentForm.therapistId);
    if (!therapist) return;

    const appointment: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      therapistId: therapist.id,
      therapistName: therapist.name,
      therapistEmoji: therapist.emoji,
      date: this.appointmentForm.date,
      time: this.appointmentForm.time,
      reason: this.appointmentForm.reason || 'Seguimiento de rutina',
      createdAt: new Date().toISOString()
    };

    this.appointments.push(appointment);
    this.saveAppointments();
    this.buildCalendar();

    gsap.to('.cs-modal-overlay', { opacity: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to('.cs-modal-content', {
      y: 30, opacity: 0, scale: 0.95, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        this.showModal = false;
        this.selectedTherapist = null;
        this.animateNewAppointment();
      }
    });
  }

  confirmDeleteAppointment(id: string): void {
    this.appointmentToDelete = id;
    this.showDeleteConfirm = true;

    setTimeout(() => {
      gsap.fromTo('.cs-confirm-overlay', { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo('.cs-confirm-dialog', { y: 20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.3)' });
    }, 10);
  }

  closeDeleteConfirm(): void {
    gsap.to('.cs-confirm-overlay', { opacity: 0, duration: 0.15 });
    gsap.to('.cs-confirm-dialog', {
      y: 20, opacity: 0, scale: 0.9, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        this.showDeleteConfirm = false;
        this.appointmentToDelete = null;
      }
    });
  }

  deleteAppointment(): void {
    if (!this.appointmentToDelete) return;

    const idx = this.appointments.findIndex(a => a.id === this.appointmentToDelete);
    if (idx > -1) {
      this.appointments.splice(idx, 1);
      this.saveAppointments();
      this.buildCalendar();
    }

    this.closeDeleteConfirm();
  }

  hasAppointmentsOnDate(date: Date): boolean {
    const dateStr = this.formatDate(date);
    return this.appointments.some(a => a.date === dateStr);
  }

  getAppointmentsForDate(date: Date): Appointment[] {
    const dateStr = this.formatDate(date);
    return this.appointments.filter(a => a.date === dateStr);
  }

  get today(): Date {
    return new Date();
  }

  getUpcomingAppointments(): Appointment[] {
    const today = this.formatDate(new Date());
    return this.appointments
      .filter(a => a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }

  navigateMonth(direction: number): void {
    const el = document.querySelector('.cs-calendar-grid');
    if (el) {
      gsap.to(el, {
        x: direction > 0 ? -20 : 20,
        opacity: 0,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + direction, 1);
          this.buildCalendar();
          gsap.fromTo(el, { x: direction > 0 ? 20 : -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2, ease: 'power2.out' });
        }
      });
    } else {
      this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + direction, 1);
      this.buildCalendar();
    }
  }

  buildCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    this.calendarDays = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      d.setHours(0, 0, 0, 0);
      this.calendarDays.push({
        day: prevMonthLastDay - i,
        date: d,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        hasAppointment: this.hasAppointmentsOnDate(d)
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      this.calendarDays.push({
        day,
        date: d,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
        hasAppointment: this.hasAppointmentsOnDate(d)
      });
    }

    const remainingSlots = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      d.setHours(0, 0, 0, 0);
      this.calendarDays.push({
        day: i,
        date: d,
        isCurrentMonth: false,
        isToday: false,
        hasAppointment: this.hasAppointmentsOnDate(d)
      });
    }
  }

  monthYearLabel(): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
  }

  formatDateSpan(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }

  formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private loadAppointments(): void {
    try {
      const stored = localStorage.getItem('aivu_appointments');
      if (stored) {
        this.appointments = JSON.parse(stored);
      }
    } catch {
      this.appointments = [];
    }
  }

  private saveAppointments(): void {
    localStorage.setItem('aivu_appointments', JSON.stringify(this.appointments));
  }

  private animateNewAppointment(): void {
    setTimeout(() => {
      gsap.fromTo('.cs-appointment-item:last-child', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo('.cs-calendar-day.has-appointment:last-of-type .cs-dot', { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(1.5)' });
    }, 300);
  }
}
