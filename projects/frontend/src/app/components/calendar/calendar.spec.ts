import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Calendar } from './calendar';

type Week = ReturnType<Calendar['weeks']>[number];

/** Hilfsfunktion: UTC-Wochentag (0 = So ... 6 = Sa) aus "YYYY-MM-DD" */
const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

const allDays = (weeks: Week[]) => weeks.flatMap((w) => w.days);

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;

  /**
   * Erzeugt eine frische Komponente. firstDayOfWeek wird gesetzt, BEVOR weeks()
   * zum ersten Mal gelesen wird (computed cached sonst das Ergebnis).
   */
  function setup(currentDate?: string, firstDayOfWeek?: 0 | 6): Calendar {
    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    if (firstDayOfWeek !== undefined) {
      component.firstDayOfWeek = firstDayOfWeek;
    }
    if (currentDate !== undefined) {
      fixture.componentRef.setInput('currentDate', currentDate);
    }
    return component;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calendar],
    }).compileComponents();
  });

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  describe('Grid-Struktur', () => {
    it('liefert immer 6 Wochen mit je 7 Tagen', () => {
      const weeks = setup('2026-11-04').weeks();

      expect(weeks.length).toBe(6);
      for (const week of weeks) {
        expect(week.days.length).toBe(7);
      }
    });

    it('enthält 42 aufeinanderfolgende Tage ohne Lücken oder Duplikate', () => {
      const days = allDays(setup('2026-11-04').weeks());

      expect(days.length).toBe(42);
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(`${days[i - 1].date}T00:00:00Z`).getTime();
        const curr = new Date(`${days[i].date}T00:00:00Z`).getTime();
        expect(curr - prev).toBe(86_400_000);
      }
    });

    it('verwendet ISO-Datumsstrings (YYYY-MM-DD)', () => {
      const days = allDays(setup('2026-11-04').weeks());

      for (const day of days) {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('dayNumber passt zum Tag im date-String', () => {
      const days = allDays(setup('2026-11-04').weeks());

      for (const day of days) {
        expect(day.dayNumber).toBe(Number(day.date.slice(8, 10)));
      }
    });
  });

  describe('Wochenstart Montag (firstDayOfWeek = 0, Default)', () => {
    it('beginnt jede Zeile mit einem Montag', () => {
      const weeks = setup('2026-11-04', 0).weeks();

      for (const week of weeks) {
        expect(weekdayOf(week.days[0].date)).toBe(1);
      }
    });

    it('November 2026 startet am Montag, 26.10.', () => {
      // 01.11.2026 ist ein Sonntag -> 6 Tage Vormonat in der ersten Zeile
      const weeks = setup('2026-11-04', 0).weeks();

      expect(weeks[0].days[0].date).toBe('2026-10-26');
      expect(weeks[0].days[6].date).toBe('2026-11-01');
      expect(weeks[5].days[6].date).toBe('2026-12-06');
    });
  });

  describe('Wochenstart Sonntag (firstDayOfWeek = 6)', () => {
    it('beginnt jede Zeile mit einem Sonntag', () => {
      const weeks = setup('2026-11-04', 6).weeks();

      for (const week of weeks) {
        expect(weekdayOf(week.days[0].date)).toBe(0);
      }
    });

    it('beginnt direkt am 1., wenn der Monat auf einen Sonntag fällt', () => {
      const weeks = setup('2026-11-04', 6).weeks();

      expect(weeks[0].days[0].date).toBe('2026-11-01');
      expect(weeks[0].days.every((d) => !d.isOutsideMonth)).toBe(true);
    });
  });

  describe('isOutsideMonth', () => {
    it('markiert nur Tage des angezeigten Monats als "inside"', () => {
      const days = allDays(setup('2026-11-04').weeks());
      const inside = days.filter((d) => !d.isOutsideMonth);

      expect(inside.length).toBe(30);
      expect(inside.every((d) => d.date.startsWith('2026-11-'))).toBe(true);
    });

    it('markiert Tage des Vor- und Folgemonats als "outside"', () => {
      const weeks = setup('2026-11-04', 0).weeks();

      expect(weeks[0].days[0].isOutsideMonth).toBe(true); // 26.10.
      expect(weeks[5].days[6].isOutsideMonth).toBe(true); // 06.12.
    });

    it.each([
      ['2026-02-15', 28], // Normaljahr
      ['2024-02-15', 29], // Schaltjahr
      ['2026-04-10', 30],
      ['2026-12-31', 31],
    ])('zählt für %s genau %i Tage im Monat', (iso, expected) => {
      const days = allDays(setup(iso).weeks());

      expect(days.filter((d) => !d.isOutsideMonth).length).toBe(expected);
    });

    it('enthält den 29.02. in einem Schaltjahr', () => {
      const dates = allDays(setup('2024-02-01').weeks()).map((d) => d.date);

      expect(dates).toContain('2024-02-29');
    });
  });

  describe('currentDate', () => {
    it('liefert für jeden Tag desselben Monats dasselbe Grid', () => {
      const first = setup('2026-11-01').weeks();
      const last = setup('2026-11-30').weeks();

      expect(last).toEqual(first);
    });

    it('aktualisiert weeks(), wenn sich das Input-Signal ändert', () => {
      setup('2026-11-04');
      expect(allDays(component.weeks()).some((d) => d.date === '2026-11-15')).toBe(true);

      fixture.componentRef.setInput('currentDate', '2027-03-10');
      const days = allDays(component.weeks());

      expect(days.some((d) => d.date === '2026-11-15')).toBe(false);
      expect(days.some((d) => d.date === '2027-03-10')).toBe(true);
    });

    it('zeigt ohne Input den aktuellen Monat an', () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const days = allDays(setup().weeks());
      const todayEntry = days.find((d) => d.date === today);

      expect(todayEntry).toBeDefined();
      expect(todayEntry!.isOutsideMonth).toBe(false);
    });
  });

  describe('Kalenderwochen (ISO 8601)', () => {
    it('November 2026: KW 44 bis 49', () => {
      const weeks = setup('2026-11-04', 0).weeks();

      expect(weeks.map((w) => w.weekNumber)).toEqual([44, 45, 46, 47, 48, 49]);
    });

    it('Januar 2026: erste Zeile startet am 29.12.2025 und ist KW 1', () => {
      const weeks = setup('2026-01-15', 0).weeks();

      expect(weeks[0].days[0].date).toBe('2025-12-29');
      expect(weeks[0].weekNumber).toBe(1);
    });

    it('Dezember 2026: KW 53 und Sprung auf KW 1 im Folgejahr', () => {
      // 2026 hat 53 ISO-Wochen, die Zeile ab 04.01.2027 ist wieder KW 1
      const weeks = setup('2026-12-10', 0).weeks();

      expect(weeks.map((w) => w.weekNumber)).toEqual([49, 50, 51, 52, 53, 1]);
    });

    it('Sonntag als Wochenstart: KW kommt vom Sonntag (= Vorwoche)', () => {
      // Aktuelles Verhalten: KW wird vom ersten Tag der Zeile berechnet
      const weeks = setup('2026-11-04', 6).weeks();

      expect(weeks[0].days[0].date).toBe('2026-11-01'); // Sonntag
      expect(weeks[0].weekNumber).toBe(44);
    });
  });
});