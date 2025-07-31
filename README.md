# 📌 Garasiku Project Structure & Setup Guide

## 📂 Project Folder Structure
```
/project-root
│── /backend          # Backend (Node.js, Express, MongoDB)
│   ├── /models       # Database models (Mongoose)
│   ├── /routes       # API routes
│   ├── /controllers  # Business logic for API
│   ├── server.js     # Main server file
│   ├── .env          # Environment variables
│── /frontend         # Frontend (React.js)
│   ├── /src
│   │   ├── /components   # Reusable UI components
│   │   ├── /pages        # Different pages (CRUD, Home, etc.)
│   │   ├── App.js        # Main React component
│   │   ├── index.js      # React entry point
│   ├── package.json  # Frontend dependencies
│── package.json      # Root dependencies (if needed)
│── README.md         # Documentation (this file)
```

## 🚀 How to Run the Project

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/your-repo.git
cd your-repo
```

### 2️⃣ Setup the Backend (Server)

#### Install Dependencies
```sh
cd backend
npm install
```

#### Set Up Environment Variables
Create a `.env` file in the `/backend` folder and add:
```ini
PORT=5000
MONGO_URI=mongodb://localhost:27017/yourDatabase
```

#### Run the Backend
```sh
npm start
```
The backend should now run at `http://localhost:5000`

### 3️⃣ Setup the Frontend (React)

#### Install Dependencies
```sh
cd ../frontend
npm install
```

#### Start the Frontend
```sh
npm run dev
```
The frontend should now run at `http://localhost:5173`

## 📌 API Endpoints (Backend)
| Method  | Endpoint           | Description        |
|---------|--------------------|--------------------|
| GET     | /api/items         | Get all items     |
| POST    | /api/items         | Create an item    |
| PUT     | /api/items/:id     | Update an item    |
| DELETE  | /api/items/:id     | Delete an item    |

## 📌 Notes
- Ensure MongoDB is running locally or use MongoDB Atlas.
- CORS is enabled for frontend-backend communication.
- Modify `MONGO_URI` in `.env` if using a cloud database.

