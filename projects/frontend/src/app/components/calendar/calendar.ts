import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-calendar',
  styleUrl: './calendar.css',
  templateUrl: './calendar.html',
})
export class Calendar {

  weeks = Array.from({ length: 6 }, (_week: any, weekId: number) =>
  ({
    id: weekId * 10,
    calweek: weekId + 1,
    days: Array.from({ length: 7 }, (_el: any, id: number) => ({ id: weekId * 10 + id + 1 }))
  })
  )
}
