import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Dimensions, Animated, Alert } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useImmer } from "use-immer";
import { Stack } from "expo-router";
import _Animations from "../js/Animations";
import _Time from "../js/Time";
import _Database from "../js/Database";
import _Settings from "../js/Settings";
import { Context } from "../js/Context";

const borderAccumulation = 0;
const appName = "SalaryHelper";

export default function App() {
  const animate_start = useRef(new Animated.Value(0)).current;
  const animate_start2 = useRef(new Animated.Value(1)).current;
  const animate_buttonLocation = useRef(new Animated.Value(0)).current;
  const animate_broadClockState = useRef(new Animated.Value(0)).current;
  const animate_counterTicker = useRef(new Animated.Value(1)).current;
  const animate_drawer = useRef(new Animated.Value(0)).current;
  const animate_drawerStartup = useRef(new Animated.Value(0)).current;
  const [bus, setBus] = useImmer({
    appName: "",
    screen: {},
    time: {},
    animations: {},
    settings: {},
    loaded: false,
    setup: false,
  });

  useEffect(() => {
    console.log("bus.loaded useEffect !!!!!!!!! ");
    if (!bus.loaded) setup1();
    else if (bus.loaded && !bus.setup) setup2();
    else {
      console.log("----------------------------------------");
      console.log("App set up, starting ... ");
      console.log("----------------------------------------");
    }
  }, [bus.loaded]);

  const setup1 = async () => {
    console.log("");
    console.log("------------ Running Setup ... ---------");
    console.log(":::   Getting screen ...             :::");
    const screen = {
      width: Dimensions.get("window").width - borderAccumulation,
      height: Dimensions.get("window").height - borderAccumulation,
    };

    const initialButtonLocation = screen.height / 2 - screen.width / 2;

    console.log(":::   Prepping animations ...        :::");
    const animations = new _Animations(
      screen,
      initialButtonLocation,
      animate_start, // start opacity
      animate_start2, // start scale
      animate_buttonLocation, // button location
      animate_broadClockState,
      animate_counterTicker,
      animate_drawer,
      animate_drawerStartup
    );

    const settings = _Settings;

    setBus((draft) => {
      draft.loaded = true;
      draft.appName = appName;
      draft.screen = screen;
      draft.animations = animations;
      draft.settings = settings;
    });
  };
  const setup2 = async () => {
    const deleteThisClockMultiple = async (id, resolve) => {
      if (await db.deleteData.delete_withId(id)) resolve(true);
      else {
        alert("Failed to delete entry");
        resolve(false);
      }
    };
    const clearAnyMultipleActiveClocks = (arr, db) => {
      return new Promise(async (resolve, reject) => {
        const millisToDateObj = (millis) => {
          console.log("new date with millis: ", millis);
          const d = new Date(millis);
          return {
            year: d.getFullYear(),
            month: d.getMonth(),
            day: d.getDay(),
            hour: d.getHours(),
            minute: d.getMinutes(),
            second: d.getSeconds(),
          };
        };
        const hour_militaryToStandard = (militaryHour) => {
          const time = {};
          if (militaryHour === 0) {
            time.hour = 12;
            time.ampm = "AM";
          } else if (militaryHour === 12) {
            time.hour = 12;
            time.ampm = "PM";
          } else if (militaryHour > 0 && militaryHour < 12) {
            time.hour = militaryHour;
            time.ampm = "AM";
          } else {
            time.hour = militaryHour - 12;
            time.ampm = "PM";
          }
          return time;
        };
        const prompt = (dataEntry, len) => {
          return new Promise((resolve2, reject) => {
            const s = millisToDateObj(dataEntry.Start);
            console.log("sending alrt ... ", dataEntry, s);
            const month = s.month + 1;
            const hour = hour_militaryToStandard(s.hour);
            const string =
              month +
              "/" +
              s.day +
              " at " +
              hour.hour +
              ":" +
              s.minute +
              hour.ampm;

            Alert.alert(
              "(" + len + ") active clocks, there can only be 1!!!",
              "Would you like to delete: " + string,
              [
                {
                  text: "Yes",
                  onPress: () =>
                    deleteThisClockMultiple(dataEntry.Id, resolve2),
                },
                {
                  text: "No",
                  onPress: () => {
                    resolve2(false);
                  },
                },
              ],
              {
                cancelable: false,
              }
            );
          });
        };

        if (arr.length > 1) console.log("arr: ", arr);

        let i = 0;

        if (arr.length <= 1)
          resolve({
            modified: false,
            id: -1,
            start: -1,
          });
        else {
          while (arr.length > 1) {
            console.error("Clearing active clocks .... len:", arr);
            if (await prompt(arr[i], arr.length)) arr.splice(i, 1);
            else i = i + 1 >= arr.length ? 0 : i + 1;
          }
          if (arr.length >= 0) {
            await prompt(arr[i], arr.length);
          }
          console.log(
            "****************************************** while loop over, ",
            arr.length
          );
          resolve({
            modified: true,
            id: arr.length > 0 ? arr[0].Id : -1,
            start: arr.length > 0 ? arr[0].Start : -1,
          });
        }
      });
    };

    console.log(":::   Setting up database ...        :::");
    const db = await new _Database().init();

    console.log(":::   Checking for active clock ...  :::");
    // returns {id: -1, start: -1} for no active clock
    const precheck_activeClock = await db.getData.getLastEntryWithoutEndTime();

    const modifiedActiveClock = await clearAnyMultipleActiveClocks(
      precheck_activeClock.conflictArr,
      db
    );

    const { id, start } = modifiedActiveClock.modified
      ? modifiedActiveClock
      : precheck_activeClock;

    db.currentItem = id;

    console.log(":::   Setting up time utilities ...  :::");
    const time = new _Time(db, start);

    console.log("------------ Setup Complete ------------");
    console.log("");

    const extraTimeout = 0;

    // temp timeout to lag startup animation after big button fades in
    setTimeout(() => {
      setBus((draft) => {
        draft.time = time;
        draft.setup = true;
      });
    }, bus.animations.timing.bigButtonFadeIn.duration * 0.7 + bus.animations.timing.startupDelay + extraTimeout);
  };

  console.log("---   Rendering main component tree  ---");

  return (
    <>
      <StatusBar style="light" backgroundColor="black" />
      <SafeAreaView style={styles.container}>
        <Context.Provider
          value={{
            bus,
            // @ts-ignore
            setBus,
          }}
        >
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="settings"
              options={{
                title: "Settings",
                headerStyle: { backgroundColor: "black" },
                headerTintColor: "white",
                headerTitleAlign: "center",
              }}
            />
          </Stack>
        </Context.Provider>
        {/* {!bus.loaded ? null : <MainComponent bus={bus} />} */}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    // borderWidth: 1,
    // borderColor: 'white',
  },
});
