# Pixelfy

An Instagram clone built with React Native and Supabase.

## Description

Pixelfy is a mobile application designed to replicate the core features of Instagram, allowing users to share photos, follow other users, like and comment on posts, and engage in direct messaging. It leverages React Native for cross-platform compatibility and Supabase for backend services, including authentication, database management, and real-time updates.

**URL:** [https://github.com/TaskmasterRishi/Pixelfy](https://github.com/TaskmasterRishi/Pixelfy)

## Features and Functionality

*   **User Authentication:** Sign-in and sign-up using email and password, managed by Supabase Auth.
*   **Profile Management:** Users can create and edit profiles, including username, bio, and avatar.
*   **Post Creation:** Users can upload images with captions.
*   **Feed Display:** Displays a feed of posts from users the current user follows.
*   **Liking and Commenting:** Users can like and comment on posts.
*   **Friend Requests:** Users can send and accept friend requests.
*   **Direct Messaging:** Real-time chat functionality using Stream Chat.
*   **Image Upload and Sharing:** Utilizes Cloudinary for image storage and delivery, with sharing functionality.
*   **Notifications:** Real-time notifications for likes, comments, friend requests, and follows.
*   **Story Viewing**: Users can post and view stories
*   **User Blocking**: Users can block other users

## Technology Stack

*   **React Native:** A framework for building native mobile apps using JavaScript and React.
*   **Expo:** A framework and platform for universal React applications.
*   **Supabase:** An open-source Firebase alternative that provides backend services.
*   **Stream Chat:** A platform for building real-time chat applications.
*   **Nativewind:** Uses Tailwind CSS syntax for styling React Native components.
*   **React Native Gesture Handler**: Provides a native-driven gesture management API for building best possible touch-based experiences in React Native.
*   **Expo Sharing**: Provides a way to share files to other applications on the device.
*   **React Native Reanimated**: Provides a more comprehensive and lower level animation library.
*   **Cloudinary:** Cloud service that manages images and videos.

## Prerequisites

Before you begin, ensure you have met the following requirements:

*   Node.js (>=18) and npm or yarn installed.
*   Expo CLI installed (`npm install -g expo-cli`).
*   A Supabase account and project set up.
*   A Stream Chat account and API key.
*   A Cloudinary account and API credentials.

## Installation Instructions

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/TaskmasterRishi/Pixelfy.git
    cd Pixelfy
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure environment variables:**

    Create a `.env` file in the root directory with the following variables:

    ```
    EXPO_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>
    EXPO_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
    EXPO_PUBLIC_STREAM_API_KEY=<YOUR_STREAM_API_KEY>
    ```

4.  **Initialize Supabase:**

    Ensure your Supabase project has the necessary tables and functions. Refer to the Supabase documentation for setup instructions.  At a minimum, you'll need `users`, `posts`, `likes`, `comments`, `follow_requests`, `friends`, `notifications`, `saved_posts`, `stories`, `close_friends`, `blocked_users`.

5.  **Run the application:**

    ```bash
    expo start
    ```

    This will start the Expo development server, and you can then run the app on an emulator or a physical device.

## Usage Guide

1.  **Authentication:**

    *   Sign up for a new account or sign in with existing credentials on the `/(auth)/index.tsx` or `/(auth)/signup.tsx` screens.

2.  **Profile Creation/Editing:**

    *   New users will be prompted to complete their profile information, including username, full name, and phone number, on `src/app/(screens)/user_info.tsx`.
    *   Existing users can edit their profile information through `src/app/(screens)/edit-profile.tsx`, accessible via the settings screen.

3.  **Posting Images:**

    *   Use the "+" button on the tab bar to create a new post (`src/app/(tabs)/new.tsx`).
    *   Select an image from your device's library and add a caption.

4.  **Navigating the Feed:**

    *   The main feed is displayed on the `src/app/(tabs)/index.tsx` screen.
    *   Scroll through the feed to view posts from other users.

5.  **Interacting with Posts:**

    *   Like posts by tapping the heart icon in the `src/Components/PostListItem.tsx` component. The `src/Components/LikeButton.tsx` component handles the logic for liking and unliking posts.
    *   Add comments by tapping the comment icon and entering text in the `src/Components/Comments.tsx` component, or `src/Components/CommentBottomSheet.tsx`.

6.  **Sending Friend Requests:**

    *   Navigate to a user's profile by searching for them in the search tab (`src/app/(tabs)/search.tsx`) and tap follow or request.
    *   The `src/Components/FriendRequest.tsx` component handles sending and removing friend requests, and the `src/Components/AcceptFriend.tsx` component handles accepting/rejecting friend requests.

7.  **Direct Messaging:**

    *   Access the chat functionality from the tab bar (`src/app/(tabs)/(chat)/index.tsx`).
    *   Start new conversations by tapping on a user on Discover Users.
    *   Real-time messaging within channels is managed by Stream Chat and implemented in `src/app/(tabs)/(chat)/channel/[cid].tsx`.

## API Documentation

This project uses Supabase and Stream Chat APIs. Please refer to their respective documentations for detailed information:

*   **Supabase:** [https://supabase.com/docs](https://supabase.com/docs)
*   **Stream Chat:** [https://getstream.io/chat/docs/](https://getstream.io/chat/docs/)
*   **Cloudinary:** [https://cloudinary.com/documentation](https://cloudinary.com/documentation)

## Contributing Guidelines

Contributions are welcome! To contribute to Pixelfy, follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix:

    ```bash
    git checkout -b feature/your-feature-name
    ```

3.  Make your changes and commit them with descriptive commit messages.
4.  Push your changes to your fork:

    ```bash
    git push origin feature/your-feature-name
    ```

5.  Submit a pull request to the `main` branch of the Pixelfy repository.

## License Information

This project does not specify a license. All rights are reserved unless otherwise stated.

## Contact/Support Information

For questions or support, please contact the project maintainer at [pixelfyhelp@gmail.com](mailto:pixelfyhelp@gmail.com).
You can also create issues and pull requests via the Github repository
```
