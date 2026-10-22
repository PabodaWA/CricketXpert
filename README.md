# 🏏 CricketXpert

A comprehensive MERN stack platform for cricket gear sales, coaching management, facility booking, finance operations, and role-based access control.

Live Demo 
https://cricket-xpert.vercel.app/


---

## 📋 Table of Contents

- [Screenshots](#-screenshots)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Team Members](#-team-members)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📸 Screenshots

### Home Page
![Home Page](screanshots/homepage.png)

### Coaching Programs
![Product Catalog](screanshots/coachingprograms.png)

### Coaching Dashboard
![Coaching Dashboard](screanshots/coach.png)

### Coach Manager Dashboard
![Facility Booking](screanshots/coachmanager.png)

### Profile
![Admin Panel](screanshots/profile.png)


---

## ✨ Features

### 🛒 Online Store & Inventory Management
- Complete product catalog with images, detailed descriptions, and pricing
- Real-time stock level tracking with automated low-stock alerts
- Supplier management and restocking workflow
- Shopping cart functionality with secure checkout
- Automated invoice generation and order history

### 🧑‍🏫 Coaching Programs & Skill Development
- Structured coaching program enrollment system
- Interactive session scheduling with coach availability management
- Digital attendance tracking and progress monitoring
- Performance feedback and skill assessment tools
- Match video upload and review capabilities
- Automated certification generation upon program completion

### 🏟️ Ground & Facility Booking
- Real-time availability calendar with intuitive interface
- Flexible hourly booking system with instant confirmation
- Automated conflict prevention and validation
- Easy rescheduling and cancellation management
- Maintenance slot blocking for facility upkeep
- Interactive map view for facility selection

### 👥 User & Role Management
- Secure user registration and authentication
- JWT-based session management
- Comprehensive role-based access control system
- Roles include: Admin, Player, Coach, Supplier, Delivery Staff, Finance Manager
- Personalized user profiles with update capabilities
- Detailed activity logs and audit trails

### 💰 Finance & Reporting
- Automated payroll processing for coaches and delivery staff
- Supplier settlement tracking and payment management
- Comprehensive sales analytics and revenue reports
- Booking revenue tracking and forecasting
- Professional invoice and payslip generation
- Stakeholder payment notifications and reminders
- Financial dashboard with visual analytics

### 🔔 Notifications & Support
- Real-time alert system for bookings, payments, and cancellations
- Role-specific customizable message templates
- Multi-channel notification delivery
- Comprehensive FAQ section
- Contact form with ticket management
- AI-powered chatbot support for common queries

---

## 🎯 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React.js with modern hooks and context API |
| **Backend** | Node.js with Express.js framework |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT) |
| **Authorization** | Role-Based Access Control (RBAC) |
| **File Handling** | Multer for uploads, Cloudinary for storage |
| **Notifications** | Socket.io for real-time updates |
| **Styling** | CSS3 / Tailwind CSS / Material-UI |

---

## 📦 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v14.x or higher)
- **npm** (v6.x or higher) or **yarn**
- **MongoDB** (v4.x or higher) - Local installation or MongoDB Atlas account
- **Git** for version control

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cricketxpert.git
cd cricketxpert
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd Frontend
npm install
cd ..
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/cricketxpert
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cricketxpert

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# File Upload (Optional - if using Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Payment Gateway (Optional)
PAYMENT_API_KEY=your_payment_gateway_key
```

Create a `.env` file in the `Frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Running the Application

### Development Mode

#### Option 1: Run Both Servers Concurrently (Recommended)

From the root directory:

```bash
npm run dev
```

This will start both the backend server and frontend development server simultaneously.

#### Option 2: Run Servers Separately

**Terminal 1 - Backend Server:**
```bash
npm run server
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend Development Server:**
```bash
cd Frontend
npm run dev
```
Frontend will run on `http://localhost:5173` (or the port shown in terminal)

### Production Mode

#### Build Frontend

```bash
cd Frontend
npm run build
cd ..
```

#### Start Production Server

```bash
npm start
```

---

## 📁 Project Structure

```
cricketxpert/
├── Frontend/                  # React frontend application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page components
│   │   ├── context/          # Context API for state management
│   │   ├── services/         # API service functions
│   │   ├── utils/            # Helper functions
│   │   ├── App.jsx           # Main App component
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # Node.js backend
│   ├── config/               # Configuration files
│   ├── controllers/          # Route controllers
│   ├── models/               # Mongoose models
│   ├── routes/               # API routes
│   ├── middleware/           # Custom middleware
│   ├── utils/                # Utility functions
│   └── server.js             # Entry point
│
├── .env                      # Environment variables (not in repo)
├── .gitignore
├── package.json
└── README.md
```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/cricketxpert` |
| `JWT_SECRET` | Secret key for JWT signing | `your_secret_key_12345` |

### Optional Variables

| Variable | Description | Purpose |
|----------|-------------|---------|
| `CLOUDINARY_*` | Cloudinary credentials | File uploads to cloud |
| `EMAIL_*` | SMTP email configuration | Email notifications |
| `PAYMENT_API_KEY` | Payment gateway key | Online payments |

---

## 👨‍💻 Team Members

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/PabodaWA">
        <img src="https://github.com/PabodaWA.png" width="100px;" alt="Paboda Medhani"/>
        <br />
        <sub><b>Paboda Medhani</b></sub>
      </a>
      <br />
      <sub>Full Stack Developer</sub>
      <br />
      <a href="https://github.com/PabodaWA">GitHub</a>
    </td>
    <td align="center">
      <a href="https://github.com/Nadali2002">
        <img src="https://github.com/Nadali2002.png" width="100px;" alt="Nadali Devindi"/>
        <br />
        <sub><b>Nadali Devindi</b></sub>
      </a>
      <br />
      <sub>Full Stack Developer</sub>
      <br />
      <a href="https://github.com/Nadali2002">GitHub</a>
    </td>
    <td align="center">
      <a href="https://github.com/HimashaIndiwari">
        <img src="https://github.com/HimashaIndiwari.png" width="100px;" alt="Himasha Indiwari"/>
        <br />
        <sub><b>Himasha Indiwari</b></sub>
      </a>
      <br />
      <sub>Full Stack Developer</sub>
      <br />
      <a href="https://github.com/HimashaIndiwari">GitHub</a>
    </td>
    <td align="center">
      <a href="https://github.com/wenux2003">
        <img src="https://github.com/wenux2003.png" width="100px;" alt="Wenura Kavinda"/>
        <br />
        <sub><b>Wenura Kavinda</b></sub>
      </a>
      <br />
      <sub>Full Stack Developer</sub>
      <br />
      <a href="https://github.com/wenux2003">GitHub</a>
    </td>
  </tr>
</table>

<p align="center">
  <sub><i>Want to contribute? Check our <a href="#-contributing">Contributing Guidelines</a></i></sub>
</p>

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines

- Use ESLint and Prettier configurations provided
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- React.js community for amazing tools and libraries
- MongoDB team for excellent documentation
- All contributors who help improve this project

---

Made with ❤️ by the CricketXpert Team
