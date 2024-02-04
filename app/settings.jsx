import { StyleSheet, View, Text, Pressable, Alert } from "react-native";
import { Stack } from "expo-router";
import { useImmer } from "use-immer";
import React, { useContext, useEffect, useState } from "react";
import { Settings as _Settings } from "../js/Settings";
import { Context } from "../js/Context";
import { Picker } from "@react-native-picker/picker";

const Conversions = {
  days: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
};

export default function Settings() {
  const { bus, setBus } = useContext(Context);
  const { settings, time } = bus;

  const [page, setPage] = useImmer({
    deleteId: null,
    allDataArray: [],
  });
  console.log("----------- Running Settings -----------");

  useEffect(() => {
    setup({ db: time.db, setPage });
  }, []);

  // useEffect(() => {
  //   setPage({
  //     ...page,
  //     workWeekStarts: settings.workWeekStarts,
  //   });
  // }, [settings]);

  const dateObject =
    page.deleteId === null
      ? null
      : time.manipFuncs.millisToDateObj(
          page.allDataArray[
            page.allDataArray.findIndex((item) => {
              if (item.Id === page.deleteId) {
                console.log("item.Id == page.deleteId");
                return true;
              } else return false;
            })
          ].Start
        );

  return (
    <View style={styles.container}>
      {/* Work week test */}
      <View style={styles.settingItem}>
        <Text style={[styles.text]}>
          Work week starts: {time.usefulArrays.days[settings.workWeekStarts]}
        </Text>
        <Pressable
          style={[styles.button, styles.testButton]}
          onPress={() => {
            console.log("cp0");
            console.log(settings);
            console.log(setBus);
            console.log(setPage);
            incrementWorkWeekStart({ settings, setBus, setPage });
          }}
        >
          <Text style={[styles.text, { fontSize: 18 }]}>+</Text>
        </Pressable>
      </View>

      {/* Delete all data in database */}
      <View style={styles.settingItem}>
        <Text style={[styles.text]}>
          Delete all data in database ({page.allDataArray.length})
        </Text>
        <Pressable
          style={[styles.button, styles.deleteButton]}
          onPress={() => deleteAllFromDatabase({ bus, setBus, db: time.db })}
        >
          <Text style={{ color: "red" }}>Delete</Text>
        </Pressable>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.text}> Delete item with Id</Text>
        <Picker
          selectedValue={page.deleteId}
          onValueChange={(val) => {
            setPage((draft) => {
              draft.deleteId = val;
            });
          }}
          style={{ color: "orange" }}
          dropdownIconColor={"white"}
        >
          {page.allDataArray.map((item, index) => {
            // @ts-ignore
            return <Picker.Item key={index} label={item.Id} value={item.Id} />;
          })}
        </Picker>
        {dateObject === null ? null : (
          <View style={{ flexDirection: "row" }}>
            <Text style={{ color: "orange" }}>
              {time.usefulArrays.months[dateObject.month]} {dateObject.day}
            </Text>
            <Text style={{ color: "orange", marginHorizontal: 20 }}>-</Text>
            <Text style={{ color: "orange" }}>
              {dateObject.hour}:{dateObject.minute}
            </Text>
          </View>
        )}
        <Pressable
          style={[styles.deleteButton, styles.button]}
          onPress={() =>
            deleteItemWithId({ db: time.db, id: page.deleteId, setPage, page })
          }
        >
          <Text style={{ color: "red" }}>Delete</Text>
        </Pressable>
      </View>

      {/* Log all data in database */}
      <View style={styles.settingItem}>
        <Text style={[styles.text]}>Log all data in the database</Text>
        <Pressable
          style={[styles.logButton, styles.button]}
          onPress={() => logAllFromDatabase({ time })}
        >
          <Text style={{ color: "white" }}>Log</Text>
        </Pressable>
      </View>
    </View>
  );
}

async function setup({ db, setPage }) {
  const allDataArray = await db.getData.getAllFromDb();

  setPage((draft) => {
    draft.allDataArray = allDataArray;
    draft.deleteId = allDataArray[0].Id;
  });
}

function incrementWorkWeekStart({ settings, setBus, setPage }) {
  const getValue = (oldVal) => (oldVal < 6 ? oldVal + 1 : 0);

  changeSetting({
    key: "workWeekStarts",
    value: getValue(settings.workWeekStarts),
    setBus,
    setPage,
  });
}

function changeSetting({ key, value, setBus, setPage }) {
  setPage((draft) => {
    draft[key] = value;
    setBus((d2) => {
      d2.settings = draft;
    });
  });
}

async function deleteAllFromDatabase({ bus, setBus, db }) {
  const deleteAllDataConfirmationAlert = () => {
    return new Promise((resolve) => {
      Alert.alert(
        "Delete All Data",
        "Are you sure you want to delete all data from the database?",
        [
          {
            text: "Yes",
            onPress: () => {
              resolve(true);
            },
          },
          {
            text: "No",
            onPress: () => {
              resolve(false);
            },
          },
        ]
      );
    });
  };

  if (await deleteAllDataConfirmationAlert()) {
    bus.time.resetClock();
    const res = await db.deleteData.delete_everythingFromDatabase();

    if (!res) alert("Failed to delete data");
    else {
      console.warn(" ************ Sucessfully delete everything ************ ");
      console.log(" ");
      console.log(" ");
      console.log(" ");
      console.log(" ");
      alert("Sucessfully deleted all data");
      setBus((draft) => {
        draft.screen = {};
        draft.time = {};
        draft.animations = {};
        draft.settings = {};
        draft.loaded = false;
        draft.setup = false;
      });
    }
  }
}
async function deleteItemWithId({ id, db, setPage, page }) {
  if (!(await db.deleteData.delete_withId(id)))
    return alert("Failed to delete item with id " + id);
  else alert("Sucessfully delete item with id " + id);

  let i = -1;
  page.allDataArray.find((item, index) => {
    if (item.Id !== id) return false;
    else {
      i = index;
      return true;
    }
  });

  setPage((draft) => {
    draft.allDataArray.splice(i, 1);
    draft.deleteId = draft.allDataArray[0].Id;
  });
}
async function logAllFromDatabase({ time }) {
  const results = await time.db.getData.getAllFromDb();

  results.forEach((item, index) => {
    const formattedTime = time.manipFuncs.millisToDateObj(item.Start);
    console.log("All items in database, #", index, ": ", item);
    console.log("Formatted: ", formattedTime);
    console.log(" ");
  });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
    padding: 5,
  },
  settingItem: {
    borderBottomWidth: 1,
    borderColor: "gray",
    marginTop: 20,
    paddingBottom: 10,
  },
  text: {
    color: "white",
  },
  testButton: {
    borderWidth: 1,
    borderColor: "green",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "green",
  },
  logButton: {
    borderWidth: 1,
    borderColor: "green",
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 40,
    width: 100,
  },
});
