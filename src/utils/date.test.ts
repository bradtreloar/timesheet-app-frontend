import { randomInt } from "fixtures/random";
import { range } from "lodash";
import { DateTime } from "luxon";
import { InvalidTimeException, Time } from "./date";

describe("Time", () => {
  describe("static parseValue", () => {
    test("parses positive integer from string", () => {
      range(59).forEach((number) => {
        expect(Time.parseValue(number.toString().padStart(2))).toBe(number);
      });
    });

    test("parses empty string as null", () => {
      expect(Time.parseValue("")).toBeNull();
    });

    test("returns number type input unchanged", () => {
      range(59).forEach((number) => {
        expect(Time.parseValue(number)).toBe(number);
      });
    });
  });

  describe("static validateValue", () => {
    test("validates non-negative number", () => {
      range(59).forEach((number) => {
        expect(Time.validateValue(number)).toEqual(true);
      });
    });

    test("invalidates negative number", () => {
      expect(Time.validateValue(-1)).toEqual(false);
    });

    test("validates null", () => {
      expect(Time.validateValue(null)).toEqual(true);
    });
  });

  describe("static fromDate", () => {
    test("constructs Time from Date object", () => {
      const date = new Date();
      const time = Time.fromDate(date);
      expect(time.hour).toBe(date.getHours());
      expect(time.minute).toBe(date.getMinutes());
    });
  });

  describe("static fromString", () => {
    test("constructs Time from string", () => {
      range(23).forEach((hour) => {
        range(59).forEach((minute) => {
          const time = Time.fromString(
            `${hour.toString().padStart(2)}:${minute.toString().padStart(2)}`
          );
          expect(time.hour).toBe(hour);
          expect(time.minute).toBe(minute);
        });
      });
    });
  });

  describe("static fromObject", () => {
    test("constructs Time from object", () => {
      range(23).forEach((hour) => {
        range(59).forEach((minute) => {
          const time = Time.fromObject({
            hour: hour.toString().padStart(2),
            minute: minute.toString().padStart(2),
          });
          expect(time.hour).toBe(hour);
          expect(time.minute).toBe(minute);
        });
      });
    });
  });

  describe("static fromMinutes", () => {
    test("constructs Time from numeric minutes value", () => {
      range(23).forEach((hours) => {
        range(59).forEach((minutes) => {
          const totalMinutes = hours * 60 + minutes;
          const time = Time.fromMinutes(totalMinutes);
          expect(time.hour).toBe(hours);
          expect(time.minute).toBe(minutes);
        });
      });
    });
  });

  describe("constructor", () => {
    test("accept valid time", () => {
      range(23).forEach((hour) => {
        range(59).forEach((minute) => {
          new Time(hour, minute);
        });
      });
    });

    test("rejects out-of-bounds hour value", () => {
      expect(() => {
        new Time(24, 0);
      }).toThrow(InvalidTimeException);

      expect(() => {
        new Time(-1, 0);
      }).toThrow(InvalidTimeException);
    });

    test("rejects out-of-bounds minute value", () => {
      expect(() => {
        new Time(0, 60);
      }).toThrow(InvalidTimeException);

      expect(() => {
        new Time(0, -1);
      }).toThrow(InvalidTimeException);
    });
  });

  describe("isNull", () => {
    test("is true when both hours and minutes are null", () => {
      const time = new Time(null, null);
      expect(time.isNull()).toBe(true);
    });

    test("is false when hour is null but minutes has value", () => {
      const time = new Time(null, 0);
      expect(time.isNull()).toBe(false);
    });

    test("is false when minutes is null but hour has value", () => {
      const time = new Time(0, null);
      expect(time.isNull()).toBe(false);
    });
  });

  describe("toString", () => {
    test("converts time to HH:MM format string", () => {
      range(23).forEach((hour) => {
        range(59).forEach((minute) => {
          const time = new Time(hour, minute);
          const hourString = hour.toString().padStart(2, "0");
          const minuteString = minute.toString().padStart(2, "0");
          expect(time.toString()).toBe(`${hourString}:${minuteString}`);
        });
      });
    });
  });

  describe("toArray", () => {
    test("converts time to a 2-array", () => {
      range(23).forEach((hour) => {
        range(59).forEach((minute) => {
          const time = new Time(hour, minute);
          expect(time.toArray()).toStrictEqual([hour, minute]);
        });
      });
    });
  });

  describe("toDateTime", () => {
    test("converts time to a Luxon DateTime", () => {
      const date = new Date();

      range(23).forEach((hour) => {
        range(59).forEach((minute) => {
          const time = new Time(hour, minute);
          expect(time.toDateTime(date)).toStrictEqual(
            DateTime.fromObject({
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              day: date.getDate(),
              hour,
              minute,
              second: 0,
              millisecond: 0,
            })
          );
        });
      });
    });
  });

  describe("toMinutes", () => {
    test("converts time to a number in minutes", () => {
      range(23).forEach((hour) => {
        range(59).forEach((minute) => {
          const time = new Time(hour, minute);
          const minutes = hour * 60 + minute;
          expect(time.toMinutes()).toBe(minutes);
        });
      });
    });
  });

  describe("toHours", () => {
    test("converts time to a number in hours rounded to 2 dec. places", () => {
      range(23).forEach((hour) => {
        range(59).forEach((minute) => {
          const time = new Time(hour, minute);
          const hours = hour + minute / 60;
          expect(time.toHours()).toBe(parseFloat(hours.toFixed(2)));
        });
      });
    });
  });

  describe("add", () => {
    test("adds two times together", () => {
      range(10).forEach(() => {
        const hour1 = randomInt(0, 11);
        const hour2 = randomInt(0, 11);
        const minute1 = randomInt(0, 59);
        const minute2 = randomInt(0, 59);
        const time1 = new Time(hour1, minute1);
        const time2 = new Time(hour2, minute2);
        const time3 = time1.add(time2);
        expect(time3.toMinutes()).toBe(
          hour1 * 60 + hour2 * 60 + minute1 + minute2
        );
      });
    });
  });

  describe("subtract", () => {
    test("subtracts one time from another", () => {
      range(10).forEach(() => {
        const hour1 = randomInt(10, 20);
        const hour2 = randomInt(0, 9);
        const minute1 = randomInt(30, 59);
        const minute2 = randomInt(0, 29);
        const time1 = new Time(hour1, minute1);
        const time2 = new Time(hour2, minute2);
        const time3 = time1.subtract(time2);
        expect(time3.toMinutes()).toBe(
          hour1 * 60 - hour2 * 60 + minute1 - minute2
        );
      });
    });
  });
});
