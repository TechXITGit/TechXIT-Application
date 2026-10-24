import 'react-native-gesture-handler';

import React from 'react';
import { View, Image, Text, ActivityIndicator, StyleSheet, StatusBar, Animated, Easing, Platform } from 'react-native';

import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';

const navigationRef = createNavigationContainerRef();

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createDrawerNavigator,
} from '@react-navigation/drawer';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';


import RoleSelect from './components/RoleSelect';
import Login from './components/Login';
import Signup from './components/SignUp';

import Home from './components/Home';

import CustomDrawer from './components/CustomDrawer';

import Services from './components/ServicePage';
import Invoice from './components/Invoice';
import Hiring from './components/Hiring';

import ServiceDetail from './components/ServiceDetail';

import AdminClients from './components/AdminClients';
import AdminEmployees from './components/AdminEmployees';
import AdminPayslips from './components/AdminPayslips';
import AdminProjects from './components/AdminProjects';
import AdminInvoices from './components/AdminInvoices';
import AdminHiring from './components/AdminHiring';

import EmployeePayslips from './components/EmployeePayslips';
import EmployeeProjects from './components/EmployeeProjects';

import PayslipDetail from './components/PayslipDetail';
import InvoiceDetail from './components/InvoiceDetail';

import Profile from './components/Profile';


const Stack =
  createNativeStackNavigator();

const Drawer =
  createDrawerNavigator();


// =====================================================
// CLIENT DRAWER
// =====================================================

const ClientDrawer = () => {

  return (

    <Drawer.Navigator

      drawerContent={props => (
        <CustomDrawer
          {...props}
        />
      )}

      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
      }}

    >

      <Drawer.Screen name="Home">
        {props => <Home {...props} role="client" />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Invoice"
        component={Invoice}
      />

      <Drawer.Screen
        name="Hiring"
        component={Hiring}
      />

      <Drawer.Screen
        name="Services"
        component={Services}
      />

      <Drawer.Screen
        name="Profile"
        component={Profile}
      />

    </Drawer.Navigator>
  );
};


// =====================================================
// ADMIN DRAWER
// =====================================================

const AdminDrawer = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => (
        <CustomDrawer
          {...props}
          isAdmin={true}
        />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="Home">
        {props => <Home {...props} role="admin" />}
      </Drawer.Screen>

      <Drawer.Screen
        name="AdminEmployees"
        component={AdminEmployees}
      />

      <Drawer.Screen
        name="AdminClients"
        component={AdminClients}
      />

      <Drawer.Screen
        name="AdminProjects"
        component={AdminProjects}
      />

      <Drawer.Screen
        name="AdminPayslips"
        component={AdminPayslips}
      />

      <Drawer.Screen
        name="AdminInvoices"
        component={AdminInvoices}
      />

      <Drawer.Screen
        name="AdminHiring"
        component={AdminHiring}
      />

      <Drawer.Screen
        name="Profile"
        component={Profile}
      />
    </Drawer.Navigator>
  );
};


// =====================================================
// EMPLOYEE DRAWER
// =====================================================

const EmployeeDrawer = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={props => (
        <CustomDrawer
          {...props}
          isEmployee={true}
        />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="Home">
        {props => <Home {...props} role="employee" />}
      </Drawer.Screen>

      <Drawer.Screen
        name="EmployeeProjects"
        component={EmployeeProjects}
      />

      <Drawer.Screen
        name="EmployeePayslips"
        component={EmployeePayslips}
      />

      <Drawer.Screen
        name="Profile"
        component={Profile}
      />
    </Drawer.Navigator>
  );
};


// =====================================================
// APP
// =====================================================

const App = () => {
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [initialRoute, setInitialRoute] = React.useState('RoleSelect');

  React.useEffect(() => {
    // Import auth & db dynamically to respect initialized Firebase instance
    const { auth, db } = require('./firebaseConfig');
    const { onAuthStateChanged, signOut } = require('firebase/auth');
    const { doc, getDoc } = require('firebase/firestore');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role === 'admin') {
              setInitialRoute('AdminHome');
            } else if (data.role === 'employee') {
              if (data.approved === true) {
                setInitialRoute('EmployeeHome');
              } else {
                await signOut(auth);
                setInitialRoute('RoleSelect');
              }
            } else if (data.role === 'client') {
              setInitialRoute('Home');
            } else {
              setInitialRoute('Home');
            }
          } else {
            setInitialRoute('RoleSelect');
          }
        } catch (error) {
          console.log('App session restore error:', error);
          setInitialRoute('RoleSelect');
        }
      } else {
        setInitialRoute('RoleSelect');
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);



  if (isCheckingAuth) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (

    <SafeAreaProvider>

      <NavigationContainer ref={navigationRef}>

        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
          }}
        >

          <Stack.Screen
            name="RoleSelect"
            component={RoleSelect}
          />


          {/* CLIENT */}

          <Stack.Screen name="ClientLogin">
            {props => (
              <Login
                {...props}
                role="client"
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="ClientSignup">
            {props => (
              <Signup
                {...props}
                role="client"
              />
            )}
          </Stack.Screen>


          {/* ADMIN */}

          <Stack.Screen name="AdminLogin">
            {props => (
              <Login
                {...props}
                role="admin"
              />
            )}
          </Stack.Screen>


          {/* EMPLOYEE */}

          <Stack.Screen name="EmployeeLogin">
            {props => (
              <Login
                {...props}
                role="employee"
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="EmployeeSignup">
            {props => (
              <Signup
                {...props}
                role="employee"
              />
            )}
          </Stack.Screen>


          {/* DRAWERS */}

          <Stack.Screen
            name="Home"
            component={ClientDrawer}
          />

          <Stack.Screen
            name="AdminHome"
            component={AdminDrawer}
          />

          <Stack.Screen
            name="EmployeeHome"
            component={EmployeeDrawer}
          />


          {/* OTHER SCREENS */}

          <Stack.Screen
            name="Services"
            component={Services}
          />

          <Stack.Screen
            name="ServiceDetail"
            component={ServiceDetail}
          />

          <Stack.Screen
            name="PayslipDetail"
            component={PayslipDetail}
          />

          <Stack.Screen
            name="InvoiceDetail"
            component={InvoiceDetail}
          />

          <Stack.Screen
            name="AdminInvoices"
            component={AdminInvoices}
          />

          <Stack.Screen
            name="AdminHiring"
            component={AdminHiring}
          />

        </Stack.Navigator>

      </NavigationContainer>

    </SafeAreaProvider>
  );
};

const SplashScreen = () => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Gentle breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer bar animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 160],
  });

  return (
    <View style={splashStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Ambient background circular glow */}
      <View style={splashStyles.ambientGlow} />

      <Animated.View
        style={[
          splashStyles.contentWrap,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Image
          source={require('./assets/logo.png')}
          style={splashStyles.logo}
          resizeMode="contain"
        />

        <View style={splashStyles.brandRow}>
          <Text style={splashStyles.brandText}>Tech</Text>
          <Text style={splashStyles.brandTextAccent}>X</Text>
        </View>
        <Text style={splashStyles.brandSub}>IT SERVICES</Text>
      </Animated.View>

      {/* Prominent Loading Section */}
      <View style={splashStyles.loaderSection}>
        <ActivityIndicator
          size="small"
          color="#0284c7"
          style={splashStyles.spinner}
        />

        {/* Wider, sleek animated progress track */}
        <View style={splashStyles.progressTrack}>
          <Animated.View
            style={[
              splashStyles.progressBar,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </View>
      </View>

      <Text style={splashStyles.tagline}>Technology Infused with Marketing</Text>

      <View style={splashStyles.statusPill}>
        <View style={splashStyles.pulseDot} />
        <Text style={splashStyles.statusText}>Connecting to workspace...</Text>
      </View>
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  brandTextAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 3,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  loaderSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  spinner: {
    marginBottom: 12,
    transform: [{ scale: 1.15 }],
  },
  progressTrack: {
    width: 220,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    width: 90,
    height: '100%',
    backgroundColor: '#0284c7',
    borderRadius: 3,
  },
  tagline: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
});

export default App;