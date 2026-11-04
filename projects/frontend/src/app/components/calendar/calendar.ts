import { Component, computed, input } from '@angular/core';

type CalendarDay = {
  date: string;
  dayNumber: number;
};

type CalendarWeek = {
  weekNumber: number;
  days: Array<CalendarDay>;
};

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
  currentDate = input<string>(Temporal.Now.plainDateISO().toString());

  weeks = computed<CalendarWeek[]>(() => {
    return this.getSheet(this.currentDate());
  });

  private getSheet(isodate: Temporal.PlainDateLike = Temporal.Now.plainDateISO()) {
    const firstOfMonth = Temporal.PlainDate.from(isodate).with({ day: 1 });
    const daysBefore =
      this.firstDayOfWeek === 0
        ? firstOfMonth.dayOfWeek - 1
        : firstOfMonth.dayOfWeek % 7;
    const gridStartDate = firstOfMonth.subtract({ days: daysBefore });

    const sheet: Array<CalendarWeek> = [];

    for (let j = 0; j < 6; j++) {
      // Advance by 7 days for each week row
      const weekStartDate = gridStartDate.add({ days: j * 7 });
      
      const week: CalendarWeek = {
        weekNumber: weekStartDate.weekOfYear ?? 1,
        days: [],
      };

      for (let i = 0; i < 7; i++) {
        const currentGridDate = weekStartDate.add({ days: i });
        week.days.push({
          date: currentGridDate.toString(),
          dayNumber: currentGridDate.day,
        });
      }
      sheet.push(week);
    }
    return sheet;
  }
}