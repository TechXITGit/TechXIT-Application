import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';

import React, { useState } from 'react';

import { auth, db } from '../firebaseConfig';

import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
} from 'firebase/auth';

import {
    doc,
    getDoc,
} from 'firebase/firestore';

import { SafeAreaView } from 'react-native-safe-area-context';


const Login = ({ navigation, role }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.alert) {
                window.alert(`${title}: ${message}`);
            }
        } else {
            Alert.alert(title, message);
        }
    };

    const handleLogin = async () => {
        setErrorMessage('');

        const cleanEmail = email.trim().toLowerCase();


        // -----------------------------
        // VALIDATION
        // -----------------------------

        if (!cleanEmail || !password) {
            const msg = 'Please enter both email and password.';
            setErrorMessage(msg);
            showAlert('Missing Fields', msg);
            return;
        }


        setLoading(true);


        try {

            // -----------------------------
            // FIREBASE AUTH LOGIN
            // -----------------------------

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    cleanEmail,
                    password
                );

            const user = userCredential.user;


            // -----------------------------
            // GET FIRESTORE PROFILE
            // -----------------------------

            const userDocRef =
                doc(db, 'users', user.uid);

            const userDocSnap =
                await getDoc(userDocRef);


            if (!userDocSnap.exists()) {
                await signOut(auth);
                const msg = 'Your account profile was not found. Please contact support.';
                setErrorMessage(msg);
                showAlert('Account Error', msg);
                return;
            }

            const userData = userDocSnap.data();

            // -----------------------------
            // ROLE CHECK
            // -----------------------------

            if (!userData.role) {
                await signOut(auth);
                const msg = 'Your account does not have a valid role.';
                setErrorMessage(msg);
                showAlert('Account Error', msg);
                return;
            }

            if (userData.role !== role) {
                await signOut(auth);
                const correctRole =
                    userData.role.charAt(0).toUpperCase() +
                    userData.role.slice(1);
                const msg = `This account is registered as ${correctRole}. Please use the ${correctRole} login.`;
                setErrorMessage(msg);
                showAlert('Access Denied', msg);
                return;
            }

            // -----------------------------
            // EMPLOYEE APPROVAL CHECK
            // -----------------------------

            if (
                role === 'employee' &&
                userData.approved !== true
            ) {
                await signOut(auth);
                const msg = 'Your employee account is waiting for admin approval. Please contact admin.';
                setErrorMessage(msg);
                showAlert('Pending Approval', msg);
                return;
            }

            // -----------------------------
            // ADMIN CHECK
            // -----------------------------

            if (role === 'admin') {
                if (userData.role !== 'admin') {
                    await signOut(auth);
                    const msg = 'You do not have admin access.';
                    setErrorMessage(msg);
                    showAlert('Access Denied', msg);
                    return;
                }
            }


            // -----------------------------
            // NAVIGATION
            // -----------------------------

            if (role === 'admin') {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'AdminHome', params: { screen: 'Home' } }],
                });
            } else if (role === 'employee') {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'EmployeeHome', params: { screen: 'Home' } }],
                });
            } else {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }


        } catch (error) {

            console.log(
                'Login Error:',
                error.code,
                error.message
            );


            let message =
                'Something went wrong. Please try again.';


            if (
                error.code ===
                'auth/invalid-email'
            ) {
                message =
                    'Please enter a valid email address.';
            }

            else if (
                error.code ===
                'auth/user-not-found'
            ) {
                message =
                    'No account found with this email.';
            }

            else if (
                error.code ===
                'auth/wrong-password'
            ) {
                message =
                    'Incorrect password.';
            }

            else if (
                error.code ===
                'auth/invalid-credential'
            ) {
                message =
                    'Invalid email or password.';
            }

            else if (
                error.code ===
                'auth/user-disabled'
            ) {
                message =
                    'This account has been disabled.';
            }

            else if (
                error.code ===
                'auth/too-many-requests'
            ) {
                message =
                    'Too many login attempts. Please try again later.';
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


            setErrorMessage(message);

            showAlert(
                'Login Failed',
                message
            );

        } finally {

            setLoading(false);

        }
    };


    // -----------------------------
    // FORGOT PASSWORD
    // -----------------------------

    const handleForgotPassword = async () => {

        const cleanEmail = email.trim().toLowerCase();


        if (!cleanEmail) {

            showAlert(
                'Enter Email',
                'Please enter your email address first.'
            );

            return;
        }


        try {

            await sendPasswordResetEmail(
                auth,
                cleanEmail
            );

            showAlert(
                'Password Reset',
                'A password reset link has been sent to your email.'
            );

        } catch (error) {

            console.log(
                'Password Reset Error:',
                error.code,
                error.message
            );


            let message =
                'Unable to send password reset email.';


            if (
                error.code ===
                'auth/user-not-found'
            ) {
                message =
                    'No account found with this email.';
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
                'auth/network-request-failed'
            ) {
                message =
                    'Network error. Please check your internet connection.';
            }


            showAlert(
                'Reset Password',
                message
            );
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

                <View style={styles.container}>


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

                            {role === 'admin'
                                ? 'Admin Login'
                                : role === 'employee'
                                    ? 'Employee Login'
                                    : 'Welcome Back'}

                        </Text>

                        <Text style={styles.subText}>
                            Login to continue
                        </Text>

                    </View>


                    {/* FORM */}

                    <View style={styles.formCard}>

                        {/* ERROR BANNER */}
                        {errorMessage ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorBannerText}>
                                    ⚠️ {errorMessage}
                                </Text>
                            </View>
                        ) : null}

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
                                placeholder="Enter your password"
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


                        {/* FORGOT PASSWORD */}

                        <TouchableOpacity
                            style={styles.forgotWrap}
                            onPress={handleForgotPassword}
                            disabled={loading}
                        >

                            <Text style={styles.forgotText}>
                                Forgot Password?
                            </Text>

                        </TouchableOpacity>


                        {/* LOGIN */}

                        <TouchableOpacity
                            style={[
                                styles.loginBtn,
                                loading &&
                                styles.loginBtnDisabled,
                            ]}
                            activeOpacity={0.85}
                            onPress={handleLogin}
                            disabled={loading}
                        >

                            {loading ? (

                                <ActivityIndicator
                                    color="#ffffff"
                                />

                            ) : (

                                <Text style={styles.loginBtnText}>
                                    Log In
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


                    {/* SIGNUP */}

                    {role !== 'admin' && (

                        <View style={styles.signupWrap}>

                            <Text style={styles.signupText}>
                                Don't have an account?{' '}
                            </Text>

                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate(
                                        role === 'employee'
                                            ? 'EmployeeSignup'
                                            : 'ClientSignup'
                                    )
                                }
                            >

                                <Text style={styles.signupLink}>
                                    Sign Up
                                </Text>

                            </TouchableOpacity>

                        </View>

                    )}


                    {/* ADMIN MESSAGE */}

                    {role === 'admin' && (

                        <View style={styles.adminMessageWrap}>

                            <Text style={styles.adminMessage}>
                                Admin accounts are created by the system administrator.
                            </Text>

                        </View>

                    )}

                </View>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
};


export default Login;


const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#eaf6ff',
    },

    container: {
        flex: 1,
        backgroundColor: '#eaf6ff',
        paddingHorizontal: 24,
        justifyContent: 'center',
    },

    backBtn: {
        position: 'absolute',
        top: 10,
        left: 16,
        padding: 8,
        zIndex: 10,
    },

    backBtnText: {
        fontSize: 16,
        color: '#1e90ff',
        fontWeight: '600',
    },

    logoWrap: {
        alignItems: 'center',
        marginBottom: 30,
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

    forgotWrap: {
        alignSelf: 'flex-end',
        marginTop: 10,
    },

    forgotText: {
        fontSize: 13,
        color: '#1e90ff',
        fontWeight: '500',
    },

    loginBtn: {
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

    loginBtnDisabled: {
        opacity: 0.7,
    },

    loginBtnText: {
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

    signupWrap: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 26,
    },

    signupText: {
        fontSize: 14,
        color: '#5a7d94',
    },

    signupLink: {
        fontSize: 14,
        color: '#1e90ff',
        fontWeight: 'bold',
    },

    adminMessageWrap: {
        marginTop: 22,
        paddingHorizontal: 20,
    },

    adminMessage: {
        fontSize: 12,
        lineHeight: 18,
        color: '#5a7d94',
        textAlign: 'center',
    },

    errorBanner: {
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
        marginBottom: 16,
    },

    errorBannerText: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },

});