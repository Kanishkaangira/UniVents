This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

## Android release signing

The upload keystore and `android/keystore.properties` contain private signing
credentials. Keep the keystore outside the repository, back it up securely,
and never commit either file. The repository ignores the local properties file
and common keystore formats.

1. In PowerShell, create the key directory and generate a JKS upload keystore.
   Choose a strong password when prompted; press Enter at the key-password
   prompt to use the same password for both.

   ```powershell
   $keyDir = Join-Path $env:USERPROFILE 'Documents\UniVents-Keys'
   New-Item -ItemType Directory -Force -Path $keyDir | Out-Null
   $keyPath = Join-Path $keyDir 'univents-upload-key.jks'
   keytool -genkeypair -v -keystore $keyPath -storetype JKS `
     -alias univents-upload -keyalg RSA -keysize 4096 -validity 10000
   ```

2. Verify the key with
   `keytool -list -v -keystore $keyPath -alias univents-upload`, then run
   `$keyPath -replace '\\','/'` and copy its output. Copy
   `android/keystore.properties.example` to
   `android/keystore.properties`. Edit the copy: set `storeFile` to the
   copied path and replace both password placeholders with the passwords
   chosen above. A 32-character letters-and-numbers password avoids
   properties-file escaping issues. Keep `storeType=JKS` and
   `keyAlias=univents-upload`. Do not add spaces around the `=` signs.
3. From the `android` directory, validate signing and build the Play Store
   bundle:

   ```powershell
   .\gradlew.bat :app:validateReleaseSigning
   .\gradlew.bat :app:bundleRelease
   ```

4. Optionally build a release APK for direct testing:

   ```powershell
   .\gradlew.bat :app:assembleRelease
   ```

   On Windows, this project writes release outputs to
   `..\UniVents-android-build\app\outputs` (relative to the project root).
   Upload `bundle\release\app-release.aab` to Play Console; use
   `apk\release\app-release.apk` for direct device testing.

Use the same upload keystore for future app updates and keep a secure backup.
Increase `versionCode` in `android/app/build.gradle` for each Play Store
release.

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
