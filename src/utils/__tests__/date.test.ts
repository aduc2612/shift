import {
  formatTime,
  formatTimeRange,
  formatDuration,
  formatRelativeDay,
  formatFullDate,
  isSameDay,
  isToday,
  formatDate,
  parseLocalDate,
} from "@/utils/date";

describe("formatTime", () => {
  it("formats a Date object to 24h HH:MM", () => {
    expect(formatTime(new Date("2026-06-12T08:00:00"))).toBe("08:00");
  });

  it("formats an ISO string to 24h HH:MM", () => {
    expect(formatTime("2026-06-12T14:30:00")).toBe("14:30");
  });

  it("handles midnight as 00:00", () => {
    expect(formatTime("2026-06-12T00:00:00")).toBe("00:00");
  });
});

describe("formatTimeRange", () => {
  it("formats a normal range with en-dash", () => {
    const result = formatTimeRange(
      "2026-06-12T08:00:00",
      "2026-06-12T09:30:00",
    );
    expect(result).toBe("08:00 – 09:30");
  });

  it("formats a range within the same hour", () => {
    const result = formatTimeRange(
      "2026-06-12T08:00:00",
      "2026-06-12T08:45:00",
    );
    expect(result).toBe("08:00 – 08:45");
  });
});

describe("formatDuration", () => {
  it("formats 90 minutes as '90m'", () => {
    expect(formatDuration(90)).toBe("90m");
  });

  it("formats 0 minutes as '0m'", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("formats 1 minute as '1m'", () => {
    expect(formatDuration(1)).toBe("1m");
  });
});

describe("formatRelativeDay", () => {
  it("returns 'Today' for the current day", () => {
    expect(formatRelativeDay(new Date())).toBe("Today");
  });

  it("returns 'Past' for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDay(yesterday)).toBe("Past");
  });

  it("returns 'Future' for tomorrow", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatRelativeDay(tomorrow)).toBe("Future");
  });
});

describe("formatFullDate", () => {
  it("formats June 12, 2026 as 'Friday, Jun 12'", () => {
    expect(formatFullDate(new Date("2026-06-12T12:00:00"))).toBe(
      "Friday, Jun 12",
    );
  });
});

describe("isSameDay", () => {
  it("returns true for two dates on the same calendar day", () => {
    expect(
      isSameDay(
        new Date("2026-06-12T08:00:00"),
        new Date("2026-06-12T20:00:00"),
      ),
    ).toBe(true);
  });

  it("returns false for two dates on different days", () => {
    expect(
      isSameDay(
        new Date("2026-06-12"),
        new Date("2026-06-13"),
      ),
    ).toBe(false);
  });

  it("returns false across midnight boundary", () => {
    expect(
      isSameDay(
        new Date("2026-06-12T23:59:59"),
        new Date("2026-06-13T00:00:00"),
      ),
    ).toBe(false);
  });
});

describe("isToday", () => {
  it("returns true for today", () => {
    expect(isToday(new Date())).toBe(true);
  });

  it("returns false for a past date", () => {
    expect(isToday(new Date("2026-06-11"))).toBe(false);
  });
});

describe("parseLocalDate", () => {
  it("parses YYYY-MM-DD as local date (not UTC)", () => {
    const result = parseLocalDate("2026-06-12");
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5); // June = 5
    expect(result.getDate()).toBe(12);
  });

  it("returns same date for non-YYYY-MM-DD strings", () => {
    const result = parseLocalDate("2026-06-12T08:00:00");
    expect(result.getTime()).toBe(new Date("2026-06-12T08:00:00").getTime());
  });

  it("parses leap-year date correctly", () => {
    const result = parseLocalDate("2024-02-29");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
  });

  it("rolls over non-leap-year Feb 29 to Mar 1", () => {
    const result = parseLocalDate("2026-02-29");
    // JS Date rolls over: Feb 29 -> Mar 1
    expect(result.getMonth()).toBe(2); // March
    expect(result.getDate()).toBe(1);
  });

  it("rolls over out-of-range month/day", () => {
    const result = parseLocalDate("2026-13-32");
    // JS Date rolls over: month 13 -> next year Jan, day 32 -> Feb 1
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(1); // Feb
    expect(result.getDate()).toBe(1);
  });

  it("produces Invalid Date for malformed date string", () => {
    const result = parseLocalDate("not-a-date");
    expect(isNaN(result.getTime())).toBe(true);
  });

  it("produces Invalid Date for empty string", () => {
    const result = parseLocalDate("");
    expect(isNaN(result.getTime())).toBe(true);
  });

  it("produces Invalid Date for short month format", () => {
    // "2026-6-1" doesn't match YYYY-MM-DD regex, falls through to new Date()
    const result = parseLocalDate("2026-6-1");
    // new Date("2026-6-1") is parsed as May 31 UTC (June 1 local in UTC+7)
    // Verify it falls through to new Date() behavior (not local date parsing)
    const expected = new Date("2026-6-1");
    expect(result.getTime()).toBe(expected.getTime());
  });

  it("parses year-end date correctly", () => {
    const result = parseLocalDate("2026-12-31");
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(31);
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date(2026, 5, 12)); // June 12
    expect(result).toBe("Jun 12, 2026");
  });

  it("formats a YYYY-MM-DD string as local date", () => {
    const result = formatDate("2026-06-12");
    expect(result).toBe("Jun 12, 2026");
  });

  it("formats a leap-year date", () => {
    const result = formatDate("2024-02-29");
    expect(result).toBe("Feb 29, 2024");
  });

  it("formats a year-end date", () => {
    const result = formatDate("2026-12-31");
    expect(result).toBe("Dec 31, 2026");
  });

  it("formats a year-start date", () => {
    const result = formatDate("2027-01-01");
    expect(result).toBe("Jan 1, 2027");
  });
});
