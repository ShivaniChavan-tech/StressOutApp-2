import React, { useState } from 'react';
import { Button, Image, View, Text,ScrollView, TouchableHighlight,StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { manipulateAsync } from 'expo-image-manipulator';

const PostScreen = () => {
  const [imageUri, setImageUri] = useState(null);

  const handleImagePickerResult = (result) => {
    if (!result.cancelled) {
      setImageUri(result.uri);
    }
  };

  const handleImagePickPress = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      handleImagePickerResult(result);
    } catch (error) {
      console.error(error);
      alert('An error occurred while picking the image.');
    }
  };

  const handleCameraPress = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });

      handleImagePickerResult(result);
    } catch (error) {
      console.error(error);
      alert('An error occurred while taking the photo.');
    }
  };

  const handleUploadPress = async () => {
    if (!imageUri) {
      alert('Please select an image to upload!');
      return;
    }
  
    const auth = getAuth();
const storage = getStorage();
const db = getFirestore();
const userID = auth.currentUser.uid;
const userRef = doc(db, 'users', userID);

try {
  // Compress the image
  const compressedImage = await manipulateAsync(imageUri, [{ resize: { width: 500 } }], {
    compress: 0.5,
    format: 'jpeg',
    base64: false,
  });
  if (!compressedImage || !compressedImage.uri) {
    alert('An error occurred while compressing the image.');
    return;
  }
  const compressedImageUri = compressedImage.uri; // Rename the new variable here
  if (!compressedImageUri) {
    alert('An error occurred while compressing the image.');
    return;
  }

  const response = await fetch(compressedImageUri);
  if (!response.ok) {
    alert(`An error occurred while uploading the image: ${response.status}`);
    return;
  }

  const blob = await response.blob();
  const filename = compressedImageUri.split('/').pop();
  const storageRef = ref(storage, `${userID}/${filename}`);
  await uploadBytes(storageRef, blob);

  const downloadURL = await getDownloadURL(storageRef);

  console.log('Download URL:', downloadURL);

  await updateDoc(userRef, { downloadURL });
  console.log('Image URL stored in Firestore successfully!');
  alert('Image uploaded successfully!');
  setImageUri(null);
} catch (error) {
  console.error(error);
  alert('An error occurred while uploading the image.');
}

  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
      {imageUri && <Image source={{ uri: imageUri }} style={{ width: 300, height: 300, marginTop: 150}} />}
      </View>
      <View style={styles.buttonContainer}>
          <TouchableHighlight 
              onPress={() => { 
                handleImagePickPress();
              }}
          >
                  <View style={styles.button}> 
                      <Text style={styles.buttonText}>Pick Image from Gallery</Text>
                  </View>
          </TouchableHighlight>
      </View>
      <View style={styles.buttonContainer}>
          <TouchableHighlight 
              onPress={() => { 
                handleCameraPress();
              }}
          >
                  <View style={styles.button}> 
                      <Text style={styles.buttonText}>Take Photo with Camera</Text>
                  </View>
          </TouchableHighlight>
      </View>
      <View style={styles.buttonContainer}>
          <TouchableHighlight 
              onPress={() => { 
                handleUploadPress();
              }}
          >
                  <View style={styles.button}> 
                      <Text style={styles.buttonText}>Upload</Text>
                  </View>
          </TouchableHighlight>
      </View>
      </ScrollView>

  );
};

export default PostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 150,
    backgroundColor: 'black'
},
  buttonContainer: {
    margin: 10,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#ff8c00',
    height: 50,
    width: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
