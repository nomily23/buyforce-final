#  BuyForce - Group Buying Platform (MVP)

> **Unlock wholesale prices through collective purchasing power.**

**BuyForce** is a cross-platform mobile application developed with **React Native (Expo)**. It enables users to join purchasing groups for high-value products. The transaction is finalized only when the group reaches its target number of buyers, ensuring the best possible price for everyone.

---

## 📱 Key Features & Technical Implementation

###  Group Buying Engine
* **Real-Time Progress:** Uses **Firebase Firestore Listeners (`onSnapshot`)** to update the buyer count and progress bar instantly without refreshing.
* **Smart Logic:** Calculates remaining buyers needed and automatically closes groups upon reaching the target.
* **Membership Fee:** Users pay a symbolic ₪1 fee to join, and the full amount only upon success.

### Secure Authentication & User Management
* **Onboarding Flow:** The `index.tsx` entry point performs a background **Auth Check**. If a user is logged in, they are redirected immediately to the Home screen.
* **Hybrid Login:** Support for Email/Password and **Google OAuth**.
* **Biometric Security:** Integrated FaceID/TouchID for quick access using `expo-local-authentication`.

###  Smart Checkout & Wallet
* **Cross-Platform Payment:** The `payment.tsx` screen is fully compatible with both **Mobile (Native Alerts)** and **Web (Window Confirm)**.
* **Wallet Management:** `payment-methods.tsx` allows users to perform **CRUD operations** on credit cards locally.
* **Transaction History:** A dedicated "My Groups" tab tracking Active vs. Completed orders by merging data from `Orders` and `Products` collections.

###  Admin & Automation (Simulation)
* **Batch Processing:** The Profile screen includes an "Admin Zone" button ("Run Daily System Checks").
* **Logic:** This simulates a server cron-job that:
    1. Identifies expired groups.
    2. Processes automatic refunds (changing status to `REFUNDED`).
    3. Triggers notification emails using **Firestore Batch Writes**.

---

##  Tech Stack

### Frontend (Mobile & Web)
* **Framework:** React Native with Expo (SDK 52).
* **Navigation:** Expo Router (Stack & Tabs).
* **Components:** `FlatList` for optimized rendering of product lists.
* **Styling:** StyleSheet & Vector Icons (Ionicons).

### Backend & Cloud Services (Firebase)
* **Auth:** User authentication & session persistence (`AsyncStorage`).
* **Firestore (NoSQL):** Real-time database.
* **Storage:** Hosting product images.

### Analytics Infrastructure (Dockerized)
* **Containerization:** **Docker** & **Docker Compose** used to run the backend services.
* **Backend:** Node.js (Express) server.
* **Database:** PostgreSQL.

---

## Project Structure & Architecture

The project follows the **Expo Router** architecture:

```plaintext
BUYFORCE-APP
├── app/                     
│   ├── _layout.tsx          # Root Stack Navigation: Manages global navigation (Login -> Tabs -> Modal).
│   ├── index.tsx            # Entry Point: Handles Onboarding slides & Auth state checks.
│   ├── (tabs)/              # Bottom Tab Layout:
│   │   ├── _layout.tsx      # Tab Config: Defines bottom menu appearance & icons.
│   │   ├── home.tsx         # Catalog: Uses FlatList with Category Filtering & Search logic.
│   │   ├── my-group.tsx     # Orders: Displays Active vs History groups using Data Joins.
│   │   └── profile.tsx      # User Hub: Includes the Admin Batch Processing logic.
│   ├── product-details.tsx  # Dynamic Page: Handles "Join" logic and Wishlist toggling (setDoc/deleteDoc).
│   ├── payment.tsx          # Checkout: Processes payments and updates Firestore (Orders + Product count).
│   ├── login.tsx            # Auth: Handles Login/Register with Firebase.
│   └── modal.tsx            # Share: Implements Native Sharing API.
├── server/                  # 🐳 Backend Services
│   ├── index.js             # Node.js Analytics Server.
│   ├── Dockerfile           # Defines the container image for the server.
│   └── package.json         # Server dependencies.
├── docker-compose.yml       # Orchestration: Runs the Server + PostgreSQL DB together.
└── firebaseConfig.js        # Firebase configuration & environment setup.
Installation & Running
Prerequisites
Node.js installed.

Expo Go app on your mobile device.

Docker Desktop (optional, for the analytics server).

1. Clone the Repository
Bash

git clone [https://github.com/nomily23/buyforce-app.git](https://github.com/nomily23/buyforce-app.git)
cd buyforce-app
2. Run the Mobile App
Bash

# Install dependencies
npm install

# Start the app
npx expo start -c
Scan the QR code with your phone to launch the app.

3. Run the Backend Server (Docker)
To spin up the PostgreSQL database and the Node.js server:

Bash

docker-compose up --build
Author
Nomily Daniely Mobile Development Course Final Project