import { Component, computed, input } from '@angular/core';

type CalendarDay = {
  date: string;
  dayNumber: number;
  isOutsideMonth: boolean;
};

type CalendarWeek = {
  weekNumber: number;
  days: Array<CalendarDay>;
};

/** "YYYY-MM-DD" -> Date (UTC-Mitternacht) */
function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Date (UTC-basiert) -> "YYYY-MM-DD" */
function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Heutiges Datum in lokaler Zeitzone als "YYYY-MM-DD" */
function todayIso(): string {
  const now = new Date();
  return formatIsoDate(
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days)
  );
}

/** ISO-8601-Kalenderwoche (entspricht Temporal's weekOfYear im ISO-Kalender) */
function getIsoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayNum = d.getUTCDay() || 7; // Sonntag = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Donnerstag der Woche
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

@Component({
  standalone: true,
  imports: [],
  selector: 'app-calendar',
  styleUrl: './calendar.css',
  templateUrl: './calendar.html',
})
export class Calendar {
  firstDayOfWeek: 0 | 6 = 0;

  // Signal input in modern Angular
  currentDate = input<string>(todayIso());

  weeks = computed<CalendarWeek[]>(() => {
    return this.getSheet(this.currentDate());
  });

  private getSheet(isodate: string = todayIso()): CalendarWeek[] {
    const reference = parseIsoDate(isodate);
    const firstOfMonth = new Date(
      Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1)
    );

    // getUTCDay(): 0 = Sonntag ... 6 = Samstag
    const weekday = firstOfMonth.getUTCDay();
    const daysBefore =
      this.firstDayOfWeek === 0
        ? (weekday + 6) % 7 // Woche beginnt am Montag
        : weekday;          // Woche beginnt am Sonntag
    const gridStartDate = addDays(firstOfMonth, -daysBefore);

    const sheet: Array<CalendarWeek> = [];

    for (let j = 0; j < 6; j++) {
      // Advance by 7 days for each week row
      const weekStartDate = addDays(gridStartDate, j * 7);

      const week: CalendarWeek = {
        weekNumber: getIsoWeek(weekStartDate),
        days: [],
      };

      for (let i = 0; i < 7; i++) {
        const currentGridDate = addDays(weekStartDate, i);
        week.days.push({
          date: formatIsoDate(currentGridDate),
          dayNumber: currentGridDate.getUTCDate(),
          isOutsideMonth:
            firstOfMonth.getUTCMonth() !== currentGridDate.getUTCMonth(),
        });
      }
      sheet.push(week);
    }
    return sheet;
  }
}