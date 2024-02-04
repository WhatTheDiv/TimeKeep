import {
  StyleSheet,
  View,
  ScrollView,
  Animated,
  Text,
  Pressable,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { useContext, useEffect, useState } from "react";
import { Context } from "../js/Context";
import Widget from "./Widget";
import React from "react";
import { useImmer } from "use-immer";
import { Picker } from "@react-native-picker/picker";

const statsHeight = 300;
const hoursHeight = 300;

export default function Drawer({ bus, active }) {
  if (!bus.setup) return <View />;
  const [addHoursValues, setAddHoursValues] = useImmer({
    start: {
      date: {
        month: new Date().getMonth(),
        day: new Date().getDate(),
      },
      time: {
        hour:
          new Date().getHours() > 11
            ? new Date().getHours() - 12
            : new Date().getHours(),
        minute: new Date().getMinutes(),
        ampm: new Date().getHours() > 11 ? "pm" : "am",
      },
    },
    end: {
      time: {
        hour:
          new Date().getHours() > 11
            ? new Date().getHours() - 12
            : new Date().getHours(),
        minute: new Date().getMinutes(),
        ampm: new Date().getHours() > 11 ? "pm" : "am",
      },
    },
  });
  const { animations, time } = useContext(Context).bus;
  const [pockets, setPockets] = useImmer({
    stats: {
      open: true,
      loading: true,
    },
    hours: {
      open: true,
      arr: [],
      navigation: "view",
      selected: null,
      loading: true,
      edit: -1,
    },
    loading: true,
  });
  const [widgetData, setWidgetData] = useState({
    count: 0,
    item: [
      {
        id: 2,
        datatype: "hoursInPeriod",
        options: {
          period: "Last",
        },
      },
      {
        id: 3,
        datatype: "hoursInPeriod",
        period: "This",
        options: {
          period: "This",
        },
      },
      {
        id: 1,
        datatype: "averageDollarsPerHour",
        options: {
          range_start: "2024-01-01",
          range_end: "now",
        },
      },
    ],
  });

  useEffect(() => {
    if (!pockets.hours.loading || active) return;
    getStats({ db: time.db });
    getHours({ daysToLoad: 50, db: time.db, setPockets, time });
  }, [pockets.hours.loading]);

  useEffect(() => {
    const nav = pockets.hours.navigation;
    if (nav === "view") return;

    // set Animation
  }, [pockets.hours.navigation]);

  const drawerHeight = {
    expanded: animations.drawer.drawerMaxHeight * 0.9,
    hidden: animations.drawer.drawerMaxHeight * 0.2,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animations.drawer.animate_opacity,
          height: animations.drawer.drawerMaxHeight,
          bottom: animations.drawer.drawerMaxHeight * -1.1,
          transform: [{ translateY: animations.drawer.animate_position }],
        },
      ]}
    >
      <View
        style={[
          styles.innerContainer,
          { height: drawerHeight[active ? "hidden" : "expanded"] },
        ]}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            flexDirection: "row",
          }}
        >
          {render_innerContainer(
            !active,
            widgetData,
            setPockets,
            pockets,
            addHoursValues,
            setAddHoursValues,
            time
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function render_innerContainer(
  expanded,
  widgetData,
  setPockets,
  pockets,
  addHoursValues,
  setAddHoursValues,
  time
) {
  const format_date = (millis) => {
    const d = new Date(millis);
    const month_ = time.usefulArrays.months[d.getMonth()];
    const day_ = d.getDate();
    const dayName = time.usefulArrays.days[d.getDay()];

    // date: January 15
    // day: Monday
    return { date: month_ + " " + day_, day: dayName };
  };
  const format_hours = ({ start, end }) => {
    const { hours, minutes, seconds } =
      time.manipFuncs.millis_difference_toSecondsMinutesHours({ start, end });
    const h = hours > 1 ? " Hours " : " Hour ";
    const m = minutes > 1 ? " Minutes " : " Minute ";
    const s = seconds > 1 ? " Seconds " : " Second ";

    // hours: 8 Hours 32 Minutes
    if (hours >= 1) return hours + h + " " + minutes + m;
    else if (minutes >= 1) return minutes + m + " " + seconds + s;
    else return seconds + s;
  };
  const loadingHoursItem = () => {
    return (
      <View style={styles.hoursItem}>
        <Text style={[styles.hoursItem_text, { color: "white" }]}>
          Loading ...{" "}
        </Text>
      </View>
    );
  };
  const loadingStatsSection = () => {
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Loading ... </Text>
      </View>
    );
  };
  const press_navigation = (selection) => {
    setPockets((draft) => {
      draft.hours.navigation = selection;
      if (selection === "add" || selection === "view")
        draft.hours.selected = null;
    });
  };
  const press_hourItem = (i) => {
    console.log({ sel: pockets.hours.selected, i });
    const index =
      !pockets.hours.selected && pockets.hours.selected !== 0
        ? i
        : pockets.hours.selected === i
        ? null
        : i;
    // perform action based on pockets.hours.navigation
    switch (pockets.hours.navigation) {
      case "view":
        press_view();
        break;
      case "add":
        press_add();
        break;
      case "edit":
        press_edit();
        break;
      case "delete":
        press_delete();
        break;
    }

    function press_view() {
      setPockets((draft) => {
        draft.hours.selected = null; // @todo for now
      });
    }
    function press_add() {
      setPockets((draft) => {
        draft.hours.selected = null; // @todo for now
      });
    }
    function press_edit() {
      setPockets((draft) => {
        draft.hours.selected = index;
      });
    }
    function press_delete() {
      setPockets((draft) => {
        draft.hours.selected = index;
      });
    }
  };
  const action_deleteEntry = async (index, item) => {
    console.log("deleting item: ", item);

    time.db.deleteData
      .delete_withId(item.Id)
      .then(() => {
        setPockets((draft) => {
          draft.hours.arr.splice(index, 1);
          draft.hours.selected =
            draft.hours.arr[draft.hours.selected] === undefined
              ? null
              : draft.hours.selected;
        });
      })
      .catch((e) => {
        alert("Failed to delete entry");
        console.log(" ");
        console.log("Error @ action_deleteEntry: ", e);
        console.log(" ");
      });
  };
  const action_submitManualHours = async () => {
    const findWhereInLocalArrayToPutNewItem = (start) => {
      // exit early if no times are added to array
      if (pockets.hours.arr.length < 1) return 0;

      let smallestDifference = {
        diff: -1,
        index: 0,
      };

      // find the smallest difference between start and a current hours array item entry
      pockets.hours.arr.forEach((entry, index) => {
        const diff =
          entry.Start >= start ? entry.Start - start : start - entry.Start;
        if (smallestDifference.diff === -1 || smallestDifference.diff > diff) {
          smallestDifference.diff = diff;
          smallestDifference.index = index;
        }
      });

      return smallestDifference.index + start >
        pockets.hours.arr[smallestDifference.index].Start
        ? 0
        : 1;
    };
    const addNewItem = async () => {
      const { id } = await time.db.storeData.storeNewTimeItem({
        start: startTime,
        end: endTime,
      });

      if (id === false) return alert("Failed to save time");

      const newTimeEntry = await time.db.getData.getDataWithId(id);

      const index = findWhereInLocalArrayToPutNewItem(startTime);

      return setPockets((draft) => {
        draft.hours.arr.splice(index, 0, newTimeEntry);
        draft.hours.navigation = "edit";
        draft.hours.selected = index;
      });
    };
    const updateExistingItem = async () => {
      const options = {
        noChange: true,
        edits: [],
      };

      const originalItem = await time.db.getData.getDataWithId(
        pockets.hours.edit
      );

      const newStartTime = originalItem.Start !== startTime;
      const newEndTime = originalItem.End !== endTime;

      // @ts-ignore
      if (newStartTime) options.edits.push({ key: "Start", value: startTime });

      // @ts-ignore
      if (newEndTime) options.edits.push({ key: "End", value: endTime });

      if (!newEndTime && !newStartTime) options.noChange = true;
      else options.noChange = false;

      console.log("options: ", options);
      if (options.noChange) return;

      const { sucess } = await time.db.storeData.updateTimeItem({
        id: pockets.hours.edit,
        keyValuePairs: options.edits,
      });

      if (!sucess) return alert("Failed to update time");
      else alert("Sucessfully updated time ( Id:" + pockets.hours.edit + " )");

      const editedTimeEntry = await time.db.getData.getDataWithId(
        originalItem.Id
      );

      let idx = 0;
      pockets.hours.arr.find((item, index) => {
        if (item.Id === originalItem.Id) {
          idx = index;
          return true;
        } else return false;
      });

      return setPockets((draft) => {
        draft.hours.navigation = "edit";
        draft.hours.edit = -1;
        draft.hours.arr[idx] = editedTimeEntry;
        draft.hours.selected = idx;
      });
    };

    const s = addHoursValues.start;
    const e = addHoursValues.end;

    const startTimeObj = {
      year: new Date().getFullYear(),
      month: s.date.month,
      day: s.date.day,
      hour: s.time.hour,
      minute: s.time.minute,
      ampm: s.time.ampm,
    };
    const endTimeObj = {
      year: new Date().getFullYear(),
      month: s.date.month,
      day: s.date.day,
      hour: e.time.hour,
      minute: e.time.minute,
      ampm: e.time.ampm,
    };

    const startTime = time.manipFuncs.dateObjToMillis(startTimeObj);
    const endTime = time.manipFuncs.dateObjToMillis(endTimeObj);

    if (new Date().getTime() < startTime) {
      console.warn({ startTime, endTime, currTime: new Date().getTime() });
      return alert("Adding future times is rejected.");
    }
    if (pockets.hours.edit >= 0) updateExistingItem();
    else addNewItem();
  };
  const render_hoursSection = () => {
    const render_icon = (index, item) => {
      const action = () => {
        const nav = pockets.hours.navigation;

        if (nav === "delete") {
          Alert.alert(
            "Delete Time",
            "Are you sure you want to delete this entry?",
            [
              {
                text: "Cancel",
                onPress: () => {},
              },
              {
                text: "I'm Sure",
                onPress: () => action_deleteEntry(index, item),
              },
            ],
            {
              cancelable: true,
              onDismiss: () => {},
            }
          );
        } else if (nav === "edit") {
          const d_start = new Date(item.Start);
          const d_end = new Date(item.End);

          setAddHoursValues((draft) => {
            draft.start = {
              date: {
                month: d_start.getMonth(),
                day: d_start.getDate(),
              },
              time: {
                hour:
                  d_start.getHours() > 11
                    ? d_start.getHours() - 12
                    : d_start.getHours(),
                minute: d_start.getMinutes(),
                ampm: d_start.getHours() > 11 ? "pm" : "am",
              },
            };
            draft.end = {
              date: {
                month: d_end.getMonth(),
                day: d_end.getDate(),
              },
              time: {
                hour:
                  d_end.getHours() > 11
                    ? d_end.getHours() - 12
                    : d_end.getHours(),
                minute: d_end.getMinutes(),
                ampm: d_end.getHours() > 11 ? "pm" : "am",
              },
            };
          });
          setPockets((draft) => {
            draft.hours.edit = item.Id;
          });
        }
      };

      const nav = pockets.hours.navigation;
      const selected = pockets.hours.selected;

      if ((nav !== "edit" || nav !== "delete") && selected !== index)
        return <View />;

      const wrench = {
        // @ts-ignore
        uri: require("../assets/icons/wrench.png"),
        bgColor: "chocolate",
      };

      const trash = {
        // @ts-ignore
        uri: require("../assets/icons/trash.png"),
        bgColor: "#b01c1c",
      };

      const icon = nav === "edit" ? wrench : trash;

      return (
        <Pressable
          style={[
            styles.hoursItem_actionButtonContainer,
            { backgroundColor: icon.bgColor },
          ]}
          onPress={action}
        >
          <Image
            style={styles.hoursItem_icon}
            // @ts-ignore
            source={icon.uri}
          ></Image>
        </Pressable>
      );
    };
    const render_addOrModifyItem = () => {
      const dayCount =
        time.usefulArrays.daysInMonths[addHoursValues.start.date.month];

      const daysInMonth = Array.from({ length: dayCount }, (_, i) => i + 1);
      const hoursInDay = Array.from({ length: 12 }, (_, i) => i + 1);
      const minutesInHour = Array.from({ length: 60 }, (_, i) => i);

      return (
        <View style={styles.hours_addItem_container}>
          <Text style={styles.hours_addItem_header}>
            {pockets.hours.edit >= 0 ? "Edit" : "Add"} Hours
          </Text>

          {/* Date */}
          <View style={[styles.hours_addItem_sectionContainer]}>
            <Text style={styles.hours_addItem_sectionText}>Date:</Text>
            <Picker
              style={{
                color: "orange",
                width: 140,
              }}
              mode={"dropdown"}
              numberOfLines={1}
              dropdownIconColor={"white"}
              selectedValue={addHoursValues.start.date.month}
              onValueChange={(itemValue, itemIndex) =>
                setAddHoursValues((draft) => {
                  draft.start.date.month = itemValue;
                })
              }
            >
              <Picker.Item label="January" value={0} />
              <Picker.Item label="Febuary" value={1} />
              <Picker.Item label="March" value={2} />
              <Picker.Item label="April" value={3} />
              <Picker.Item label="May" value={4} />
              <Picker.Item label="June" value={5} />
              <Picker.Item label="July" value={6} />
              <Picker.Item label="August" value={7} />
              <Picker.Item label="September" value={8} />
              <Picker.Item label="October" value={9} />
              <Picker.Item label="November" value={10} />
              <Picker.Item label="December" value={11} />
            </Picker>
            <Picker
              style={{
                color: "orange",
                width: 100,
              }}
              itemStyle={{
                color: "red",
                backgroundColor: "green",
                width: 10,
                padding: 0,
              }}
              mode={"dropdown"}
              dropdownIconColor={"white"}
              selectedValue={addHoursValues.start.date.day}
              onValueChange={(itemValue, itemIndex) =>
                setAddHoursValues((draft) => {
                  draft.start.date.day = itemValue;
                })
              }
            >
              {daysInMonth.map((item, index) => {
                return (
                  <Picker.Item
                    key={index}
                    label={item.toString()}
                    value={item}
                  />
                );
              })}
            </Picker>
          </View>

          {/* Start Time */}
          <View style={styles.hours_addItem_sectionContainer}>
            <Text style={styles.hours_addItem_sectionText}>Start Time:</Text>
            <Picker
              style={{
                color: "orange",
                width: 95,
              }}
              itemStyle={{
                padding: 0,
              }}
              mode={"dropdown"}
              dropdownIconColor={"white"}
              selectedValue={addHoursValues.start.time.hour}
              onValueChange={(itemValue, itemIndex) =>
                setAddHoursValues((draft) => {
                  draft.start.time.hour = itemValue;
                })
              }
            >
              {hoursInDay.map((item, index) => {
                return (
                  <Picker.Item
                    key={index}
                    label={item.toString()}
                    value={item}
                  />
                );
              })}
            </Picker>
            <Picker
              style={{
                color: "orange",
                width: 100,
              }}
              itemStyle={{
                padding: 0,
              }}
              mode={"dropdown"}
              dropdownIconColor={"white"}
              selectedValue={addHoursValues.start.time.minute}
              onValueChange={(itemValue, itemIndex) =>
                setAddHoursValues((draft) => {
                  draft.start.time.minute = itemValue;
                })
              }
            >
              {minutesInHour.map((item, index) => {
                return (
                  <Picker.Item
                    key={index}
                    label={new Intl.NumberFormat(undefined, {
                      minimumIntegerDigits: 2,
                    }).format(item)}
                    value={item}
                  />
                );
              })}
            </Picker>
            <Picker
              style={{
                color: "orange",
                width: 100,
              }}
              itemStyle={{
                padding: 0,
              }}
              mode={"dropdown"}
              dropdownIconColor={"white"}
              selectedValue={addHoursValues.start.time.ampm}
              onValueChange={(itemValue, itemIndex) =>
                setAddHoursValues((draft) => {
                  draft.start.time.ampm = itemValue;
                })
              }
            >
              <Picker.Item label={"AM"} value={"am"} />
              <Picker.Item label={"PM"} value={"pm"} />
            </Picker>
          </View>

          {/* End Time */}
          <View style={styles.hours_addItem_sectionContainer}>
            <Text style={styles.hours_addItem_sectionText}>End Time:</Text>
            <Picker
              style={{
                color: "orange",
                width: 95,
              }}
              itemStyle={{
                padding: 0,
              }}
              mode={"dropdown"}
              dropdownIconColor={"white"}
              selectedValue={addHoursValues.end.time.hour}
              onValueChange={(itemValue, itemIndex) =>
                setAddHoursValues((draft) => {
                  draft.end.time.hour = itemValue;
                })
              }
            >
              {hoursInDay.map((item, index) => {
                return (
                  <Picker.Item
                    key={index}
                    label={item.toString()}
                    value={item}
                  />
                );
              })}
            </Picker>
            <Picker
              style={{
                color: "orange",
                width: 100,
              }}
              itemStyle={{
                padding: 0,
              }}
              mode={"dropdown"}
              dropdownIconColor={"white"}
              selectedValue={addHoursValues.end.time.minute}
              onValueChange={(itemValue, itemIndex) =>
                setAddHoursValues((draft) => {
                  draft.end.time.minute = itemValue;
                })
              }
            >
              {minutesInHour.map((item, index) => {
                return (
                  <Picker.Item
                    key={index}
                    label={new Intl.NumberFormat(undefined, {
                      minimumIntegerDigits: 2,
                    }).format(item)}
                    value={item}
                  />
                );
              })}
            </Picker>
            <Picker
              style={{
                color: "orange",
                width: 100,
              }}
              itemStyle={{
                padding: 0,
              }}
              mode={"dropdown"}
              dropdownIconColor={"white"}
              selectedValue={addHoursValues.end.time.ampm}
              onValueChange={(itemValue, itemIndex) =>
                setAddHoursValues((draft) => {
                  draft.end.time.ampm = itemValue;
                })
              }
            >
              <Picker.Item label={"AM"} value={"am"} />
              <Picker.Item label={"PM"} value={"pm"} />
            </Picker>
          </View>

          {/* Submit  */}
          <Pressable
            style={styles.hours_addItem_submitButtonContainer}
            onPress={action_submitManualHours}
          >
            <Text style={styles.hours_addItem_submitButtonText}>
              {pockets.hours.edit >= 0 ? "Update" : "Submit"}
            </Text>
          </Pressable>
        </View>
      );
    };
    if (
      pockets.hours.navigation === "add" ||
      (pockets.hours.navigation === "edit" && pockets.hours.edit >= 0)
    )
      return render_addOrModifyItem();
    return pockets.hours.arr.map((item, index) => {
      const { date, day } = format_date(item.Start);
      const hours = format_hours({
        start: item.Start,
        end: item.End,
      });
      const sel = pockets.hours.selected;

      return (
        <Pressable
          key={index}
          style={[
            styles.hoursItem,
            { paddingVertical: sel === index ? 10 : 5 },
          ]}
          onPress={() => press_hourItem(index)}
        >
          <Text
            style={[
              styles.hoursItem_text,
              { flex: 1, color: sel === index ? "orange" : "white" },
            ]}
          >
            {date}
          </Text>
          <Text
            style={[
              styles.hoursItem_text,
              { flex: 1, color: sel === index ? "orange" : "white" },
            ]}
          >
            {day}
          </Text>
          <Text
            style={[
              styles.hoursItem_text,
              { flex: 2, color: sel === index ? "orange" : "white" },
            ]}
          >
            {hours}
          </Text>
          {render_icon(index, item)}
        </Pressable>
      );
    });
  };
  const render_statsSection = () => {
    return (
      <View style={styles.statsContainer}>
        {/* @todo temp one item rendered */}
        {/* <Widget expanded={true} data={widgetData.item[0]} /> */}

        {widgetData.item.map((item, index) => {
          return <Widget expanded={true} key={index} data={item} />;
        })}
      </View>
    );
  };
  const render_widget = () => {
    return widgetData.item.map((item, index) => {
      return <Widget expanded={false} key={index} data={item} />;
    });
  };
  const render_tabSection = () => {
    const changeTabSection = (newTab) => {
      setPockets((draft) => {
        draft[newTab].open = !draft[newTab].open;
        draft[newTab === "hours" ? "stats" : "hours"];
      });
    };

    const selectedColor = "orange";
    const textColor = {
      view: pockets.hours.navigation === "view" ? selectedColor : "gray",
      add: pockets.hours.navigation === "add" ? selectedColor : "gray",
      edit: pockets.hours.navigation === "edit" ? selectedColor : "gray",
      delete: pockets.hours.navigation === "delete" ? selectedColor : "gray",
    };

    const hoursDynamicStyle = pockets.hours.open ? { flex: 1 } : {};
    const statsDynamicStyle = pockets.stats.open ? { flex: 1 } : {};

    return (
      <View style={styles.innerContainer_content}>
        {/* Hours */}
        <View style={[styles.pocketContainer, hoursDynamicStyle]}>
          <Pressable
            style={styles.pocketHeader_container}
            onPress={() => changeTabSection("hours")}
          >
            <Text style={styles.pocketHeader}>Hours</Text>
          </Pressable>
          <View style={[styles.pocketBody]}>
            <View style={styles.hoursContainer}>
              <View style={styles.navigation_container}>
                <Pressable
                  style={styles.navigation_button}
                  onPress={() => press_navigation("view")}
                >
                  <Text
                    style={[styles.navigation_text, { color: textColor.view }]}
                  >
                    View
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.navigation_button}
                  onPress={() => press_navigation("add")}
                >
                  <Text
                    style={[styles.navigation_text, { color: textColor.add }]}
                  >
                    Add
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.navigation_button}
                  onPress={() => press_navigation("edit")}
                >
                  <Text
                    style={[styles.navigation_text, { color: textColor.edit }]}
                  >
                    Edit
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.navigation_button}
                  onPress={() => press_navigation("delete")}
                >
                  <Text
                    style={[
                      styles.navigation_text,
                      { color: textColor.delete },
                    ]}
                  >
                    Delete
                  </Text>
                </Pressable>
              </View>
              <ScrollView style={styles.hoursScroll}>
                {pockets.hours.loading
                  ? loadingHoursItem()
                  : render_hoursSection()}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.pocketContainer, statsDynamicStyle]}>
          <Pressable
            style={styles.pocketHeader_container}
            onPress={() => changeTabSection("stats")}
          >
            <Text style={styles.pocketHeader}>Stats</Text>
          </Pressable>
          <View style={[styles.pocketBody]}>
            {pockets.stats.loading
              ? loadingStatsSection()
              : render_statsSection()}
          </View>
        </View>
      </View>
    );
  };

  if (!expanded) return render_widget();
  else return render_tabSection();
}

async function getHours({ daysToLoad, db, setPockets, time }) {
  console.log("grabbing from database ... ");
  const millisInADay = 1000 * 60 * 60 * 24;
  const millisInDaysToLoad = millisInADay * daysToLoad;

  const end = new Date().getTime();
  // const start = new Date(end - millisInDaysToLoad).getTime();

  // STARTING TIME HARDCODED TO BEGINNING OF THIS YEAR
  const start = new Date(new Date().getFullYear(), 0, 0, 0, 0, 0).getTime();

  const data = await db.getData.getAllDataBetweenTwoTimes({ start, end });

  const data_newestStartTimeToOldestStartTime =
    time.arrayMethods.sortHours_newestStartTimeToOldestStartTime(data);

  setPockets((draft) => {
    draft.hours.arr = data_newestStartTimeToOldestStartTime;
    draft.hours.loading = false;

    // @todo temp
    draft.stats.loading = false;
  });
}
async function getStats({ db }) {}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    backgroundColor: "chocolate",
    borderRadius: 10,
    overflow: "hidden",
  },
  innerContainer: {
    width: "100%",
    // borderWidth: 1,
    // borderColor: "white",
    padding: 5,
    alignItems: "center",
  },
  innerContainer_content: {
    // paddingTop: 5,
    flex: 1,
    // borderWidth: 1,
    // borderColor: "black",
  },
  pocketContainer: {
    marginVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "hsla(0, 0%, 0%, 0.78)",
    // borderWidth: 1,
    // borderColor: "yellow",
  },
  pocketHeader_container: {
    // backgroundColor: "orange",
    alignItems: "center",
  },
  pocketHeader: {
    fontSize: 18,
    color: "white",
    paddingVertical: 10,
  },
  pocketBody: {
    // backgroundColor: "green",
    flex: 1,
  },
  hoursContainer: {
    // backgroundColor: "pink",
    flex: 1,
  },
  hoursScroll: {
    // backgroundColor: "red",
    paddingHorizontal: 5,
  },
  hoursItem: {
    // backgroundColor: "green",
    flexDirection: "row",
    alignItems: "center",
    // paddingVertical: 5,
    paddingLeft: 10,
  },
  hoursItem_text: {
    fontSize: 18,
    // borderWidth: 1,
    // borderColor: "green",
  },
  hoursItem_actionButtonContainer: {
    // backgroundColor: "purple",
    alignItems: "center",
    marginRight: 15,
    padding: 2,
    borderRadius: 5,
  },
  hoursItem_icon: {
    height: 20,
    width: 20,
    // tintColor: "chocolate",
    // backgroundColor: "green",
  },
  hours_addItem_container: {
    // backgroundColor: "red",
    flex: 1,
    paddingHorizontal: 10,
  },
  hours_addItem_header: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
  },
  hours_addItem_sectionContainer: {
    // backgroundColor: "green",
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderBottomWidth: 1,
    borderColor: "white",
    marginVertical: 20,
    // backgroundColor: "hsla(0, 0%, 0%, 0.5)",
  },
  hours_addItem_sectionText: {
    width: 100,
    color: "gray",
    fontSize: 12,
    // backgroundColor: "cyan",
    textAlign: "left",
    position: "absolute",
    bottom: 2,
    left: 10,
    // left: "50%",
    // transform: [{ translateX: -50 }],
  },
  hours_addItem_sectionInput: {
    color: "orange",
    flex: 1,
    paddingTop: 12,
    // backgroundColor: "blue",
    textAlign: "center",
  },
  hours_addItem_submitButtonContainer: {
    width: "100%",
    paddingVertical: 30,
  },
  hours_addItem_submitButtonText: {
    backgroundColor: "chocolate",
    color: "black",
    textAlign: "center",
    fontSize: 25,
    paddingVertical: 10,
  },
  navigation_container: {
    // flex: 1,
    // backgroundColor: "green",
    flexDirection: "row",
    marginHorizontal: 5,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "gray",
  },
  navigation_button: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    // borderWidth: 1,
    // borderColor: "white",
  },
  navigation_text: {
    color: "gray",
    fontSize: 12,
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 5,
  },
  statsText: {
    color: "white",
  },
});
