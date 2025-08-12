# Profit Engine - Launch Instructions

This project contains the complete source code for the Profit Engine web application. To deploy this to a live website, follow these steps.

### Prerequisites

You must have Node.js and npm installed on your computer. You can get them from [https://nodejs.org/](https://nodejs.org/).

### Step 1: Set Up Your Local Project

1.  **Create a Project Folder:** On your computer, create a new folder named `profit-engine`.
2.  **Create Files:** Inside that folder, create the files as described below (`package.json`, `public/index.html`, `src/App.js`, `src/index.js`). Copy and paste the content for each file from this document.
3.  **Install Dependencies:** Open your command line/terminal, navigate into the `profit-engine` folder, and run the command:
    ```
    npm install
    ```

### Step 2: Connect to Your Firebase Project

1.  **Get Your Config:** Log in to your Firebase project, go to Project Settings, and copy your `firebaseConfig` object.
2.  **Paste Your Config:** Open the `src/App.js` file and paste your `firebaseConfig` object into the placeholder section at the top.

### Step 3: Test Locally (Optional)

1.  From your command line, run:
    ```
    npm start
    ```
    This will open the app in your web browser. You can test that login and saving works.

### Step 4: Deploy to the World

1.  **Install Firebase Tools:** If you haven't already, run this command once:
    ```
    npm install -g firebase-tools
    ```
2.  **Login to Firebase:**
    ```
    firebase login
    ```
3.  **Initialize Hosting:**
    ```
    firebase init hosting
    ```
    - Select "Use an existing project" and choose your Firebase project.
    - When it asks for your public directory, type **`build`**.
    - Configure as a single-page app by answering **Yes**.
    - Do **not** overwrite the `build/index.html` file if it asks.

4.  **Build the App for Production:**
    ```
    npm run build
    ```
5.  **Deploy!**
    ```
    firebase deploy
    ```

Your site is now live on your Firebase Hosting URL. If you connected a custom domain, it will be live there as well.

