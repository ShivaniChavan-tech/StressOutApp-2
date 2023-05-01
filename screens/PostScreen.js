import React, { useState } from 'react';
import { Button, Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
    const userID = auth.currentUser.uid;

    try {
      // Compress the image
      const compressedImage = await manipulateAsync(imageUri, [{ resize: { width: 500 } }], {
        compress: 0.5,
        format: 'jpeg',
        base64: false,
      });

      const response = await fetch(compressedImage.uri);
      const blob = await response.blob();
      const filename = compressedImage.uri.split('/').pop();
      const storageRef = ref(storage, `${userID}/${filename}`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      console.log('Download URL:', downloadURL);
      alert('Image uploaded successfully!');
      setImageUri(null);
    } catch (error) {
      console.error(error);
      alert('An error occurred while uploading the image.');
    }
  };

  return (
    <View>
      {imageUri && <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} />}
      <Button title="Pick Image from Gallery" onPress={handleImagePickPress} />
      <Button title="Take Photo with Camera" onPress={handleCameraPress} />
      <Button title="Upload Image" onPress={handleUploadPress} />
    </View>
  );
};

export default PostScreen;
