import React, { useState } from 'react';
import { View, Button, Image, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const PostScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);

  const askPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll and camera permissions to make this work!');
    }

    const { mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaStatus !== 'granted') {
      alert('Sorry, we need media library permissions to make this work!');
    }
  };

  const pickImage = async () => {
    await askPermissions();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaType: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.uri);
    }
  };

  const takePicture = async () => {
    await askPermissions();

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setImage(`data:image/png;base64,${result.base64}`);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      alert('Please select an image first!');
      return;
    }

    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage();

    // Get the current user ID and a reference to the user document in Firestore
    const user = auth.currentUser;
    const userRef = doc(db, 'users', user.uid);

    try {
      // Upload the image to Firebase Storage
      const fileExtension = image.split('.').pop();
      const storageRef = ref(
        storage,
        `images/${user.uid}/${Date.now()}.${fileExtension}`
      );
      const response = await uploadBytes(storageRef, image, { contentType: 'image/jpeg' });

      // Get the download URL of the uploaded image
      const imageUrl = await getDownloadURL(response.ref);

      // Update the user document with the image URL
      await updateDoc(userRef, { imageUrl });
      console.log('Image URL stored in Firestore successfully!');

      // Navigate back to the previous screen
      navigation.goBack();

    } catch (error) {
      console.error('Error storing image URL in Firestore: ', error);
    }
  };

  return (
    <View style={styles.container}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.buttonContainer}>
        <Button title="Take Picture" onPress={takePicture} />
        <Button title="Pick Image" onPress={pickImage} />
      </View>
      <Button title="Upload" onPress={handleUpload} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
  },
});

export default PostScreen;