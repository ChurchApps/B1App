import { format as dateFormat } from "date-fns"

export class DateHelper {

  //Fixes timezone issues when you just need the date.
  static toDate(input: any) {
    return new Date(Date.parse(input.toString().replace("Z", "")));
  }

  static toDateTime(input: any) {
    return new Date(Date.parse(input.toString()));
  }

  //obsolete.  Do not use
  static convertToDate(input: any) {
    return this.toDateTime(input);
  }

  static addDays(date: Date, days: number) {
    date.setDate(date.getDate() + days);
    return date;
  }

  static prettyDate(date: Date) {
    if (date === undefined || date === null) return "";
    return this.formatDateTime(date, "MMM d, yyyy");
  }

  static prettyDateTime(date: Date) {
    if (date === undefined || date === null) return "";
    return this.formatDateTime(date, "MMM d, yyyy h:mm a");
  }

  static prettyTime(date: Date) {
    if (date === undefined || date === null) return "";
    return this.formatDateTime(date, "h:mm a");
  }

  static getLastSunday() {
    let result = new Date();
    while (result.getDay() !== 0) result.setDate(result.getDate() - 1);
    return result;
  }

  static getWeekSunday(year: number, week: number) {
    let result = new Date(year, 0, 1);
    while (result.getDay() !== 0) result.setDate(result.getDate() + 1);
    result.setDate(result.getDate() + ((week - 1) * 7));
    return result;
  }

  static formatHtml5Date(date: Date): string {
    let result = "";
    if (date !== undefined && date !== null) {
      try {
        result = new Date(date).toISOString().split("T")[0];
      } catch { }
    }
    return result;
  }

  static formatHtml5Time(time: Date): string {
    let h = time.getHours();
    let m = time.getMinutes();
    let s = time.getSeconds();
    return `${h < 10 ? ("0" + h) : h}:${m < 10 ? ("0" + m) : m}:${s < 10 ? ("0" + s) : s}`;
  }

  static formatHtml5DateTime(date: Date): string {
    if (date === undefined || date === null) return "";
    else {
      return this.formatDateTime(date, "yyyy-MM-dd") + "T" + this.formatDateTime(date, "HH:mm");
    }
  }

  static getDisplayDuration(d: Date): string {
    let seconds = Math.round((new Date().getTime() - d.getTime()) / 1000);
    if (seconds > 86400) {
      let days = Math.floor(seconds / 86400);
      return (days === 1) ? "1d" : days.toString() + "d";
    }
    else if (seconds > 3600) {
      let hours = Math.floor(seconds / 3600);
      return (hours === 1) ? "1h" : hours.toString() + "h";
    }
    else if (seconds > 60) {
      let minutes = Math.floor(seconds / 60);
      return (minutes === 1) ? "1m" : minutes.toString() + "m";
    }
    else return (seconds === 1) ? "1s" : Math.floor(seconds).toString() + "s";
  }

  static getShortDate(d: Date): string {
    return (d.getMonth() + 1).toString() + "/" + (d.getDate()).toString() + "/" + d.getFullYear().toString();
  }

  static convertDatePickerFormat(d: Date): Date {
    const date = this.formatHtml5Date(d).split("-");
    if (date.length === 3) return new Date(`${date[1]}-${date[2]}-${date[0]}`);
    return new Date();
  }

  private static formatDateTime(date: Date, format: string) {
    try {
      return dateFormat(date, format);
    } catch { return ""; }
  }
}
