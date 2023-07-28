import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  SafeAreaView,
  Image,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Camera } from "expo-camera";
import { shareAsync } from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import MapScreen from "./MapScreen";

function App() {
  let cameraRef = useRef();
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState();
  const [photo, setPhoto] = useState();

  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission =
        await MediaLibrary.requestPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === "granted");
      setHasMediaLibraryPermission(mediaLibraryPermission.status === "granted");
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "PhotoLoc",
          "Something went wrong! Please give location permission."
        );
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  let getLocationFromGoogleMaps = async () => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=AIzaSyBz9qsD8o4BnLRDlwicKYe4AOS_5cn4LuY`
      );
      const data = await response.json();
      console.log("Google Maps API Response:", data);
    } catch (error) {
      console.error("Error fetching location from Google Maps API:", error);
    }
  };

  if (hasCameraPermission === undefined) {
    return <Text>Requesting permissions...</Text>;
  } else if (!hasCameraPermission) {
    return (
      <Text>
        Permission for camera not granted. Please change this in settings.
      </Text>
    );
  }

  let takePicture = async () => {
    let options = {
      quality: 1,
      base64: true,
      exif: true,
    };

    let newPhoto = await cameraRef.current.takePictureAsync(options);

    if (location) {
      newPhoto.exif.GPSLatitude = location.coords.latitude;
      newPhoto.exif.GPSLongitude = location.coords.longitude;
    }
    setPhoto(newPhoto);
    setLocation(location);
  };

  if (photo) {
    let sharePicture = () => {
      shareAsync(photo.uri).then(() => {
        setPhoto(undefined);
      });
    };

    let savePhoto = async () => {
      if (photo) {
        try {
          let asset = await MediaLibrary.createAssetAsync(photo.uri, {
            exif: photo.exif,
          });
          if (asset) {
            Alert.alert("PhotoLoc", "Success!");
          }
        } catch (error) {
          Alert.alert("PhotoLoc", "Something went wrong!");
        }
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <Image
          style={styles.preview}
          source={{ uri: "data:image/jpg;base64," + photo.base64 }}
        />
        <View style={styles.mapContainer}>
          <MapScreen location={location} />
        </View>

        <View style={styles.bottomContainer}>
          <Button title="Share" onPress={sharePicture} />
          {hasMediaLibraryPermission && (
            <Button title="Save" onPress={savePhoto} />
          )}
          <Button title="Discard" onPress={() => setPhoto(undefined)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Camera style={styles.container} ref={cameraRef}>
      <View style={styles.button_container}>
        <Button title="Take Picture" onPress={takePicture} />
      </View>
      <StatusBar style="auto" />
      {photo && (
        <View>
          <Image
            style={styles.preview}
            source={{ uri: "data:image/jpg;base64," + photo.base64 }}
          />
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              Latitude: {location.coords.latitude}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {location.coords.longitude}
            </Text>
            <Button
              title="Get Location from Google Maps"
              onPress={getLocationFromGoogleMaps}
            />
          </View>
        </View>
      )}
    </Camera>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button_container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    alignSelf: "flex-end",
  },
  preview: {
    alignSelf: "stretch",
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    width: "100%",
  },
});

export default App;
