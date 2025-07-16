import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { register as registerApi } from '../../services/auth';
import { AuthContext } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  // Pharmacy fields
  const [pharmacyName, setPharmacyName] = useState('');
  const [address, setAddress] = useState('');
  const [lga, setLga] = useState('');
  const [state, setState] = useState('');
  const [ward, setWard] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  // User fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRegister = async () => {
    setError('');
    if (!pharmacyName || !address || !lga || !state || !ward || !phone || !licenseNumber || !latitude || !longitude || !name || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const pharmacy = {
        name: pharmacyName,
        address,
        lga,
        state,
        ward,
        phone,
        licenseNumber,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
      const user = { name, email, password };
      const data = await registerApi(pharmacy, user);
      await login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1ABA7F', '#225F91']} style={styles.gradientBg}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.centered, { opacity: fadeAnim }]}> 
            <Text style={styles.title}>Register</Text>
            <Text style={styles.subtitle}>Create a new pharmacy account.</Text>
            <Text style={styles.section}>Pharmacy Details</Text>
            <TextInput style={styles.input} placeholder="Pharmacy Name" value={pharmacyName} onChangeText={setPharmacyName} placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="LGA" value={lga} onChangeText={setLga} placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="State" value={state} onChangeText={setState} placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="Ward" value={ward} onChangeText={setWard} placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="License Number" value={licenseNumber} onChangeText={setLicenseNumber} placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" placeholderTextColor="#7FB7A3" />
            <Text style={styles.section}>Manager Details</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#7FB7A3" />
            <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor="#7FB7A3" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
              <Text style={styles.link}>Already have an account? Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height,
    width,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(34,95,145,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 17,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 24,
    textShadowColor: 'rgba(34,95,145,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  section: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8, alignSelf: 'flex-start', color: '#fff', textShadowColor: 'rgba(26,186,127,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  input: {
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    color: '#1A2A3A',
  },
  button: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#225F91',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#1ABA7F',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#fff', backgroundColor: 'rgba(220,53,69,0.85)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12, textAlign: 'center', fontWeight: 'bold', fontSize: 15, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: {width:0, height:1}, textShadowRadius: 2 },
  link: { color: '#1ABA7F', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
}); 