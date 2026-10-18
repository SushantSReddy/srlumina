import { describe, expect, test } from "bun:test";
import { studyDay, shiftDay, validTimeZone } from "./study-day";

describe("Student local dates", () => {
  test("India midnight credits the student's new local day, not UTC yesterday", () => {
    expect(studyDay("Asia/Kolkata", new Date("2026-10-18T19:00:00Z"))).toBe("2026-10-19");
  });
  test("America credits the student's current local date, not UTC tomorrow", () => {
    expect(studyDay("America/Los_Angeles", new Date("2026-10-19T01:00:00Z"))).toBe("2026-10-18");
  });
  test("Calendar arithmetic handles year boundaries", () => {
    expect(shiftDay("2027-01-01", -1)).toBe("2026-12-31");
  });
  test("Only real timezones are accepted", () => {
    expect(validTimeZone("Asia/Kolkata")).toBe(true);
    expect(validTimeZone("not/a/timezone")).toBe(false);
  });
});