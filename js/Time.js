
export default class Time {
  constructor(db, existingStartTime) {
    this.db = db
    this.intervalTickerFuncRef = null
    this.timeStamp_millis = existingStartTime
    this.clockFunc = null
    this.lastValues = { start: -1, end: -1 }
    this.manipFuncs = {
      millis_difference_toSecondsMinutesHours: ({ start, end }) => {
        const difference = end - start

        const millis_inHours = 1000 * 60 * 60
        const millis_inMinutes = 1000 * 60
        const millis_inSeconds = 1000

        const hoursRemainder = difference % millis_inHours
        const hours = (difference - hoursRemainder) / millis_inHours
        const minutesRemainder = hoursRemainder % millis_inMinutes
        const minutes = (hoursRemainder - minutesRemainder) / millis_inMinutes
        const secondsRemainder = minutesRemainder % millis_inSeconds
        const seconds = (minutesRemainder - secondsRemainder) / millis_inSeconds

        return { seconds, minutes, hours }
      },
      incrementTime: (setClock) => {
        setClock(prev => {
          const flag = { seconds: false, minutes: false }
          const { seconds, minutes, hours } = prev
          const newTime = {}

          if (seconds === 59) flag.seconds = true
          if (flag.seconds && minutes === 59) flag.minutes = true

          newTime.seconds = flag.seconds ? 0 : seconds + 1
          newTime.minutes = flag.minutes ? 0 : flag.seconds && !flag.minutes ? minutes + 1 : minutes
          newTime.hours = flag.minutes ? hours + 1 : hours

          return { ...prev, ...newTime }
        })
      },
      dateObjToMillis: ({ year, month, day, hour, minute, ampm }) => {
        const getHour = () => {
          if (hour === 12 && ampm === 'am') return 0
          else if (hour === 12 && ampm === 'pm') return 12
          else if (ampm === 'pm') return hour + 12
          else return hour
        }
        // need 12 am to be midnight
        // need 12 pm to be afternoon

        const millis = new Date(
          year,
          month,
          day,
          getHour(),
          minute
        ).getTime();
        console.log('(hour is actually', getHour(), ')')

        return millis
      },
      millisToDateObj: (millis) => {
        const d = new Date(millis)
        return {
          year: d.getFullYear(),
          month: d.getMonth(),
          day: d.getDate(),
          hour: d.getHours(),
          minute: d.getMinutes(),
          second: d.getSeconds()
        }
      },
      hour_militaryToStandard(militaryHour) {
        const time = {}
        if (militaryHour === 0) {
          time.hour = 12
          time.ampm = 'AM'
        } else if (militaryHour === 12) {
          time.hour = 12
          time.ampm = 'PM'
        } else if (militaryHour > 0 && militaryHour < 12) {
          time.hour = militaryHour
          time.ampm = 'AM'
        } else {
          time.hour = militaryHour + 12
          time.ampm = 'PM'
        }
        return time
      }

    }
    this.usefulArrays = {
      days: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      months: [
        "January",
        "Febuary",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      daysInMonths: [
        31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
      ]
    }
    this.arrayMethods = {
      sortHours_newestStartTimeToOldestStartTime: (data) => {
        if (data.length <= 1) return data

        let sortedArr = []

        rawDataIterator:
        data.forEach(element => {
          // exit early if first item in sortedArr
          if (sortedArr.length < 1) sortedArr.push(element)
          else {

            let pushToIndex = -1

            for (let i = 0; i < sortedArr.length; i++) {
              if (element.Start <= sortedArr[i].Start) continue
              else if (element.Start > sortedArr[i].Start && pushToIndex === -1) pushToIndex = i
            }
            if (pushToIndex === -1) sortedArr.splice(sortedArr.length, 0, element)
            else sortedArr.splice(pushToIndex, 0, element)
          }
        });

        return sortedArr
      }
    }
  }

  formatTimeFromMillis(now) {
    console.log('# Clock updated from millis ...')
    return this.manipFuncs.millis_difference_toSecondsMinutesHours({
      start: this.timeStamp_millis,
      end: now
    })
  }

  async resumeClock({ setClock }) {
    console.log('# Resuming clock tick ... ')

    this.clockFunc = setClock

    this.intervalTickerFuncRef = setInterval(
      () => this.manipFuncs.incrementTime(setClock),
      1000
    )
  }

  async startClock({ setClock }) {
    console.log('# Starting clock ... ')

    const now = new Date().getTime()

    const { sucess, id } = await this.storeClock_Beginning({ start: now })

    if (!sucess) {
      console.error('# Refused to start clock')
      alert('Failed to start clock')
      return false
    }

    this.timeStamp_millis = now

    this.db.currentItem = id

    this.clockFunc = setClock

    // set clock state to 'active'
    setClock(prev => {
      return { ...prev, active: true }
    })

    // assign interval function to variable
    this.intervalTickerFuncRef = setInterval(
      () => this.manipFuncs.incrementTime(setClock),
      1000
    )

    console.log('# Starting vars: ', {
      timestamp: this.timeStamp_millis,
      ticker: this.intervalTickerFuncRef,
      currentItem: this.db.currentItem
    })

    return true
  }

  async stopClock() {
    console.log('# Stopping clock ...')

    // check if start time and interval function saved, 
    if (this.timeStamp_millis === -1) {
      alert("No saved start time")
      console.error("No saved start time")
      return false
    }

    else if (this.intervalTickerFuncRef === null) {
      alert('No interval to clear')
      console.error('No interval to clear')
      return false
    }

    const lastValues = {
      start: this.timeStamp_millis,
      end: new Date().getTime()
    }

    // store previous values in database 
    if (!await this.storeClock_Completed(lastValues)) {
      console.error('# Refused to stop clock')
      alert('Failed to stop clock')
      return false
    }

    // stop incrementing clock
    clearInterval(this.intervalTickerFuncRef)

    // assign previous values to time class variable
    this.lastValues = lastValues

    // reset clock
    this.resetClock()

    return true
  }

  resetClock() {
    // reset variables in Time
    this.timeStamp_millis = -1

    // this.intervalTickerFuncRef 
    if (this.intervalTickerFuncRef) clearInterval(this.intervalTickerFuncRef)
    this.intervalTickerFuncRef = null

    // reset variables in Database
    this.db.currentItem = -1

    // reset display clock
    if (this.clockFunc)
      this.clockFunc({ active: false, hours: 0, minutes: 0, seconds: 0 })

    console.log('# Clock stopped and reset - vars:', {
      timestamp: this.timeStamp_millis,
      ticker: this.intervalTickerFuncRef,
      currentItem: this.db.currentItem
    })
  }

  async storeClock_Completed({ start, end }) {
    const clock = this.manipFuncs.millis_difference_toSecondsMinutesHours({ start, end })
    console.log('# Storing clock ...', clock)
    console.log('current item: ', this.db.currentItem)

    // update active clock in database to inactive
    const result = await this.db.storeData.updateTimeItem({ id: this.db.currentItem, keyValuePairs: [{ key: "End", value: end }] })
    const { sucess, id } = result
    const editedItem = await this.db.getData.getDataWithId(id)
    console.log(' ')
    console.log(' ')
    console.log(' ')
    console.log('result: ', result)
    console.log('clocked out item: ', editedItem)
    console.log('item id: ', id, '.... Sucess: ', sucess)
    return sucess
  }
  async storeClock_Beginning({ start }) {
    console.log('# Writing clock to database ')

    // write new active clock to database
    return await this.db.storeData.storeNewTimeItem({ start, end: -1 })
  }
}