import { createContext } from 'react'

export const Context = createContext({
  bus: {
    appName: "",
    screen: {},
    time: {},
    animations: {},
    settings: {},
    loaded: false,
    setup: false
  }, setBus: null
})