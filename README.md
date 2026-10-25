# 🏫 SchoolWay — Real-Time School Bus Fleet Tracking Platform (Hyderabad)

**SchoolWay** is a production-grade MERN school bus tracking and fleet operations platform built specifically for Greater Hyderabad. Designed with an ultra-tactile **Claymorphism UI**, SchoolWay guarantees that **from the very first launch and on every server start, the map is never empty**. Moving buses are visibly navigating real arterial roads in East Hyderabad right out of the box.

---

## ✨ Key Capabilities & Highlights

1. **Always-Live Hyderabad Fleet (No Empty Maps)**:
   - On initial start or server reboot, SchoolWay automatically loads and positions **6 default buses (`SW-01` to `SW-06`)** at staggered positions along Hyderabad road networks.
   - Visitors without an account can immediately inspect live buses, next stops, dynamic ETAs, and stop-by-stop itineraries.
2. **Continuous Bus Simulator Engine**:
   - Built directly into the Express server.
   - Moves each bus along real road-snapped polylines, pauses for realistic dwell times at each stop for student boarding, completes round trips, and reverses continuously.
   - Real-world telemetry variation: speed ranging between 15–45 km/h, slows near stops, occasional simulated traffic delays triggering advisories.
   - **Driver Takeover**: If a driver begins a manual trip, the simulator automatically pauses for that vehicle; once finished, autonomous simulation seamlessly resumes.
3. **Switchable Telemetry Speeds**:
   - **`SIM_MODE=demo`**: High-speed presentation mode with new GPS points every **3 seconds**.
   - **`SIM_MODE=realistic`**: Production mode emitting real-world GPS points every **2 to 5 minutes** with smooth client-side glide interpolation.
   - Toggle switch is prominently available in the top navbar and Admin dashboard for instant live switching.
4. **Road-Snapped OSRM Polylines with Offline Fallback**:
   - Seeding calls the public OSRM Routing API (`router.project-osrm.org`) to snap coordinates to real Hyderabad roads.
   - Offline fallback stored in `server/src/seed/routes.json` ensures 100% offline functionality.
5. **Tactile Claymorphism Aesthetic**:
   - 3D volumetric surfaces, soft multi-layered inset and drop shadows, pillowy cards, chunky tactile buttons with physical pressed states, candy-hued clay badges, and custom rotating directional bus markers.

---

## 🗺️ Seeded Routes & Reference Coordinates

### Route A: Uppal &harr; LB Nagar (Inner Ring Road / NH 65)
- **Forward (`ROUTE-A-FWD`)**: Uppal Ring Road (`17.4058, 78.5591`) &rarr; Ramanthapur X Roads &rarr; Nagole Metro (`17.3718, 78.5590`) &rarr; Alkapuri Colony &rarr; Mansoorabad Junction (`17.3550, 78.5640`) &rarr; Kamineni Hospital &rarr; LB Nagar Circle (`17.3457, 78.5522`).
- **Reverse (`ROUTE-A-REV`)**: LB Nagar &rarr; Kamineni &rarr; Mansoorabad &rarr; Alkapuri &rarr; Nagole &rarr; Ramanthapur &rarr; Uppal.

### Route B: Ghatkesar &harr; Uppal (Warangal Highway / NH 163)
- **Forward (`ROUTE-B-FWD`)**: Ghatkesar Bus Station (`17.4510, 78.6855`) &rarr; Pocharam Infosys SEZ (`17.4430, 78.6470`) &rarr; Narapally Junction (`17.4260, 78.6180`) &rarr; Medipally &rarr; Peerzadiguda (`17.4120, 78.5830`) &rarr; Boduppal &rarr; Uppal Ring Road (`17.4058, 78.5591`).
- **Reverse (`ROUTE-B-REV`)**: Uppal &rarr; Boduppal &rarr; Peerzadiguda &rarr; Medipally &rarr; Narapally &rarr; Pocharam &rarr; Ghatkesar.

---

## 🔑 Demo Credentials

Click the **"Demo Logins"** button in the navbar for 1-click instant login without typing passwords, or use these credentials:

| Role | Name | Email | Password | Assigned Vehicle / Stop |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin** | Principal Ananya Gupta | `admin@schoolway.com` | `admin123` | Complete Fleet Oversight |
| **👨‍👩‍👦 Parent 1** | Vikram Sharma | `vikram.parent@schoolway.com` | `parent123` | Child: Aarav (Class 6-B) &bull; Bus SW-01 &bull; Stop: Ramanthapur |
| **👨‍👩‍👦 Parent 2** | Sneha Reddy | `sneha.parent@schoolway.com` | `parent123` | Child: Ananya (Class 4-A) &bull; Bus SW-04 &bull; Stop: Narapally |
| **🚌 Driver 1** | Rajesh Kumar | `rajesh.driver@schoolway.com` | `driver123` | Bus SW-01 (`TS-08-UB-4122`) &bull; Route A |
| **🚌 Driver 2** | Venkat Rao | `venkat.driver@schoolway.com` | `driver123` | Bus SW-04 (`TS-07-EA-7184`) &bull; Route B |
| **🌐 Visitor** | Public Guest | *No Login Required* | *N/A* | Public Live Fleet & Stop Timelines |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on port 27017 (`mongodb://127.0.0.1:27017/schoolway`)

### Installation & Startup

1. **Install Dependencies**:
   ```bash
   # In server/
   cd server
   npm install

   # In client/
   cd ../client
   npm install
   ```

2. **Seed Database** *(Auto-seeds on first server run, but can be manually triggered)*:
   ```bash
   cd server
   npm run seed
   ```

3. **Start Server**:
   ```bash
   cd server
   npm start
   # Server listens on http://localhost:5000 with WebSocket active
   ```

4. **Start Frontend Client**:
   ```bash
   cd client
   npm run dev
   # App opens at http://localhost:5173
   ```

5. **Run Both Concurrently from Root**:
   ```bash
   npm run dev
   ```

---

## ⚙️ Environment Configuration (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/schoolway
JWT_SECRET=schoolway_super_secret_jwt_key_hyd_2026
SIM_MODE=demo     # Options: 'demo' (3-second ticks) or 'realistic' (2-5 min intervals)
CLIENT_URL=http://localhost:5173
```

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, Vite, Vanilla CSS with custom Claymorphism design system, Leaflet with custom CartoDB Voyager raster tiles, Lucide Icons, Socket.IO Client.
- **Backend**: Node.js, Express, Socket.IO, Mongoose, JWT, bcryptjs.
- **Simulator**: Server-internal background loop executing polyline traversal, dwell scheduling, ETA recalculations, and room-based WebSocket broadcasts (`bus:<id>` and `fleet:all`).
- **Data Snapping**: Open Source Routing Machine (OSRM) driving profile with cached fallback.

---

## ☁️ Deployment Guide (Render & Vercel)

### Option 1: Render (Backend) + Vercel (Frontend) [Recommended]

#### 1. Deploy Backend on Render:
1. Go to [render.com](https://render.com) & click **New +** &rarr; **Web Service**.
2. Connect your GitHub repository: `https://github.com/uppalanchiabhiram235235-hue/SchoolWay.git`.
3. Configure the service:
   - **Name**: `schoolway-backend`
   - **Region**: Singapore (or nearest)
   - **Branch**: `main`
   - **Root Directory**: leave blank (or `server`)
   - **Build Command**: `npm install && npm --prefix server install`
   - **Start Command**: `node server/src/index.js`
4. Set Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/schoolway?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_random_secret_key_here`
   - `SIM_MODE`: `demo`
   - `CLIENT_URL`: `*`
5. Click **Deploy Web Service** and copy your backend URL (e.g. `https://schoolway-backend.onrender.com`).

#### 2. Deploy Frontend on Vercel:
1. Go to [vercel.com](https://vercel.com) & click **Add New** &rarr; **Project**.
2. Import the `SchoolWay` GitHub repository.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` (or `./`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://schoolway-backend.onrender.com` (your Render URL from step 1)
5. Click **Deploy**!

---

### Option 2: Full-Stack on Render (Single Web Service)
1. In Render, select **Blueprint** or **Web Service**.
2. Build command: `npm run build`
3. Start command: `npm start`
4. The Express server automatically serves both the API/WebSocket and the built Vite React frontend (`client/dist`).

