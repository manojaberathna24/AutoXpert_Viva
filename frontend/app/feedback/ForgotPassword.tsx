import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Layout from '../layout';
import { BASE_URL } from '../../constants';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Questions fetched from the database for this specific user
  const [questions, setQuestions] = useState({ q1: '', q2: '', q3: '' });
  
  // User answers input
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [a3, setA3] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleFetchQuestions = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email to find your account.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/forgot-password/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Here we set the actual questions the user chose during registration
        if (data.q1 && data.q2 && data.q3) {
            setQuestions({ q1: data.q1, q2: data.q2, q3: data.q3 });
            setStep(2);
        } else {
            Alert.alert('Incomplete Profile', 'This account does not have security questions set. Please contact support.');
        }
      } else {
        Alert.alert('Not Found', data.message || 'We couldn\'t find an account with that email.');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to reach the server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!a1 || !a2 || !a3 || !newPassword || !confirmPassword) {
      Alert.alert('Required', 'Please answer all questions and enter a new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          a1: a1.trim(),
          a2: a2.trim(),
          a3: a3.trim(),
          new_password: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Your password has been reset. You can now login with your new password.', [
          { text: 'Login Now', onPress: () => router.replace('/feedback/LoginScreen') }
        ]);
      } else {
        Alert.alert('Verification Failed', data.message || 'One or more answers are incorrect.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Password Recovery</Text>

          {loading && <ActivityIndicator size="large" color="#007BFF" style={{ marginVertical: 10 }} />}

          {step === 1 && (
            <>
              <Text style={styles.infoText}>Enter your email to verify your identity through security questions.</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Registered Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. owner@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleFetchQuestions}>
                <Text style={styles.buttonText}>Verify Email</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.infoText}>Please provide the answers you set during registration.</Text>
              
              <View style={styles.questionSection}>
                <Text style={styles.questionLabel}>{questions.q1}</Text>
                <TextInput style={styles.input} value={a1} onChangeText={setA1} placeholder="Your answer" />
              </View>

              <View style={styles.questionSection}>
                <Text style={styles.questionLabel}>{questions.q2}</Text>
                <TextInput style={styles.input} value={a2} onChangeText={setA2} placeholder="Your answer" />
              </View>

              <View style={styles.questionSection}>
                <Text style={styles.questionLabel}>{questions.q3}</Text>
                <TextInput style={styles.input} value={a3} onChangeText={setA3} placeholder="Your answer" />
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionHeader}>New Password</Text>
              <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Enter new password" />
              <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Confirm new password" />

              <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyAndReset}>
                <Text style={styles.buttonText}>Update Password</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.textButton} onPress={() => setStep(1)}>
                <Text style={styles.textButtonLabel}>Change Email</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => router.push('/feedback/LoginScreen')}>
            <Text style={styles.loginLink}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20 },
  card: { width: '100%', backgroundColor: 'white', padding: 25, borderRadius: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a', textAlign: 'center' },
  infoText: { fontSize: 15, color: '#666', marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  inputGroup: { width: '100%', marginBottom: 15 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6 },
  questionSection: { marginBottom: 20, width: '100%' },
  questionLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 15, color: '#007BFF', textAlign: 'center' },
  input: {
    width: '100%', borderWidth: 1.5, borderColor: '#eee', borderRadius: 12,
    padding: 14, backgroundColor: '#fcfcfc', fontSize: 16, color: '#333'
  },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  primaryButton: { backgroundColor: '#007BFF', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#007BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  textButton: { marginTop: 15, padding: 10, alignItems: 'center' },
  textButtonLabel: { color: '#888', fontWeight: 'bold', fontSize: 14 },
  loginLink: { color: '#007BFF', marginTop: 30, fontSize: 16, textAlign: 'center', fontWeight: '600' },
});

export default ForgotPasswordScreen;
