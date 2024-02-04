import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';


export default class Database {
  constructor() {
    this.currentItem = -1
  }

  init = async () => {
    const createTableIfNotExist = async () => {
      if (!this.database) throw new Error('!!! Database does not exist !!!')

      await this.database.transactionAsync(async tx => {
        await tx.executeSqlAsync(
          "CREATE TABLE IF NOT EXISTS Times (Id int primary key autoincrement not null, Start int, End int);"
        )
      })
    }
    try {
      this.database = SQLite.openDatabase('db.db')
      await createTableIfNotExist()
      await this.getData.getAllFromDb()
    } catch (e) {
      alert('Error initializing database' + e.stringify())
    }
    return this

  }
  getData = {
    getAllFromDb: async () => {
      return new Promise(resolve => {
        try {
          if (!this.database) throw new Error('!!! Database does not exist !!!')

          this.database.transaction(async tx => {
            await tx.executeSql("SELECT * FROM Times",
              [],
              (_, res) => { resolve(res.rows._array) },
              (_, e) => { throw new Error('Failed to get everything from db, ' + e) }
            )
          })

        } catch (e) {
          console.error('* Error at getAllFromDb: ', e.message)
          console.log(e)
          resolve(false)
        }
      })
    },
    getDataWithId: async (id) => {
      return new Promise((resolve, reject) => {
        try {
          if (!this.database) throw new Error('!!! Database does not exist !!!')
          this.database.transaction(async tx => {
            tx.executeSql(
              "SELECT * FROM Times Where ID = ?",
              [id],
              (_, res) => {
                // console.log('* Got data with id: ', id, '... ,', res)
                resolve(res.rows._array[0])
              },
              (_, e) => { throw new Error('* Failed to retrieve item ( ID:' + id + ' )') }
            )
          })
        } catch (e) {
          console.error('* Error at getDataWithId: ', e.message)
          console.log(e)
          resolve(false)
        }
      })
    },
    getAllDataBetweenTwoTimes: ({ start, end }) => {
      return new Promise((resolve, reject) => {
        console.log('::: Getting items between ', start, ' and ', end)
        try {
          if (!this.database) throw new Error('!!! Database does not exist !!!')
          this.database.readTransaction(tx => {
            tx.executeSql(
              "SELECT * FROM Times WHERE Start BETWEEN ? AND ?",
              [start, end],
              (_, res) => resolve(res.rows._array),
              e => { throw new Error('Failed to get data between' + start + 'and' + end) }
            )
          })
        } catch (e) {
          console.error('* Error at getAllDataBetweenTwoTimes: ', e.message)
          console.log(e)
          resolve([])
        }
      })

    },
    getLastEntryWithoutEndTime: () => {
      return new Promise(async (resolve, reject) => {
        try {
          if (!this.database) throw new Error('!!! Database is not defined !!!')

          this.database.transaction(tx => {
            tx.executeSql(
              "SELECT End, Start, Id FROM Times Where End=-1",
              [],
              (_, res) => {
                const rows = res.rows._array
                let conflictArr = []

                if (rows.length < 1) {
                  console.log(":::   No active clock found.         :::")
                  resolve({
                    start: -1,
                    id: -1,
                    conflictArr
                  })
                }

                if (rows.length >= 1) {
                  console.log(":::   Active clock found.            :::")

                  if (rows.length > 1) {
                    console.error('!!!   More than 1 active time          !!!')
                    conflictArr = rows
                  }

                  resolve({
                    start: rows[0].Start,
                    id: rows[0].Id,
                    conflictArr
                  })
                }
              },
              (_, e) => {
                console.log(e)
                throw new Error('* Failed to get last entry without end time')
              })
          })

        } catch (e) {
          console.error('Error @ getLastEntryWithoutEndTime: ', e.message)
          console.log(e)
          resolve({
            start: -1,
            id: -1,
            conflictArr: []
          })
        }
      })
    }
  }
  storeData = {
    storeNewTimeItem: ({ start, end }) => {
      return new Promise((resolve, reject) => {
        try {
          if (!this.database) throw new Error('!!! Database does not exist !!!')

          this.database.transaction(tx => {
            tx.executeSql(
              "INSERT INTO Times (Start, End) VALUES (?,?) RETURNING Id",
              [start, end],
              (_, result) => resolve({ sucess: true, id: result.insertId }),
              (_, e) => {
                console.log('* Transaction error message: ', e)
                throw new Error('* Failed to store new time with [start:' + start + '], [end:' + end + ']')
              }
            )
          })

        } catch (e) {
          console.error('* Error at storeNewTimeItem: ', e.message)
          console.log(e)
          resolve({ sucess: false })
        }
      })
    },
    // updateTimeItem: ({ id, key, value }) => {
    //   return new Promise((resolve, reject) => {
    //     try {
    //       if (!this.database) throw new Error('!!! Database does not exist !!!')

    //       this.database.transaction(tx => {
    //         tx.executeSql(
    //           "UPDATE Times SET " + key + "=? WHERE Id=?",
    //           [value, id],
    //           (_, result) => {
    //             console.log('sucessfully update new time item ... ')
    //             resolve({ sucess: true, id: result.insertId })
    //           },
    //           (_, e) => {
    //             console.log('* Transaction error message: ', e)
    //             throw new Error('* Failed to update ' + key + ' with [Id:' + id + '], [End:' + value + ']')
    //           }
    //         )
    //       })

    //     } catch (e) {
    //       console.error('* Error at updateTimeItem: ', e.message)
    //       console.log(e)
    //       resolve(false)
    //     }
    //   })
    // },
    updateTimeItem: ({ id, keyValuePairs }) => {
      return new Promise((resolve, reject) => {
        try {
          if (!this.database) throw new Error('!!! Database does not exist !!!')

          const strings = []

          for (let i = 0; i < keyValuePairs.length; i++) {
            console.log('iteration ', i)
            if (!keyValuePairs[i].key || !keyValuePairs[i].value) throw new Error('Bad key value pair: ' + keyValuePairs[i])

            strings.push(keyValuePairs[i].key + ' = ' + keyValuePairs[i].value)
            console.log('i: ', i, ',keyValuePairs.length-1:', keyValuePairs - 1, ' ... Pushiing comma: ', i < keyValuePairs.length - 1)
            if (i < keyValuePairs.length - 1) strings.push(', ')
          }

          const finalStatement = "UPDATE Times SET " + strings.join("") + ' WHERE Id = ' + id

          console.log('************** database - keyValuePairs: ', keyValuePairs)
          console.log('************** database - finalStatement: ', finalStatement)

          this.database.transaction(tx => {
            tx.executeSql(
              finalStatement,
              [],
              (_, result) => {
                console.log('sucessfully update new time item ... ')
                resolve({ sucess: true, id: result.insertId })
              },
              (_, e) => {
                console.log('* Transaction error message: ', e)
                throw new Error('* Failed to update using keyValuePairs:' + JSON.stringify(keyValuePairs))
              }
            )
          })

        } catch (e) {
          console.error('* Error at updateTimeItem: ', e.message)
          console.log(e)
          resolve(false)
        }
      })
    },
  }
  deleteData = {
    delete_withId: (id) => {
      return new Promise((resolve, reject) => {
        try {
          if (!this.database) throw new Error('!!! Database does not exist !!!')
          this.database.transaction(tx => {
            tx.executeSql(
              "DELETE FROM Times WHERE ID=?",
              [id],
              (tx, res) => {
                resolve(true)
              },
              (_, e) => {
                console.log('* Transaction error message: ', e)
                throw new Error('* Failed to delete data with Id ' + id)
              }
            )
          })
        } catch (e) {
          console.error('Error at delete_withId: ', e.message)
          console.log(e)
          resolve(false)
        }
      })
    },
    delete_everythingFromDatabase: () => {
      return new Promise(resolve => {
        try {
          if (!this.database) throw new Error('!!! Database does not exist !!!')

          this.database.transaction(tx => {
            tx.executeSql(
              "DELETE FROM Times",
              [],
              (_, res) => { resolve(true) },
              (_, e) => {
                console.log('* Transaction error message: ', e)
                throw new Error('* Failed to delete EVERYTHING from database')
              }
            )
          })

        } catch (e) {
          console.error('Error at delete_everythingFromDatabase: ', e.message)
          console.log(e)
          resolve(false)
        }
      })
    }
  }
}