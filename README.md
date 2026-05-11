# Rural Health Connect 🏥📡

**Rural Health Connect** is an offline-first, comprehensive telemedicine and healthcare platform built specifically to bridge the healthcare gap in rural demographics. It enables seamless communication between patients and doctors, integrating advanced real-time video consultations, AI-powered health assistance, and robust offline capabilities to ensure functionality even in areas with unstable internet connectivity.

## 🌟 Key Features

*   **Offline-First Architecture**: 
    *   **Offline Queueing**: Message and appointment outbox system that auto-syncs when connectivity is restored.
    *   **Local Caching**: Access previous chats, prescriptions, and appointment history completely offline.
    *   **AI Offline Fallback**: Rule-based fallback for the AI Health Assistant when the network is unavailable.
*   **Real-Time Telemedicine**:
    *   High-quality peer-to-peer video & audio consultations using the **Agora WebRTC SDK**.
    *   Real-time messaging, notifications, and call signaling powered by **Socket.io**.
*   **AI Health Assistant**: 
    *   Integrated with **Google Generative AI (Gemini)** to provide instant symptom checking and health guidance.
*   **Comprehensive Healthcare Workflows**:
    *   **Role-Based Portals**: Dedicated interfaces for Patients and Doctors.
    *   **Appointment Management**: Seamless booking, scheduling, and tracking.
    *   **Digital Prescriptions**: Auto-generated PDF prescriptions using PDFKit.
    *   **Secure Authentication**: JWT-based login and session management.
*   **Accessible Design**:
    *   Localized UI support using `i18next`.
    *   Optimized ergonomics for rural users (larger fonts, high contrast, intuitive icons).

---

## 🛠️ Technology Stack

### **Frontend (Mobile App)**
*   **Framework**: React Native (Expo)
*   **Navigation**: React Navigation (Stack & Bottom Tabs)
*   **Real-Time Communication**: `react-native-agora` (WebRTC), `socket.io-client`
*   **State & Storage**: `@react-native-async-storage/async-storage` (for offline caching)
*   **Networking**: Axios, NetInfo (for network state monitoring)
*   **Localization**: `react-i18next`

### **Backend (API & Services)**
*   **Environment**: Node.js, Express.js
*   **Database**: MongoDB & Mongoose
*   **Authentication**: JSON Web Tokens (JWT), `bcryptjs`
*   **Real-Time Services**: `socket.io` (WebSockets)
*   **Third-Party Integrations**: 
    *   `@google/generative-ai` (AI Health Assistant)
    *   `agora-access-token` (Dynamic WebRTC token generation)
*   **Utilities**: `multer` (File uploads), `pdfkit` (Prescription generation)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas)
*   Expo CLI (`npm install -g expo-cli`)
*   Agora Developer Account (for App ID & App Certificate)
*   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/Jayamehta04/RuralHealthConnect.git
cd RuralHealthConnect
```

### 2. Backend Setup
```bash
cd backend
npm install
```
*   Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
GEMINI_API_KEY=your_gemini_api_key
```
*   Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
*   Update your `frontend/src/config.js` or `.env` file with your backend URL and Agora App ID.
*   Start the Expo development server:
```bash
npx expo start
```
*   Use the **Expo Go** app on your physical device or run on an Android/iOS emulator to test the application.

---

## 💡 Architecture Highlights
*   **Resilience**: The app monitors network state globally. Critical actions gracefully degrade into an offline queue, preventing data loss.
*   **Scalable WebSockets**: Socket.io manages live chat states and coordinates WebRTC handshakes (offer/answer/ICE candidates) before transitioning to Agora's P2P network.
*   **Security**: All endpoints are protected via JWTs, and video calls are secured with dynamically generated temporary Agora access tokens.

---

## 👨‍💻 Developer
Developed by **Jaya Mehta**.
