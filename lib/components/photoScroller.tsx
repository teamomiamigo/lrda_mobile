import React, { useState } from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Button,
} from "react-native";
import {
  launchCameraAsync,
  MediaTypeOptions,
  requestCameraPermissionsAsync,
} from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Media, VideoType, PhotoType } from "../models/media_class";
import uuid from "react-native-uuid";
import { getThumbnail, convertHeicToJpg, uploadMedia } from "../utils/S3_proxy";
import LoadingImage from "./loadingImage";

function PhotoScroller({
  newMedia,
  setNewMedia,
}: {
  newMedia: Media[];
  setNewMedia: React.Dispatch<React.SetStateAction<Media[]>>;
}) {
  const [videoToPlay, setVideoToPlay] = useState("");
  const [imageToShow, setImageToShow] = useState("");
  const [type, setType] = useState("photo");
  const [playing, setPlaying] = useState(false);

  const handleImageSelection = async (result: {
    canceled?: false;
    assets: any;
  }) => {
    const { uri } = result.assets[0];
    console.log("Selected image URI: ", uri);

    if (uri.endsWith(".heic") || uri.endsWith(".HEIC")) {
      const jpgUri = await convertHeicToJpg(uri);
      const uploadedUrl = await uploadMedia(jpgUri, "image");
      console.log("After URL is retrieved from upload Media ", uploadedUrl);
      const newMediaItem = new PhotoType({
        uuid: uuid.v4().toString(),
        type: "image",
        uri: uploadedUrl,
      });
      setNewMedia([...newMedia, newMediaItem]);
    } else if (
      uri.endsWith(".jpg") ||
      uri.endsWith("png") ||
      uri.endsWith(".jpeg")
    ) {
      const uploadedUrl = await uploadMedia(uri, "image");
      console.log("I don't think it is getting here!!!!!!");
      console.log("After URL is retrieved from upload Media ", uploadedUrl);
      const newMediaItem = new PhotoType({
        uuid: uuid.v4().toString(),
        type: "image",
        uri: uploadedUrl,
      });
      setNewMedia([...newMedia, newMediaItem]);
    } else if (
      uri.endsWith(".MOV") ||
      uri.endsWith(".mov") ||
      uri.endsWith(".mp4")
    ) {
      const uploadedUrl = await uploadMedia(uri, "video");
      const thumbnail = await getThumbnail(uri);
      console.log("After URL is retrieved from upload Media ", uploadedUrl);
      const newMediaItem = new VideoType({
        uuid: uuid.v4().toString(),
        type: "video",
        uri: uploadedUrl,
        thumbnail: thumbnail,
        duration: "0:00",
      });
      setNewMedia([...newMedia, newMediaItem]);
    }
  };

  const goBig = (index: number) => {
    const currentMedia = newMedia[index];
    if (currentMedia.getType() === "video") {
      setType("video");
      setVideoToPlay(currentMedia.getUri());
      setPlaying(true);
    } else {
      setType("image");
      setImageToShow(currentMedia.getUri());
      setPlaying(true);
    }
  };

  const handleNewMedia = async () => {
    const { status } = await requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera permissions to make this work!");
      return;
    }

    console.log("Opening camera...");
    const cameraResult = await launchCameraAsync({
      mediaTypes: MediaTypeOptions.All,
      allowsEditing: false,
      aspect: [3, 4],
      quality: 0.75,
      videoMaxDuration: 300,
    });

    if (!cameraResult.canceled) {
      handleImageSelection(cameraResult);
    }
  };

  const handleDeleteMedia = (index: number) => {
    const updatedMedia = [...newMedia];
    updatedMedia.splice(index, 1);
    setNewMedia(updatedMedia);
  };

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: playing ? 100 : 0,
          marginTop: playing ? 30 : 0,
          height: playing ? "auto" : 110,
        },
      ]}
    >
      {playing && type === "video" ? (
        <View style={styles.miniContainer}>
          <Button
            title="Close Viewer"
            onPress={() => setPlaying(false)}
          ></Button>
          <Video
            source={{ uri: videoToPlay }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            useNativeControls
            isLooping
            style={styles.video}
          />
        </View>
      ) : playing && type === "image" ? (
        <View style={styles.miniContainer}>
          <Button
            title="Close Viewer"
            onPress={() => setPlaying(false)}
          ></Button>
          <Image source={{ uri: imageToShow }} style={styles.video} />
        </View>
      ) : (
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.image,
              {
                backgroundColor: "rgb(240,240,240)",
                justifyContent: "center",
              },
            ]}
            onPress={handleNewMedia}
          >
            <Ionicons
              style={{ alignSelf: "center" }}
              name="camera-outline"
              size={60}
              color="#111111"
            />
          </TouchableOpacity>
          {newMedia?.map((media, index) => {
            const ImageType = media?.getType();
            let ImageURI = "";
            let IsImage = false;
            if (ImageType === "image") {
              ImageURI = media.getUri();
              IsImage = true;
            } else if (ImageType === "video") {
              ImageURI = (media as VideoType).getThumbnail();
              IsImage = true;
            }
            return (
              <View key={index}>
                <TouchableOpacity
                  style={styles.trash}
                  onPress={() => handleDeleteMedia(index)}
                >
                  <Ionicons
                    style={{ alignSelf: "center" }}
                    name="trash-outline"
                    size={20}
                    color="#111111"
                  />
                </TouchableOpacity>
                <TouchableOpacity key={index} onPress={() => goBig(index)}>
                  <View
                    style={{ alignSelf: "center", height: 100, width: 100 }}
                  >
                    <LoadingImage
                      imageURI={ImageURI}
                      type={media?.getType()}
                      isImage={true}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

export default PhotoScroller;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginBottom: 10,
    width: "100%",
    justifyContent: "center",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginRight: 5,
  },
  trash: {
    position: "absolute",
    zIndex: 99,
    height: "20%",
    width: "20%",
    backgroundColor: "red",
    borderRadius: 10,
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignSelf: "center",
  },
  miniContainer: {
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
});
