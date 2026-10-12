# TODO

A simple to-do list mobile app built with React Native and Expo. It was made as a mini project for a Mobile Application Development course.

## Features

- Add, edit, delete, and mark tasks as done
- Categories (General, School, Work, Personal) with filter buttons
- Search tasks by title
- Optional due dates, with overdue tasks shown in red
- Tasks are saved on the phone, so they stay after closing the app

## Built With

- React Native with Expo (Expo Router)
- TypeScript
- SQLite (expo-sqlite) for local storage
- @react-native-community/datetimepicker for due dates
- Bebas Neue font (@expo-google-fonts/bebas-neue)

## How It Works

The app keeps one `tasks` table in a local SQLite database with the columns id, title, done, category, and due_date. Each action runs one SQL command:

| Action | SQL |
| --- | --- |
| Add task | INSERT |
| View, search, filter | SELECT |
| Edit task, mark done | UPDATE |
| Delete task | DELETE |

The main screen is in `src/app/index.tsx`.

## Run the App

Requirements: Node.js and the Expo Go app on an Android or iOS phone.

```
npm install
npx expo start
```

Scan the QR code with Expo Go. The phone and computer must be on the same Wi-Fi. If it won't connect, use `npx expo start --tunnel`.

The web preview is not supported because SQLite does not run on web in this setup.

## Build the APK

```
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

When the build finishes, download the APK from the link shown in the terminal and install it on an Android phone.