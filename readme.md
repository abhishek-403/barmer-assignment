# ✈️ Barmer Assignment 

This repository contains **two assignments**:

1. **Web-Based Waypoint Management System** (Frontend - React + Mapbox)
2. **DNS Resolver with TTL Caching** (Backend - JavaScript (with Nodejs) + Raw Sockets)

## 📍 Assignment 1: Web-Based Waypoint Management System

Users can interact with an online map to add, edit, delete, and reorder waypoints, visualize paths, and export missions as JSON.
> Live Link : https://bramer-assignment.vercel.app/

### 🔧 Features

- 🧭 **Add Waypoints**: Click on the map to add a waypoint with `latitude`, `longitude`, `altitude`, and `sequence`.
- ✏️ **Edit Waypoints**: Modify waypoint properties by selecting them.
- ❌ **Delete Waypoints**: Remove waypoints from the mission.
- 🔀 **Reorder Waypoints**: Change the order using drag-and-drop.
- 🧵 **Draw Path**: Connect waypoints visually in the order of sequence.
- 📦 **Export Mission**: Download all waypoints as a JSON file.

### 📦 Tech Stack

- React.js
- Mapbox GL JS
- Tailwind CSS

### 🚀 Getting Started

#### Installation:
```bash
git clone https://github.com/abhishek-403/bramer-assignment.git
cd ./bramer-assignment/assignment-1
npm install
```

#### Create a .env file in the root of the project and add your Mapbox token:
```bash
 VITE_MAPBOX_TOKEN=your_mapbox_token_here 
```

#### Run the appplication:
```
npm run dev
```
# 🌐 Assignment 2: DNS Resolver with TTL Caching

A custom **DNS resolver** that sends raw DNS queries to public servers (to `8.8.8.8`) and caches responses based on TTL (Time-to-Live).
> It is CLI based so run it locally.

---

## ⚙️ Features

- 📡 **Manual Querying**: Send DNS queries manually using raw sockets.
- 📬 **Parse Responses**: Extract IP addresses and TTL from the DNS response packet.
- 📥 **TTL Caching**: Store DNS query results with TTL, returning cached data as long as the TTL is valid.
- 🔁 **Auto Re-query**: Automatically re-query the DNS server when the cached data has expired (based on TTL).

---

## 🐍 Tech Stack

- **JavaScript**
- **Nodejs**
- **`dgram`** library (for raw socket communication)
  
---

## ▶️ How to Run

1. **Clone the repository** (if you haven't already):

```bash
git clone https://github.com/abhishek-403/bramer-assignment.git
cd ./bramer-assignment/assignment-2
node index.js
```