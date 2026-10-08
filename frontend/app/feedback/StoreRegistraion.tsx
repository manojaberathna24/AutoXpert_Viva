import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from '../../constants';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import Layout from '../layout';

type Coordinate = {
  latitude: number;
  longitude: number;
};

const StoreRegistrationScreen = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mapslink, setMapslink] = useState('');
  const [locationId, setLocationId] = useState('L1'); // Default to Colombo
  const [location, setLocation] = useState<Coordinate | null>({ latitude: 6.9271, longitude: 79.8612 }); // Default to Colombo

  // Security Questions
  const [q1, setQ1] = useState('What is your mother\'s maiden name?');
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState('What was the name of your first pet?');
  const [a2, setA2] = useState('');
  const [q3, setQ3] = useState('What was the name of your primary school?');
  const [a3, setA3] = useState('');

  const securityQuestionsList = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What was the name of your primary school?",
    "In what city were you born?",
    "What is your favorite book?",
    "What was your first car?",
    "What is your father's middle name?"
  ];

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to register your store.');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to get location.');
      }
    })();
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!storeName || !storeType || !contactNumber || !email || !password || !confirmPassword) {
        Alert.alert('Missing Fields', 'Please fill all required fields.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return;
      }
    } else if (step === 2) {
        if (!storeDescription || !locationId) {
            Alert.alert('Missing Fields', 'Please provide a description and area.');
            return;
        }
    }

    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!a1 || !a2 || !a3) {
      Alert.alert('Missing Answers', 'Please answer all security questions.');
      return;
    }

    const formData = {
      store_name: storeName,
      store_type: storeType,
      store_description: storeDescription,
      contact_number: contactNumber,
      email: email.toLowerCase(),
      password,
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      mapslink,
      location_id: locationId,
      q1, a1, q2, a2, q3, a3
    };

    try {
      const fetchUrl = `${BASE_URL}/api/register`;
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message, [
          { text: 'OK', onPress: () => router.push('/feedback/LoginScreen') },
        ]);
      } else {
        Alert.alert('Registration Failed', data.message || 'Unable to register.');
      }
    } catch (error: any) {
      console.error("Registration Error:", error);
      Alert.alert('Error', 'Failed to connect to server.');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {[1, 2, 3].map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => {
              if (s < step) setStep(s);
          }}
          style={[styles.stepCircle, step === s && styles.activeStep, step > s && styles.completedStep]}>
          <Text style={[styles.stepText, step >= s && styles.activeStepText]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Store Registration</Text>
        {renderStepIndicator()}

        {step === 1 && (
          <>
            <Text style={styles.label}>Store Name</Text>
            <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} />

            <Text style={styles.label}>Store Type</Text>
            <TextInput style={styles.input} value={storeType} onChangeText={setStoreType} />

            <Text style={styles.label}>Contact Number</Text>
            <TextInput style={styles.input} value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.label}>District / Operating Area</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={locationId} onValueChange={(v) => setLocationId(v)}>
                <Picker.Item label="Colombo" value="L1" />
                <Picker.Item label="Kandy" value="L2" />
                <Picker.Item label="Galle" value="L3" />
                <Picker.Item label="Gampaha" value="L4" />
              </Picker>
            </View>

            <Text style={styles.label}>Store Description</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={storeDescription}
              onChangeText={setStoreDescription}
              multiline
              placeholder="Describe your services..."
            />

            <Text style={styles.label}>Google Maps Link</Text>
            <TextInput
              style={styles.input}
              value={mapslink}
              onChangeText={setMapslink}
              placeholder="Paste Google Maps URL here"
            />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.infoText}>These questions will help you recover your password if you forget it.</Text>
            
            <Text style={styles.label}>Security Question 1</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={q1} onValueChange={(v) => setQ1(v)}>
                {securityQuestionsList.map(q => <Picker.Item key={q} label={q} value={q} />)}
              </Picker>
            </View>
            <TextInput style={styles.input} placeholder="Your Answer" value={a1} onChangeText={setA1} />

            <Text style={styles.label}>Security Question 2</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={q2} onValueChange={(v) => setQ2(v)}>
                {securityQuestionsList.map(q => <Picker.Item key={q} label={q} value={q} />)}
              </Picker>
            </View>
            <TextInput style={styles.input} placeholder="Your Answer" value={a2} onChangeText={setA2} />

            <Text style={styles.label}>Security Question 3</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={q3} onValueChange={(v) => setQ3(v)}>
                {securityQuestionsList.map(q => <Picker.Item key={q} label={q} value={q} />)}
              </Picker>
            </View>
            <TextInput style={styles.input} placeholder="Your Answer" value={a3} onChangeText={setA3} />
          </>
        )}

        <View style={styles.buttonGroup}>
          {step > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
              <Text style={styles.secondaryText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity style={styles.submitButton} onPress={handleNext}>
              <Text style={styles.submitButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Register</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center' },
  stepContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccc',
    justifyContent: 'center', alignItems: 'center', marginHorizontal: 6,
  },
  activeStep: { backgroundColor: '#007bff' },
  completedStep: { backgroundColor: '#28a745' },
  stepText: { color: '#000', fontWeight: 'bold' },
  activeStepText: { color: '#fff' },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: {
    borderWidth: 1, padding: 10, borderRadius: 8, marginTop: 5,
    marginBottom: 10, borderColor: '#aaa',
  },
  pickerContainer: { borderWidth: 1, borderColor: '#aaa', borderRadius: 8, marginTop: 5, marginBottom: 10 },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  submitButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 10, flex: 1, alignItems: 'center', marginLeft: 10 },
  submitButtonText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#eee', padding: 15, borderRadius: 10, flex: 1, alignItems: 'center', marginRight: 10 },
  secondaryText: { color: '#333', fontWeight: 'bold' },
});

export default StoreRegistrationScreen;
