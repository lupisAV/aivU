import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Booking {
  id: string;
  date: string;
  time: string;
  therapist: string;
  status: 'confirmada' | 'pendiente' | 'cancelada';
}

interface Therapist {
  id: string;
  name: string;
  specialty: string;
  image: string;
  bio: string;
}

@Component({
  selector: 'app-canal-salud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './canal-salud.html',
  styleUrls: ['./canal-salud.css']
})
export class CanalSaludComponent {
  currentTab = signal<'solicitar' | 'mis-citas' | 'fisioterapeutas'>('solicitar');
  
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  
  selectedDate = signal<Date | null>(null);
  selectedTime = '';
  selectedTherapist = '';
  
  // Mock therapists
  therapists: Therapist[] = [
    {
      id: '1',
      name: 'Dr. Ana López',
      specialty: 'Fisioterapia Deportiva',
      image: 'assets/img/therapist1.jpg',
      bio: 'Especialista en corrección postural y lesiones deportivas con 10+ años de experiencia.'
    },
    {
      id: '2',
      name: 'Dr. Carlos Mendoza',
      specialty: 'Rehabilitación Postural',
      image: 'assets/img/therapist2.jpg',
      bio: 'Experto en alineación biomecánica y terapia manual.'
    },
    {
      id: '3',
      name: 'Dra. María Gómez',
      specialty: 'Fisioterapia Preventiva',
      image: 'assets/img/therapist3.jpg',
      bio: 'Enfoque en prevención de lesiones y optimización postural.'
    }
  ];

  // LocalStorage bookings (demo)
  bookings = signal<Booking[]>([]);
  
  constructor() {
    const saved = localStorage.getItem('aivuBookings');
    if (saved) {
      this.bookings.set(JSON.parse(saved));
    }
  }

  setTab(tab: 'solicitar' | 'mis-citas' | 'fisioterapeutas') {
    this.currentTab.set(tab);
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  selectDate(date: Date) {
    this.selectedDate.set(date);
  }

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.selectedDate.set(null);
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.selectedDate.set(null);
  }

  isBooked(day: Date): boolean {
    return this.bookings().some((b: Booking) => {
      const bookingDate = new Date(b.date);
      return bookingDate.toDateString() === day.toDateString();
    });
  }

  isPast(day: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day < today;
  }

  bookAppointment() {
    if (this.selectedDate() && this.selectedTime && this.selectedTherapist) {
      const newBooking: Booking = {
        id: this.generateId(),
        date: this.selectedDate()!.toISOString().split('T')[0],
        time: this.selectedTime,
        therapist: this.selectedTherapist,
        status: 'confirmada' as const
      };
      
      const updated = [...this.bookings(), newBooking];
      this.bookings.set(updated);
      localStorage.setItem('aivuBookings', JSON.stringify(updated));
      
      this.selectedDate.set(null);
      this.selectedTime = '';
      this.selectedTherapist = '';
      
      alert('¡Cita reservada exitosamente!');
      this.setTab('mis-citas');
    } else {
      alert('Selecciona fecha, hora y terapeuta.');
    }
  }

  cancelBooking(id: string) {
    const updated = this.bookings().filter((b: Booking) => b.id !== id);
    this.bookings.set(updated);
    localStorage.setItem('aivuBookings', JSON.stringify(updated));
  }

  getCurrentMonthDays(): (Date | null)[] {
    const year = this.currentYear;
    const month = this.currentMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const calendarDays: (Date | null)[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(new Date(year, month, day));
    }
    
    return calendarDays;
  }

  getMonthYear(): string {
    return new Date(this.currentYear, this.currentMonth).toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
}

