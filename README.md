#  BuyForce - Group Buying Platform (MVP)

BuyForce is a mobile application enabling users to join purchasing groups to unlock wholesale prices on high-value products. The platform leverages collective buying power to secure discounts.

> **Project for Mobile Development Course**
> **Stack:** React Native (Expo) | Firebase | Docker | PostgreSQL

---

## Key Features Implemented

* **Group Buying Engine:** Users can join product groups; transaction processes only if the target is met.
* **Biometric Authentication:** Secure login using FaceID / TouchID (`expo-local-authentication`).
* **Smart Catalog:** Trending products, "Near Goal" alerts, and category filtering.
* **Search & Discovery:** Recent searches, trending terms, and live search.
* **Social Sharing:** "Invite a Friend" modal using native sharing capabilities.
* **Payment Management:** Saving credit cards (Default/Secondary) with secure UI and validations.
* **Data Persistence:** Firebase for real-time data & Dockerized PostgreSQL for analytics infrastructure.

---

##  Tech Stack

### Frontend (Mobile)
* **Framework:** React Native with Expo (SDK 52).
* **Language:** TypeScript.
* **Navigation:** Expo Router (File-based routing).
* **Styling:** StyleSheet & Vector Icons.

### Backend & Cloud
* **Firebase Auth:** User authentication & persistence.
* **Firebase Firestore:** NoSQL database for products, orders, and users.
* **Firebase Storage:** Hosting product images.
* **Firebase Analytics:** User events tracking.

### Analytics Infrastructure (Dockerized)
* **Docker:** Containerized environment.
* **Node.js (Express):** Backend server for metrics.
* **PostgreSQL:** Relational database for long-term data warehousing.

---

##  Installation & Running

### Prerequisites
* Node.js installed.
* Expo Go app on your mobile device (iOS/Android).
* Docker Desktop (for the analytics server).

###  Clone the Repository
```bash
git clone [https://github.com/nomily23/buyforce-app.git](https://github.com/nomily23/buyforce-app.git)
cd buyforce-app
Run the Mobile App (Expo)
Bash

# Install dependencies
npm install

# Start the app (with cache clearing)
npx expo start -c
Scan the QR code with your phone to launch the app.

3. Run the Analytics Server (Docker)
To spin up the PostgreSQL database and the Node.js server:

Bash

# From the root directory
docker-compose up --build
Server Check: Open http://localhost:3000

DB Check: Open http://localhost:3000/db-check

📂 Project Structure
Plaintext

BUYFORCE-APP
├── app/                 # Expo Router screens & navigation
│   ├── (tabs)/          # Main tabs (Home, Profile, Orders)
│   ├── product-details/ # Dynamic product page
│   ├── login.tsx        # Auth & Biometric login
│   ├── payment.tsx      # Payment processing screen
│   └── modal.tsx        # Invite friends screen
├── server/              # Backend for Analytics
│   ├── index.js         # Express server
│   ├── Dockerfile       # Server container config
│   └── package.json     # Server dependencies
├── docker-compose.yml   # Docker orchestration (DB + Server)
└── firebaseConfig.js    # Firebase connection