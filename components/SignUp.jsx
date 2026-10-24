import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';

import React, { useState } from 'react';

import { auth, db } from '../firebaseConfig';

import {
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
} from 'firebase/auth';

import { doc, setDoc } from 'firebase/firestore';

import { SafeAreaView } from 'react-native-safe-area-context';


const Signup = ({ navigation, role }) => {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);


    // Admin signup is NOT allowed from the app.
    if (role === 'admin') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor="#eaf6ff"
                />

                <View style={styles.adminBlockedContainer}>

                    <Text style={styles.adminBlockedTitle}>
                        Admin Account
                    </Text>

                    <Text style={styles.adminBlockedText}>
                        Admin accounts cannot be created from the app.
                        Please contact the system administrator.
                    </Text>

                    <TouchableOpacity
                        style={styles.signupBtn}
                        onPress={() => navigation.navigate('AdminLogin')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.signupBtnText}>
                            Go to Admin Login
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backAdminBtn}
                    >
                        <Text style={styles.loginLink}>
                            ‹ Back
                        </Text>
                    </TouchableOpacity>

                </View>
            </SafeAreaView>
        );
    }


    const loginRoute =
        role === 'employee'
            ? 'EmployeeLogin'
            : 'ClientLogin';


    const handleSignup = async () => {

        // -----------------------------
        // VALIDATION
        // -----------------------------

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || !cleanEmail || !password || !confirmPassword) {
            Alert.alert(
                'Missing Fields',
                'Please fill in all fields.'
            );
            return;
        }

        if (cleanName.length < 2) {
            Alert.alert(
                'Invalid Name',
                'Please enter your full name.'
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(
                'Password Mismatch',
                'Passwords do not match.'
            );
            return;
        }

        if (password.length < 6) {
            Alert.alert(
                'Weak Password',
                'Password must be at least 6 characters.'
            );
            return;
        }


        setLoading(true);

        try {

            // -----------------------------
            // CREATE FIREBASE AUTH ACCOUNT
            // -----------------------------

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    cleanEmail,
                    password
                );

            const user = userCredential.user;


            // -----------------------------
            // UPDATE AUTH PROFILE
            // -----------------------------

            await updateProfile(user, {
                displayName: cleanName,
            });


            // -----------------------------
            // CREATE FIRESTORE PROFILE
            // -----------------------------

            await setDoc(
                doc(db, 'users', user.uid),
                {
                    name: cleanName,
                    email: cleanEmail,

                    // Only client / employee can
                    // be created through this screen.
                    role: role === 'employee'
                        ? 'employee'
                        : 'client',

                    // Employee requires admin approval.
                    approved: role === 'employee'
                        ? false
                        : true,

                    createdAt: new Date().toISOString(),
                }
            );


            // -----------------------------
            // EMPLOYEE FLOW
            // -----------------------------

            if (role === 'employee') {

                // Don't keep employee automatically logged in
                // while waiting for approval.
                await signOut(auth);

                Alert.alert(
                    'Signup Successful',
                    'Your employee account has been created and is waiting for admin approval.',
                    [
                        {
                            text: 'OK',
                            onPress: () =>
                                navigation.navigate(
                                    'EmployeeLogin'
                                ),
                        },
                    ]
                );

                return;
            }


            // -----------------------------
            // CLIENT FLOW
            // -----------------------------

            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: 'Home',
                    },
                ],
            });

        } catch (error) {

            console.log(
                'Signup Error:',
                error.code,
                error.message
            );

            let message =
                'Something went wrong. Please try again.';


            if (
                error.code ===
                'auth/email-already-in-use'
            ) {
                message =
                    'This email is already registered. Please login instead.';
            }

            else if (
                error.code ===
                'auth/invalid-email'
            ) {
                message =
                    'Please enter a valid email address.';
            }

            else if (
                error.code ===
                'auth/weak-password'
            ) {
                message =
                    'Password must be at least 6 characters.';
            }

            else if (
                error.code ===
                'auth/operation-not-allowed'
            ) {
                message =
                    'Email/Password authentication is not enabled in Firebase Console.';
            }

            else if (
                error.code ===
                'auth/network-request-failed'
            ) {
                message =
                    'Network error. Please check your internet connection.';
            }

            else if (
                error.code ===
                'permission-denied'
            ) {
                message =
                    'Unable to create your profile. Please check your account permissions.';
            }


            Alert.alert(
                'Signup Failed',
                message
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <SafeAreaView style={styles.safeArea}>

            <StatusBar
                barStyle="dark-content"
                backgroundColor="#eaf6ff"
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >

                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* BACK */}

                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                        disabled={loading}
                    >
                        <Text style={styles.backBtnText}>
                            ‹ Back
                        </Text>
                    </TouchableOpacity>


                    {/* HEADER */}

                    <View style={styles.logoWrap}>

                        <Text style={styles.welcomeText}>
                            {role === 'employee'
                                ? 'Employee Signup'
                                : 'Create Account'}
                        </Text>

                        <Text style={styles.subText}>
                            Sign up to get started
                        </Text>

                    </View>


                    {/* FORM */}

                    <View style={styles.formCard}>

                        {/* NAME */}

                        <Text style={styles.label}>
                            Full Name
                        </Text>

                        <View style={styles.inputWrapper}>

                            <TextInput
                                style={styles.input}
                                placeholder="Enter your name"
                                placeholderTextColor="#8fa8bf"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                editable={!loading}
                            />

                        </View>


                        {/* EMAIL */}

                        <Text style={styles.label}>
                            Email
                        </Text>

                        <View style={styles.inputWrapper}>

                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor="#8fa8bf"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />

                        </View>


                        {/* PASSWORD */}

                        <Text style={styles.label}>
                            Password
                        </Text>

                        <View style={styles.inputWrapper}>

                            <TextInput
                                style={styles.input}
                                placeholder="Create a password"
                                placeholderTextColor="#8fa8bf"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                            />

                            <TouchableOpacity
                                onPress={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >
                                <Text style={styles.toggleText}>
                                    {showPassword
                                        ? 'Hide'
                                        : 'Show'}
                                </Text>
                            </TouchableOpacity>

                        </View>


                        {/* CONFIRM PASSWORD */}

                        <Text style={styles.label}>
                            Confirm Password
                        </Text>

                        <View style={styles.inputWrapper}>

                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter your password"
                                placeholderTextColor="#8fa8bf"
                                value={confirmPassword}
                                onChangeText={
                                    setConfirmPassword
                                }
                                secureTextEntry={
                                    !showConfirmPassword
                                }
                                editable={!loading}
                            />

                            <TouchableOpacity
                                onPress={() =>
                                    setShowConfirmPassword(
                                        !showConfirmPassword
                                    )
                                }
                            >
                                <Text style={styles.toggleText}>
                                    {showConfirmPassword
                                        ? 'Hide'
                                        : 'Show'}
                                </Text>
                            </TouchableOpacity>

                        </View>


                        {/* SIGNUP */}

                        <TouchableOpacity
                            style={[
                                styles.signupBtn,
                                loading &&
                                styles.signupBtnDisabled,
                            ]}
                            activeOpacity={0.85}
                            onPress={handleSignup}
                            disabled={loading}
                        >

                            {loading ? (

                                <ActivityIndicator
                                    color="#ffffff"
                                />

                            ) : (

                                <Text style={styles.signupBtnText}>
                                    Sign Up
                                </Text>

                            )}

                        </TouchableOpacity>


                        {/* DIVIDER */}

                        <View style={styles.dividerRow}>

                            <View style={styles.dividerLine} />

                            <Text style={styles.dividerText}>
                                or
                            </Text>

                            <View style={styles.dividerLine} />

                        </View>


                        {/* GOOGLE */}

                        <TouchableOpacity
                            style={styles.googleBtn}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.googleBtnText}>
                                Continue with Google
                            </Text>
                        </TouchableOpacity>

                    </View>


                    {/* LOGIN */}

                    <View style={styles.loginWrap}>

                        <Text style={styles.loginText}>
                            Already have an account?{' '}
                        </Text>

                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate(
                                    loginRoute
                                )
                            }
                        >
                            <Text style={styles.loginLink}>
                                Log In
                            </Text>
                        </TouchableOpacity>

                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
};


export default Signup;


const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#eaf6ff',
    },

    container: {
        flexGrow: 1,
        backgroundColor: '#eaf6ff',
        paddingHorizontal: 24,
        paddingVertical: 30,
        justifyContent: 'center',
    },

    backBtn: {
        alignSelf: 'flex-start',
        padding: 8,
        marginBottom: 4,
    },

    backBtnText: {
        fontSize: 16,
        color: '#1e90ff',
        fontWeight: '600',
    },

    logoWrap: {
        alignItems: 'center',
        marginBottom: 26,
    },

    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0b3d5c',
    },

    subText: {
        fontSize: 14,
        color: '#5a7d94',
        marginTop: 4,
    },

    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        borderColor: '#d6ecfb',
        elevation: 3,
        shadowColor: '#1e90ff',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0b3d5c',
        marginBottom: 6,
        marginTop: 12,
    },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2faff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cfe9fb',
        paddingHorizontal: 14,
        height: 50,
    },

    input: {
        flex: 1,
        fontSize: 15,
        color: '#0b3d5c',
    },

    toggleText: {
        fontSize: 13,
        color: '#1e90ff',
        fontWeight: '600',
    },

    signupBtn: {
        backgroundColor: '#1e90ff',
        borderRadius: 14,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
        elevation: 3,
        shadowColor: '#1e90ff',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },

    signupBtnDisabled: {
        opacity: 0.7,
    },

    signupBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#dceefb',
    },

    dividerText: {
        marginHorizontal: 10,
        color: '#8fa8bf',
        fontSize: 13,
    },

    googleBtn: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cfe9fb',
    },

    googleBtnText: {
        color: '#0b3d5c',
        fontSize: 15,
        fontWeight: '600',
    },

    loginWrap: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 26,
    },

    loginText: {
        fontSize: 14,
        color: '#5a7d94',
    },

    loginLink: {
        fontSize: 14,
        color: '#1e90ff',
        fontWeight: 'bold',
    },

    adminBlockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },

    adminBlockedTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0b3d5c',
        marginBottom: 12,
    },

    adminBlockedText: {
        fontSize: 15,
        color: '#5a7d94',
        textAlign: 'center',
        lineHeight: 23,
        marginBottom: 25,
    },

    backAdminBtn: {
        marginTop: 18,
        padding: 10,
    },

});