import { StyleSheet, Text, View, Pressable, Animated } from "react-native";
import React, { useEffect, useContext } from "react";
import { Context } from "../js/Context";

export default function mainButton({ bus, clockFunc, title }) {
  const { animations, time, loaded, setup } = useContext(Context).bus;

  useEffect(() => {
    animations.Startup();
  }, []);

  const button_main = () => {
    if (clockFunc.clock.active) clockFunc.clock_out();
    else clockFunc.clock_in();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animations.mainButton.animate_opacity,
          transform: [
            {
              translateY: animations.mainButton.animate_buttonLocation,
            },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            width: bus.animations.screen.width,
            height: bus.animations.screen.width,
            transform: [
              { scale: animations.mainButton.animate_scale },
              {
                translateY:
                  animations.mainButton.animate_buttonLocationScaleHelper,
              },
            ],
          },
        ]}
      >
        <Pressable
          style={styles.button}
          onPress={button_main}
          disabled={!setup}
        >
          <View style={styles.buttonInnerContainer}>
            <Text style={styles.buttonText}>
              {title
                ? bus.appName
                : clockFunc.clock.active
                ? "Clock Out"
                : "Clock In!"}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    // borderColor: "red",
    // borderWidth: 1,

    top: 0,
    // transform: [{ translateY: 50 }],

    // animating opacity
  },
  buttonWrapper: {
    // position: "absolute",
    // top: 0,
    // dynamic width
    // dynamic height

    // animating scale
    transformOrigin: "top",
    padding: 5,
    // borderWidth: 1,
    // borderColor: "green",
  },
  button: {
    backgroundColor: "chocolate",
    borderRadius: 200,
    shadowColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonInnerContainer: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 300,
    width: "98%",
    height: "98%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 50,
  },
});
