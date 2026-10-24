# 📱 TechXApp — IT Services & Enterprise Operations Platform

> A cross-platform mobile and web application built with **React Native (Expo SDK 57)** and **Firebase**, designed for managing IT services, client engagements, employee workflows, project lifecycles, invoicing, and payslips under unified Role-Based Access Control (RBAC).

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features & User Roles](#-key-features--user-roles)
- [Tech Stack](#-tech-stack)
- [System Requirements & Prerequisites](#-system-requirements--prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the App (Development)](#-running-the-app-development)
  - [Start Metro Bundler](#1-start-metro-bundler)
  - [Run on Android](#2-run-on-android-emulator--device)
  - [Run on iOS](#3-run-on-ios-simulator--device)
  - [Run on Web](#4-run-on-web-browser)
- [Building & Exporting the App (Production)](#-building--exporting-the-app-production)
  - [Method 1: Local Android Build via Gradle (APK & AAB)](#method-1-local-android-build-via-gradle)
  - [Method 2: Cloud Builds with Expo EAS](#method-2-cloud-builds-with-expo-eas)
  - [Method 3: Export Web Static Production Bundle](#method-3-export-web-static-production-bundle)
- [Project Directory Structure](#-project-directory-structure)
- [Quick Reference Command Cheat Sheet](#-quick-reference-command-cheat-sheet)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Overview

**TechXApp** provides an end-to-end management portal for technology consulting firms and software development agencies. It unifies three major stakeholders into a single, responsive app:
1. **Clients**: Discover tech capabilities, track invoices, review project progress, and request services or talent.
2. **Employees**: View assigned projects, track deliverables, download verified PDF payslips, and manage their professional profiles.
3. **Admins**: Approve employees, manage client accounts, create and dispatch invoices, generate salary payslips, review hiring applications, and broadcast system notifications.

---

## 👥 Key Features & User Roles

### 1. 🛡️ Admin Portal
- **Dashboard**: High-level overview of revenue, active projects, employee count, and pending hiring requests.
- **Client Management** (`AdminClients.jsx`): Create, view, update, and manage client profiles and active accounts.
- **Employee Directory** (`AdminEmployees.jsx`): Review pending signups, approve employee access, and manage employee records.
- **Project Tracking** (`AdminProjects.jsx`): Assign projects to employees and clients, track milestones, deadlines, and delivery statuses.
- **Invoice Generation** (`AdminInvoices.jsx`): Issue itemized invoices with GST/tax calculations, download/share PDF copies, and track payment status.
- **Payslip Management** (`AdminPayslips.jsx`): Generate monthly employee salary slips, compute deductions and net pay, and generate downloadable PDFs.
- **Hiring Pipeline** (`AdminHiring.jsx`): Review job applications, download applicant resumes, and update recruitment stages.

### 2. 👨‍💻 Employee Portal
- **Active Projects** (`EmployeeProjects.jsx`): Check assigned tasks, project requirements, and team contacts.
- **Payslips & Earnings** (`EmployeePayslips.jsx` & `PayslipDetail.jsx`): Access payment history, inspect salary breakdowns, and export/share signed PDF payslips.
- **Profile & Status** (`Profile.jsx`): Manage personal details and verification status.

### 3. 💼 Client Portal
- **Services Catalog** (`ServicePage.jsx` & `ServiceDetail.jsx`): Explore IT services (Cloud, AI/ML, Full-Stack Dev, DevOps, Cybersecurity).
- **Billing & Invoices** (`Invoice.jsx` & `InvoiceDetail.jsx`): View billed services, outstanding balances, and export receipt PDFs.
- **Talent & Hiring Request** (`Hiring.jsx`): Submit requirement requests for dedicated tech teams.

### 4. 🔔 System-Wide Features
- **Real-time Notifications** (`NotificationService.js` & `NotificationsModal.jsx`): Push and in-app alerts for invoices, status updates, and announcements.
- **PDF Generation & Native Sharing**: Integrated via `expo-print` and `expo-sharing`.
- **Multimedia Integration**: Native video playback with `expo-video` and embedded YouTube showcase via `react-native-youtube-iframe`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) `0.86.3` with [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) |
| **Language** | JavaScript (ES6+ / React 19) |
| **Navigation** | `@react-navigation/native` v7, Stack & Drawer Navigators |
| **Backend & Database** | Google Firebase v12 (Firestore, Firebase Authentication, Firebase Analytics) |
| **PDF & Documents** | `expo-print`, `expo-sharing` |
| **Media & Video** | `expo-video`, `react-native-youtube-iframe`, `expo-blur` |
| **Storage & State** | `@react-native-async-storage/async-storage` |
| **Email Service** | `@emailjs/browser` |
| **Target Platforms** | Android (Native), iOS (Native), Web (React Native Web) |

---

## ⚙️ System Requirements & Prerequisites

Ensure the following tools are installed on your machine before running or building the project:

1. **Node.js**: `v18.x` or `v20.x` LTS ([Download Node.js](https://nodejs.org/))
2. **Package Manager**: `npm` (comes with Node) or `yarn` / `pnpm`
3. **Expo CLI**: Bundled with modern Expo via `npx expo`
4. **Git**: Installed and configured on your system

### Platform-Specific Requirements

#### For Android Development & Local Building:
- **Java Development Kit (JDK)**: **JDK 17** (Required for React Native 0.86 / Gradle 8+)
- **Android Studio**: With the following components installed via SDK Manager:
  - Android SDK Platform `API 34` or `API 35`
  - Android SDK Build-Tools
  - Android SDK Command-line Tools
  - Android Emulator
- **Environment Variables**: Add the following to your shell profile (`~/.zshrc`, `~/.bashrc`, or Windows Environment Variables):

```bash
# macOS / Linux (~/.zshrc or ~/.bashrc)
export JAVA_HOME=$(/usr/libexec/java_home -v 17) # macOS
export ANDROID_HOME=$HOME/Library/Android/sdk     # macOS ($HOME/Android/Sdk on Linux)
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

#### For iOS Development (macOS only):
- **macOS** with latest **Xcode** installed from the Mac App Store.
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`

---

## 📥 Installation & Setup

### Step 1: Open Terminal & Navigate to Project

```bash
cd /path/to/TechXApp
```

### Step 2: Install Project Dependencies

Run either `npm install` or use Expo's version-aligned package resolver:

```bash
npm install
```
*(Optional) If installing new Expo packages in the future, always use:*
```bash
npx expo install <package-name>
```

### Step 3: Firebase Configuration Verification

The project is connected to Firebase for Auth and Firestore:
- **Web & Native Auth Config**: Located in `firebaseConfig.js`.
- **Android Native Google Services**: Ensure `google-services.json` is present in:
  - Root directory: `./google-services.json`
  - Android app directory: `./android/app/google-services.json`

*(Both files are already bundled in the repository).*

---

## 🚀 Running the App (Development)

### 1. Start Metro Bundler
Start the development server with interactive CLI:

```bash
npm start
# OR
npx expo start
```

#### Interactive Terminal Shortcuts:
Once Metro starts, press any of the following keys directly in your terminal:
- Press <kbd>a</kbd> — Open on connected **Android** device or emulator.
- Press <kbd>i</kbd> — Open on **iOS** simulator (macOS only).
- Press <kbd>w</kbd> — Open in default **Web Browser**.
- Press <kbd>r</kbd> — Reload the app.
- Press <kbd>m</kbd> — Toggle the in-app developer menu.
- Press <kbd>c</kbd> — Clear Metro bundler cache.

---

### 2. Run on Android (Emulator / Device)

Make sure you have an Android emulator running or a physical device connected with **USB Debugging** enabled:

```bash
# Verify your device is connected:
adb devices

# Run the app natively on Android:
npm run android
# OR
npx expo run:android
```
> **Tip:** If you only want to test via the **Expo Go** client without native compilation, run `npx expo start` and scan the displayed QR code using the **Expo Go** Android app.

---

### 3. Run on iOS (Simulator / Device — macOS Only)

```bash
npm run ios
# OR
npx expo run:ios
```

---

### 4. Run on Web Browser

To launch the web version using React Native Web:

```bash
npm run web
# OR
npx expo start --web
```
This automatically starts Metro and opens `http://localhost:8081` in your browser.

---

### 5. Running with Clean Cache
If you encounter module resolution errors or stale assets:

```bash
npx expo start -c
# OR
npm start -- --reset-cache
```

---

## 📦 Building & Exporting the App (Production)

There are three primary methods to export and build **TechXApp**:

---

### Method 1: Local Android Build via Gradle

Because this project contains a pre-generated native `android/` directory, you can build production APKs and AABs directly on your machine without paying for cloud build queues.

#### Step 1: Open the `android/` directory in terminal
```bash
cd android
```

#### Step 2: Clean previous build artifacts
```bash
# macOS / Linux:
./gradlew clean

# Windows (Command Prompt / PowerShell):
gradlew.bat clean
```

#### Step 3: Generate Debug APK (Fast Testing)
Generates an installable APK for immediate testing on any Android phone:
```bash
# macOS / Linux:
./gradlew assembleDebug

# Windows:
gradlew.bat assembleDebug
```
📁 **Output APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```
*To install directly to a connected phone:*
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Step 4: Generate Release APK (Standalone Installable)
Generates an optimized, minified standalone APK:
```bash
# macOS / Linux:
./gradlew assembleRelease

# Windows:
gradlew.bat assembleRelease
```
📁 **Output APK Location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Step 5: Generate Release AAB (Google Play Store Bundle)
Generates an Android App Bundle (`.aab`) required for publishing on the **Google Play Console**:
```bash
# macOS / Linux:
./gradlew bundleRelease

# Windows:
gradlew.bat bundleRelease
```
📁 **Output AAB Location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

#### 🔑 Signing with a Custom Production Keystore (Optional for Play Store)
To generate your own official release keystore:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
Move `my-release-key.keystore` to `android/app/` and configure your credentials in `android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

---

### Method 2: Cloud Builds with Expo EAS

Expo Application Services (EAS) builds your app on Expo's remote cloud infrastructure.

#### Step 1: Install EAS CLI Globally
```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo Account
```bash
eas login
```

#### Step 3: Configure Project for EAS
```bash
eas build:configure
```
*(Select "All platforms" when prompted. This creates an `eas.json` configuration file).*

#### Step 4: Build Commands

- **Build an Android APK for internal team testing (Direct Install):**
  ```bash
  eas build -p android --profile preview
  ```

- **Build an Android App Bundle (AAB) for Google Play Store:**
  ```bash
  eas build -p android --profile production
  ```

- **Build for iOS (Requires Apple Developer Account):**
  ```bash
  eas build -p ios --profile production
  ```

---

### Method 3: Export Web Static Production Bundle

To build and export an optimized, static web distribution bundle that can be hosted on **Firebase Hosting**, **Vercel**, **Netlify**, or **Apache/Nginx**:

#### Step 1: Export the Web Bundle
```bash
npx expo export --platform web
# OR for all platforms:
npx expo export
```
This bundles all JavaScript, HTML, icons, videos, and fonts into the `dist/` directory.

#### Step 2: Test the Exported Web Build Locally
You can test the static export locally before deploying:
```bash
npx serve dist
```
Navigate to the local URL (usually `http://localhost:3000`) to test the production build.

#### Step 3: Deploy to Firebase Hosting (Optional)
If deploying via Firebase:
```bash
# 1. Login to Firebase CLI
npx firebase-tools login

# 2. Deploy only hosting
npx firebase-tools deploy --only hosting
```

---

## 📂 Project Directory Structure

```text
TechXApp/
├── App.js                     # Root component, Auth listener & Navigation hierarchy
├── index.js                   # Entry point registerRootComponent
├── app.json                   # Expo configuration & plugins (video, sharing, icons)
├── package.json               # Dependencies, scripts, and package versions
├── firebaseConfig.js          # Firebase app, auth persistence & firestore initialization
├── google-services.json       # Android Firebase configuration
├── AGENTS.md                  # Development guidelines (Expo SDK 57 versioned reference)
│
├── android/                   # Native Android project (Gradle, build scripts, manifest)
│   ├── app/
│   │   ├── build.gradle       # App-level gradle build config & dependencies
│   │   └── src/main/          # AndroidManifest.xml, java code & native assets
│   ├── build.gradle           # Top-level project gradle build config
│   └── gradlew / gradlew.bat  # Gradle wrapper executables
│
├── assets/                    # App icons, splash screens, branding & media
│   ├── logo.png               # TechX brand logo
│   ├── icon.png               # Mobile launcher icon
│   ├── services/              # Service illustrative images
│   └── videos/                # Promotional & showcase video assets
│
└── components/                # Modular UI Screens & Components
    │── RoleSelect.jsx         # Initial landing screen (Choose Client / Employee / Admin)
    │── Login.jsx              # Universal Auth login screen with role context
    │── SignUp.jsx             # User registration (Client / Employee approval request)
    │── Home.jsx               # Dynamic role-tailored dashboard screen
    │── CustomDrawer.jsx       # Side navigation drawer with user profile & navigation
    │── Header.jsx             # Top bar with notification bell & title
    │── Profile.jsx            # User profile management & logout
    │── NotificationService.js # Firestore real-time notification engine
    │── NotificationsModal.jsx # Slide-over notifications center
    │
    ├── # Client Features
    │   ├── ServicePage.jsx    # Complete catalog of offered IT services
    │   ├── ServiceDetail.jsx  # Detailed breakdown of individual technical offerings
    │   ├── Invoice.jsx        # Client invoice listing & status tracker
    │   ├── InvoiceDetail.jsx  # Itemized invoice view & PDF download
    │   └── Hiring.jsx         # Talent requisition & team hiring application form
    │
    ├── # Employee Features
    │   ├── EmployeeProjects.jsx # Projects assigned to logged-in employee
    │   ├── EmployeePayslips.jsx # Monthly payslip history for employee
    │   └── PayslipDetail.jsx    # Detailed salary slip with PDF generation/share
    │
    └── # Admin Features
        ├── AdminClients.jsx   # Client accounts overview & onboarding
        ├── AdminEmployees.jsx # Employee approval management & team directory
        ├── AdminProjects.jsx  # Master project creator & task assignment
        ├── AdminInvoices.jsx  # Invoice generator, GST calculations & dispatch
        ├── AdminPayslips.jsx  # Salary payslip creation & distribution engine
        └── AdminHiring.jsx    # Candidate applications review & hiring pipeline
```

---

## ⚡ Quick Reference Command Cheat Sheet

| Task | Command |
|---|---|
| **Install Dependencies** | `npm install` |
| **Start Metro Bundler** | `npm start` or `npx expo start` |
| **Start Bundler with Clean Cache** | `npx expo start -c` |
| **Run on Android Emulator/Phone** | `npm run android` or `npx expo run:android` |
| **Run on iOS Simulator** | `npm run ios` or `npx expo run:ios` |
| **Run on Web Browser** | `npm run web` or `npx expo start --web` |
| **Clean Android Gradle Build** | `cd android && ./gradlew clean && cd ..` |
| **Build Debug Android APK** | `cd android && ./gradlew assembleDebug` |
| **Build Release Android APK** | `cd android && ./gradlew assembleRelease` |
| **Build Play Store AAB Bundle** | `cd android && ./gradlew bundleRelease` |
| **Install Debug APK to Phone** | `adb install android/app/build/outputs/apk/debug/app-debug.apk` |
| **Export Static Web Site** | `npx expo export --platform web` |
| **Preview Exported Web Site** | `npx serve dist` |
| **Build Cloud APK (EAS)** | `eas build -p android --profile preview` |
| **Build Cloud AAB (EAS)** | `eas build -p android --profile production` |

---

## 🔧 Troubleshooting & FAQs

### 1. `JAVA_HOME is not set` or Gradle build failure
- **Cause**: Android Gradle in React Native 0.86 requires **Java 17**.
- **Fix**: Check your installed Java version:
  ```bash
  java -version
  ```
  Ensure `JAVA_HOME` points to JDK 17 (e.g. `/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home` on macOS).

### 2. Port `8081` Already in Use
- **Cause**: Another Metro bundler or background Node process is using port 8081.
- **Fix**: Free port 8081 or start Metro on a different port:
  ```bash
  # Find and kill process on port 8081:
  lsof -ti:8081 | xargs kill -9

  # Or run Metro on port 8088:
  npx expo start --port 8088
  ```

### 3. Clear Metro / Watchman Cache
If you encounter `Cannot find module` or cache synchronization glitches:
```bash
# 1. Reset watchman (if installed)
watchman watch-del-all 2>/dev/null || true

# 2. Remove metro cache & start clean
npx expo start -c
```

### 4. Android Build Fails with `Execution failed for task ':app:processReleaseGoogleServices'`
- **Cause**: `google-services.json` missing or mismatched package name.
- **Fix**: Ensure `google-services.json` is located in `android/app/google-services.json` and package name matches `com.techx.app`.

### 5. Firebase Auth State Persistence on Web vs. Mobile
- `firebaseConfig.js` is automatically configured to use:
  - `browserLocalPersistence` on Web (`localStorage`).
  - `getReactNativePersistence(AsyncStorage)` on Android and iOS native platforms.
- Users remain logged in across application restarts automatically.

---

## 📄 License & Credits

- **License**: MIT License (See `LICENSE` file for details).
- **Developed For**: TechX IT Solutions & Services.
- **Built With**: Expo SDK 57, React Native, Firebase Firestore & Authentication.
