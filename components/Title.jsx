import { StyleSheet, Text, Animated, Pressable } from "react-native";
import React, { useContext } from "react";
import { Context } from "../js/Context";

export default function Title({ bus }) {
  const { animations, time } = useContext(Context).bus;

  const test = () => {
    console.log("cpcpp2");
    time.db.getData.getAllData();
    // console.log(time.db.database);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: animations.screen.height * 0.08,
          opacity: animations.animation_Values.broadClockState,
          transform: [{ translateY: animations.title.animate_position }],
        },
      ]}
    >
      <Pressable onPress={test}>
        <Text style={styles.text}>You're on the clock!</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    position: "absolute",
    // borderWidth: 1,
    // borderColor: "purple",
  },
  text: {
    color: "white",
    fontSize: 40,
  },
});
