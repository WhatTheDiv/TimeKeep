import { StyleSheet, View, Text, Animated } from "react-native";
import React, { useEffect, useContext } from "react";
import { Context } from "../js/Context";

export default function Counter({ clock, bus }) {
  const { animations } = useContext(Context).bus;
  const { counter } = animations;

  useEffect(() => {
    // counter.animateIn();
    // counter.animateTicker_toggle("start");
  }, []);

  const calculatedTop =
    animations.screen.width * 0.25 + animations.screen.height * 0.5;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: calculatedTop, opacity: counter.animate_opacity },
      ]}
    >
      <View style={styles.innerContainer}>
        <Text style={[styles.text, {}]}>
          {clock.hours.toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
          })}
        </Text>
        <Animated.Text
          style={[styles.divider, { opacity: counter.animate_tickerOpacity }]}
        >
          :
        </Animated.Text>
        <Text style={[styles.text, {}]}>
          {clock.minutes.toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
          })}
        </Text>
        <Animated.Text
          style={[styles.divider, { opacity: counter.animate_tickerOpacity }]}
        >
          :
        </Animated.Text>
        <Text style={[styles.text]}>
          {clock.seconds.toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
          })}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    // borderWidth: 1,
    // borderColor: "purple",
    alignItems: "center",
    // justifyContent: "center",
    width: "100%",
  },
  innerContainer: {
    flexDirection: "row",
    // alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
    width: "90%",
    paddingTop: 20,
    paddingBottom: 20,
    borderColor: "chocolate",
    borderWidth: 1,
    borderRadius: 8,
  },
  text: {
    color: "white",
    fontSize: 40,
  },
  divider: {
    color: "white",
    fontSize: 35,
    paddingLeft: 10,
    paddingRight: 10,
  },
  hoursTicker: {},
});
