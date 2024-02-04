import { Animated, Easing } from 'react-native'

export default class Animations {
  constructor(screen, initBtnLoc, start, mainBtnScale, bttnLoc, broadState, counterTicker, drawer, drawerStartup) {
    this.screen = screen
    this.animation_Values = {
      startup: start,
      mainButtonScale: mainBtnScale,
      buttonLocation: bttnLoc,
      broadClockState: broadState,
      counterTicker,
      drawer,
      drawerStartup,
    }
    this.title = {
      animate_opacity: this.animation_Values.broadClockState,
      animate_position: this.animation_Values.broadClockState.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 15]
      }),
    }
    this.mainButton = {
      buttonLocationVariable_clockedIn: 0,//.2,
      buttonLocationVariable_clockedOut: .6, //.9,
      buttonScaleVariable: {
        clockedIn: .6,
        clockedOut: .4,
      },
      animate_opacity: this.animation_Values.startup,
      animate_scale: this.animation_Values.mainButtonScale,
      animate_buttonLocation: this.animation_Values.buttonLocation.interpolate({
        inputRange: [0, 1],
        outputRange: [initBtnLoc, 0]
      }),
      animate_buttonLocationScaleHelper: this.animation_Values.buttonLocation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, this.screen.width / -2 - this.screen.width * .2]
      }),
      moveMainButton: ({ duration, delay, value }) => {
        Animated.timing(this.animation_Values.buttonLocation, {
          toValue: value,
          delay,
          duration,
          easing: Easing.ease,
          useNativeDriver: true
        }).start()
      },
      scaleMainButton: ({ value, duration, delay }) => {
        Animated.timing(this.animation_Values.mainButtonScale, {
          toValue: value,
          duration: duration,
          delay: delay,
          easing: Easing.ease,
          useNativeDriver: true
        }).start()
      },
    }
    this.counter = {
      animate_opacity: this.animation_Values.broadClockState,
      animate_tickerOpacity: this.animation_Values.counterTicker,
      animateTicker_toggle: (state = "stop") => {
        const startTicker = () => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(this.animation_Values.counterTicker, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.ease
              }),
              Animated.timing(this.animation_Values.counterTicker, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.ease
              }),
            ])
          ).start()
        }
        const stopTicker = () => {
          Animated.timing(this.animation_Values.counterTicker, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true
          })
          this.animation_Values.counterTicker.stopAnimation()
        }
        if (state === "start") startTicker()
        else if (state === "stop") stopTicker()
      },
      animateClockStateChange({ active, duration, delay }) {
        Animated.timing(this.animation_Values.broadClockState, {
          duration,
          toValue: active ? 1 : 0,
          delay,
          useNativeDriver: true
        }).start()
      }
    }
    this.drawer = {
      drawerMaxHeight: this.screen.height * .75,
      // animate_position: 0,
      animate_position: this.animation_Values.drawer.interpolate({
        inputRange: [0, 1],
        outputRange: [0, this.screen.height * -.75]
      }),
      animate_opacity: this.animation_Values.drawerStartup,
      slideDrawer: ({ duration, active, delay }) => {
        Animated.timing(this.animation_Values.drawer, {
          toValue: active ? .3 : 1,
          duration,
          easing: Easing.ease,
          delay,
          useNativeDriver: true
        }).start()
      },
      drawerOpacity: ({ duration, delay }) => {
        Animated.timing(this.animation_Values.drawerStartup, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true
        }).start()
      },
      drawerInitialAnimation(active = true) {
        // give opacity to drawer with delay
        this.drawer.drawerOpacity({
          duration: this.timing.drawerInitialAnimation.duration,
          delay: this.timing.drawerInitialAnimation.delay
        })

        // slide drawer to normal position
        this.drawer.slideDrawer({
          duration: this.timing.drawerInitialAnimation.duration,
          active,
          delay: this.timing.drawerInitialAnimation.delay
        })
      }
    }
    this.timing = {
      bigButtonFadeIn: {
        duration: 500
      },
      drawerInitialAnimation: {
        duration: 500,
        delay: 0
      },
      changeClockState: {
        duration: 500,
        delay: 0
      },
      startupDelay: 0
    }
  }

  Startup() {
    console.log(':::   Running startup animations ... :::')
    // give opacity to big logo
    Animated.timing(this.animation_Values.startup, {
      toValue: 1,
      duration: this.timing.bigButtonFadeIn.duration,
      useNativeDriver: true
    }).start()
  }

  ClockIn(drawer = true) {
    const duration = this.timing.changeClockState.duration
    const delay = this.timing.changeClockState.delay
    // from clocked out 

    // - scale button
    this.mainButton.scaleMainButton({
      duration,
      delay,
      value: this.mainButton.buttonScaleVariable.clockedIn
    })
    // - move button
    this.mainButton.moveMainButton({
      duration,
      delay,
      value: this.mainButton.buttonLocationVariable_clockedIn,
    })
    // - give opacity to title
    this.counter.animateClockStateChange.bind(this)({
      duration,
      delay,
      active: true
    })

    // - begin counter ticking animation
    this.counter.animateTicker_toggle("start")

    // - slide drawer down
    if (drawer) this.drawer.slideDrawer({ duration, active: true, delay })
  }

  ClockOut(drawer = true) {
    const duration = this.timing.changeClockState.duration
    const delay = this.timing.changeClockState.delay
    // from clocked in
    // - scale button
    this.mainButton.scaleMainButton({
      duration,
      delay,
      value: this.mainButton.buttonScaleVariable.clockedOut
    })
    // - move button
    this.mainButton.moveMainButton({
      duration,
      delay,
      value: this.mainButton.buttonLocationVariable_clockedOut,
    })
    // - remove opacity from title 
    this.counter.animateClockStateChange.bind(this)({
      duration,
      delay,
      active: false
    })

    // - stop counter ticking animation
    this.counter.animateTicker_toggle("stop")

    // - slide drawer up
    if (drawer) this.drawer.slideDrawer({ duration, active: false, delay })

  }

}