import { current } from "immer";
import React, { useState, useEffect, useContext } from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { Context } from "../js/Context";

export default function Widget({ data, expanded }) {
  const { time, settings } = useContext(Context).bus;
  const [res, setRes] = useState({
    loaded: false,
    header: "header",
    value: "value",
  });

  useEffect(() => {
    if (!res.loaded) resolve_DataType(data, setRes, time.db, settings, time);
  }, [res.loaded]);

  if (expanded && res.loaded) return WidgetLoaded_expanded(res);
  else if (expanded && !res.loaded) return WidgetLoading_expanded();
  else if (!expanded && res.loaded) return WidgetLoaded(res, setRes);
  else return WidgetLoading();
}

function WidgetLoading() {
  return (
    <View style={styles.widget}>
      <Text style={styles.widgetHeader}> Loading ... </Text>
    </View>
  );
}

function WidgetLoaded({ header, value }, setRes) {
  return (
    <Pressable
      style={styles.widget}
      onPress={() => {
        setRes({ loaded: false });
      }}
    >
      <Text style={styles.widgetHeader}>{header}</Text>
      <Text style={styles.widgetBody}>{value}</Text>
    </Pressable>
  );
}

function WidgetLoading_expanded() {
  return (
    <View>
      <Text>Loading ... </Text>
    </View>
  );
}
function WidgetLoaded_expanded({ header, value }) {
  return (
    <View style={styles_expanded.container}>
      <Text style={[styles_expanded.title, styles_expanded.text]}>
        {header}
        {": "}
      </Text>
      <Text style={[styles_expanded.value, styles_expanded.text]}>
        {value}{" "}
      </Text>
    </View>
  );
}
async function resolve_DataType(
  { datatype, options },
  setRes,
  db,
  settings,
  time
) {
  const helper = {
    getTimeOfDay_millis: (flag) => {
      // flag = new Date()
      const currentHours = flag.getHours();
      const currentMinutes = flag.getMinutes();
      const currentSeconds = flag.getSeconds();

      const currentSeconds_ToMillis = currentSeconds * 1000;
      const currentMinutes_ToMillis = currentMinutes * 60 * 1000;
      const currentHours_ToMillis = currentHours * 60 * 60 * 1000;

      return (
        currentSeconds_ToMillis +
        currentMinutes_ToMillis +
        currentHours_ToMillis
      );
    },
    findBeginningOfPeriod_millis: ({ beginningOfPeriod_dayIndex, flag }) => {
      // test beginningOfPeriod_dayIndex = 1
      // test flag = {"day": 6, "hour": 13, "minute": 3, "month": 1, "second": 17, "year": 2024}
      const getHowManyDaysToRemove = () => {
        const currentDayIndex = flag.getDay();
        // currentDayIndex = 6

        //         6       >           1
        if (currentDayIndex > beginningOfPeriod_dayIndex)
          return (
            //      6       - (      6         -           1               )
            currentDayIndex - beginningOfPeriod_dayIndex
          );
        else if (currentDayIndex < beginningOfPeriod_dayIndex)
          return 7 - beginningOfPeriod_dayIndex + currentDayIndex;
        else return 0;
      };

      const timeOfDay_millis = helper.getTimeOfDay_millis(flag);
      const daysToRemove = getHowManyDaysToRemove();
      // console.log(
      //   " - Days To remove to get beginning of period: ",
      //   daysToRemove
      // );
      const oneDayToMillis = 1 * 24 * 60 * 60 * 1000;
      const millisToRemove = oneDayToMillis * daysToRemove;

      const millisToRemove2 = millisToRemove + timeOfDay_millis;

      return flag.getTime() - millisToRemove2;
    },
    findBeginningOfNextPeriod_millis: ({
      beginningOfPeriod_dayIndex,
      flag,
    }) => {
      const getHowManyDaysToAdd = () => {
        const currentDayIndex = flag.getDay();
        if (currentDayIndex < beginningOfPeriod_dayIndex)
          return beginningOfPeriod_dayIndex - currentDayIndex;
        else if (currentDayIndex > beginningOfPeriod_dayIndex)
          return 7 - currentDayIndex + beginningOfPeriod_dayIndex;
        else return 0;
      };
      const oneDayToMillis = 1 * 24 * 60 * 60 * 1000;
      const daysToAdd = getHowManyDaysToAdd();

      return flag.getTime() + oneDayToMillis * daysToAdd;
    },
    convertMillisToHoursMinutesSeconds: (millis) => {
      const millis_inHours = 1000 * 60 * 60;
      const millis_inMinutes = 1000 * 60;
      const millis_inSeconds = 1000;

      const hoursRemainder = millis % millis_inHours;
      const hours = (millis - hoursRemainder) / millis_inHours;
      const minutesRemainder = hoursRemainder % millis_inMinutes;
      const minutes = (hoursRemainder - minutesRemainder) / millis_inMinutes;
      const secondsRemainder = minutesRemainder % millis_inSeconds;
      const seconds = (minutesRemainder - secondsRemainder) / millis_inSeconds;

      return { seconds, minutes, hours };
    },
    getFirstWorkDayInWeekFromDate: ({ month, day, year }, workWeekStarts) => {
      const starterDate = new Date(
        year.toString() +
          "-" +
          new Intl.NumberFormat(undefined, {
            minimumIntegerDigits: 2,
          }).format(month) +
          "-" +
          new Intl.NumberFormat(undefined, {
            minimumIntegerDigits: 2,
          }).format(day)
      );
      return helper.findBeginningOfNextPeriod_millis({
        beginningOfPeriod_dayIndex: workWeekStarts,
        flag: starterDate,
      });
    },
    formatDate: (millis) => {
      const d = new Date(millis);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hours = d.getHours();
      const minutes = d.getMinutes();

      // return "1/25 .... 7:15";
      return month + "/" + day + " .... " + hours + ":" + minutes;
    },
    weekdaysBetween: ({ startDate, endDate }) => {
      let s, e, adjust;
      if (startDate < endDate) {
        s = startDate;
        e = endDate;
      } else {
        s = endDate;
        e = startDate;
      }

      const diffDays = Math.ceil((e - s) / 86400000);
      const weeksBetween = Math.floor(diffDays / 7);

      if (s.getDay() == e.getDay()) {
        adjust = 1;
      } else if (s.getDay() == 0 && e.getDay() == 6) {
        adjust = 5;
      } else if (s.getDay() == 6 && e.getDay() == 0) {
        adjust = 0;
      } else if (e.getDay() == 6 || e.getDay() == 0) {
        adjust = 5 - s.getDay() + 1;
      } else if (s.getDay() == 0 || s.getDay() == 6) {
        adjust = e.getDay();
      } else if (e.getDay() > s.getDay()) {
        adjust = e.getDay() - s.getDay() + 1;
      } else {
        adjust = 5 + e.getDay() - s.getDay() + 1;
      }

      // console.log("WeekdaysBetween: ", {
      //   start,
      //   end,
      //   diffDays,
      //   weeksBetween,
      //   adjust,
      //   result: weeksBetween * 5 + adjust,
      // });

      return weeksBetween * 5 + adjust;
    },
  };

  const avgHrsPerPd = async () => {};
  const avgDlrPerPd = async () => {
    // get millis of range_start
    const start_millis = new Date(options.range_start).getTime();

    // get millis of range_end, at beginning of 'now' date
    const end_millis =
      options.range_end === "now"
        ? new Date().getTime()
        : new Date(options.range_end).getTime();

    // get data array from given time period
    const dataArray = await db.getData.getAllDataBetweenTwoTimes({
      start: start_millis,
      end: end_millis,
    });

    // assign salary variables
    const salary = {
      salary: settings.salary || settings.hourly * 40 * 52,
      weeklySalary: settings.salary / 52,
      dailySalary: settings.salary / 52 / 5,
    };

    // asign start of work days
    let lowestStartValue = end_millis;
    let highestEndValue = start_millis;

    // total up hours worked
    const sumOfHoursWorked_millis = dataArray.reduce((sum, currVal) => {
      if (currVal.Start < lowestStartValue) lowestStartValue = currVal.Start;

      if (currVal.End === -1) return sum;
      else if (currVal.End > highestEndValue) highestEndValue = currVal.End;

      return sum + (currVal.End - currVal.Start);
    }, 0);

    // calculate millis in range
    const oneDayToMillis = 1 * 24 * 60 * 60 * 1000;

    const workDaysInRange = helper.weekdaysBetween({
      startDate: new Date(lowestStartValue),
      endDate: new Date(highestEndValue),
    });

    // convert millis in range to hours
    const sumOfHoursWorked_hours = sumOfHoursWorked_millis / 1000 / 60 / 60;

    // calculate dollars / hour
    const avgDollarsPerHour =
      (salary.dailySalary * workDaysInRange) / sumOfHoursWorked_hours;

    // format result to 1 decimal place
    const formatted_avgDollarsPerHour = Number(avgDollarsPerHour.toFixed(1));

    // console.log({
    //   sumOfHoursWorked_hours,
    //   workDaysInRange,
    //   weeklySalary: salary.weeklySalary,
    //   dailySalary: salary.dailySalary,
    //   formatted_avgDollarsPerHour,
    // });

    if (isNaN(formatted_avgDollarsPerHour)) {
      alert("Error calculating avgPerHour");
      return 0;
    } else return formatted_avgDollarsPerHour;
  };
  const hrsInPd = async () => {
    const now = new Date();
    const now_millis = now.getTime();
    // console.log("          ", options.period, " Period         ");
    // console.log(" ");
    const beginningOfPeriod_millis = helper.findBeginningOfPeriod_millis({
      beginningOfPeriod_dayIndex: settings.workWeekStarts,
      flag: now,
    });

    // console.log(
    //   " - Beginning of this period: ",
    //   helper.formatDate(beginningOfPeriod_millis)
    // );
    // console.log(" - Flag: ", helper.formatDate(now_millis));

    let databaseEntryArray = [];

    const millisInAWeek = 1000 * 60 * 60 * 24 * 7;
    if (options.period === "Last") {
      databaseEntryArray = await db.getData.getAllDataBetweenTwoTimes({
        start: beginningOfPeriod_millis - millisInAWeek,
        end: beginningOfPeriod_millis,
      });
    } else
      databaseEntryArray = await db.getData.getAllDataBetweenTwoTimes({
        start: beginningOfPeriod_millis,
        end: now_millis,
      });
    if (databaseEntryArray.length <= 0) return 0;

    const sum_millis = databaseEntryArray.reduce(
      (total, currVal, currI, arr) => {
        // if entry is last and still active
        if (currVal.End === -1 && currI === arr.length - 1)
          return total + (now_millis - currVal.Start);
        // ele if no end time on database entry, ignore entry
        else if (currVal.End === -1) return total;

        // find duration of period in millis
        const res = currVal.End - currVal.Start;

        // add result to total
        return total + res;
      },
      0
    );

    const { hours, minutes, seconds } =
      helper.convertMillisToHoursMinutesSeconds(sum_millis);

    const minutes_decimal = minutes + seconds / 60;
    const hours_decimal = hours + minutes_decimal / 60;

    // console.log(" - _" + options.period + ":", {
    //   period: options.period,
    //   beginningOfPeriod_millis,
    //   beginningOfPeriod_format: helper.formatDate(
    //     options.period === "Last"
    //       ? beginningOfPeriod_millis - millisInAWeek
    //       : beginningOfPeriod_millis
    //   ),
    //   endOfPeriod_format: helper.formatDate(
    //     options.period === "Last" ? beginningOfPeriod_millis : now_millis
    //   ),
    //   hours: Number(hours_decimal.toFixed(1)),
    // });
    return Number(hours_decimal.toFixed(1));
  };

  if (datatype !== "hoursInPeriod" && datatype !== "averageDollarsPerHour")
    return; //@todo return early while building

  let header, value;

  switch (datatype) {
    case "averageHoursPerPeriod":
      header = "Avg Hours (" + options.period + ")";
      value = await avgHrsPerPd();
      break;
    case "averageDollarsPerHour":
      header = "Avg $ / H";
      value = "$" + (await avgDlrPerPd());
      break;
    case "hoursInPeriod":
      header = options.period === "Last" ? "Hrs last week" : "Hrs this week";
      value = await hrsInPd();
      break;
  }

  setRes({
    loaded: true,
    header,
    value,
  });
}

const styles = StyleSheet.create({
  widget: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "space-between",
    margin: 2,
    padding: 2,
    paddingTop: 5,
    paddingBottom: 1,
    flex: 1,
    backgroundColor: "hsla(0, 0%, 0%, 0.78)",
  },
  widgetHeader: {
    color: "white",
    // backgroundColor: "pink",
    height: 30,
  },
  widgetBody: {
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
    color: "orange",
    fontSize: 25,
    padding: 10,
    // backgroundColor: "purple",
  },
});

const styles_expanded = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 10,
    paddingVertical: 5,
    // borderWidth: 1,
    // borderColor: "red",
  },
  title: {},
  value: {},
  text: {
    color: "white",
    fontSize: 18,
  },
});
