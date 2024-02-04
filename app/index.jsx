import {
  StyleSheet,
  SafeAreaView,
  View,
  Pressable,
  Text,
  Image,
} from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { Link } from "expo-router";
import MainButton from "../components/mainButton.jsx";
import TitleComponent from "../components/Title.jsx";
import CounterComponent from "../components/Counter.jsx";
import DrawerComponent from "../components/Drawer.jsx";
import { Context } from "../js/Context";

export default function MainComponent() {
  const bus = useContext(Context).bus;
  const { animations, time, setup, loaded } = bus;
  const [title, setTitle] = useState(true);
  const [clock, setClock] = useState({
    active: false,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!setup) {
      setClock({ ...clock, active: false });
      return;
    }

    // if setup is complete, run initial animations
    componentsInitialAnimation();

    // establish stored active clock
    const ts = time.timeStamp_millis;

    if (!ts || ts < 0) return;

    setClock({
      active: true,
      ...time.formatTimeFromMillis(new Date().getTime()),
    });

    time.resumeClock(clockFunc);
  }, [setup]);

  if (!loaded) return <View></View>;

  const componentsInitialAnimation = () => {
    const initDrawerAnim =
      animations.drawer.drawerInitialAnimation.bind(animations);
    const active = bus.time.timeStamp_millis !== -1;

    initDrawerAnim(active);

    if (active) {
      animations.ClockIn(false);
    } else {
      animations.ClockOut(false);
    }

    setTimeout(() => {
      setTitle(false);
    }, animations.timing.drawerInitialAnimation.duration + animations.timing.drawerInitialAnimation.delay);
  };

  const clock_out = async () => {
    console.log("---   Setting clock to 'clocked OUT  ---'");

    setClock((prev) => {
      return { ...prev, active: false };
    });
    if (await time.stopClock()) animations.ClockOut();
  };

  const clock_in = async () => {
    console.log("---   Setting clock to 'clocked IN   ---'");

    setClock((prev) => {
      return { ...prev, active: true };
    });

    if (await time.startClock(clockFunc)) animations.ClockIn();
  };

  const clockFunc = { clock, setClock, clock_in, clock_out };

  return (
    <SafeAreaView style={styles.container}>
      <Link push href="/settings" asChild>
        <Pressable style={styles.settingsButton}>
          <Image
            style={styles.settingsButtonIcon}
            // @ts-ignore
            source={require("../assets/icons/settings.png")}
          ></Image>
        </Pressable>
      </Link>
      {!setup ? null : <TitleComponent bus={bus} />}
      <MainButton bus={bus} clockFunc={clockFunc} title={title} />
      {!setup ? null : <CounterComponent bus={bus} clock={clock} />}
      {!setup ? null : <DrawerComponent active={clock.active} bus={bus} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // borderWidth: 1,
    // borderColor: "yellow",
    backgroundColor: "black",
    borderTopWidth: 1,
    borderTopColor: "dark gray",
  },
  settingsButton: {
    width: 20,
    height: 20,
    position: "absolute",
    top: 15,
    right: 5,
    padding: 0,
  },
  settingsButtonIcon: {
    width: 20,
    height: 20,
    tintColor: "gray",
  },
});
