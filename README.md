<div align="center">
  <h1>💬 Real-Time Chat Backend API</h1>
  <p>
    A robust, scalable backend architecture for real-time messaging applications.
  </p>

  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</div>

---

## 📖 Table of Contents

* [📝 Project Description](#-project-description)
* [✨ Features](#-features)
* [🛠 Tech Stack](#-tech-stack)
* [📂 Project Structure](#-project-structure)
* [🚀 Installation & Setup](#-installation--setup)
* [🔐 Environment Variables](#-environment-variables)
* [📡 REST API Documentation](#-rest-api-documentation)
* [⚡ Real-Time Events](#-real-time-events-socketio)
* [🗄 Database Schema](#-database-schema)
* [🏗 Architecture & Error Handling](#-architecture--error-handling)
* [🚀 Future Improvements](#-future-improvements)
* [👨‍💻 Author](#-author)

---

## 📝 Project Description

This repository contains the backend for a **Real-Time Chat Application** built with **Node.js, Express.js, TypeScript, Socket.IO, and PostgreSQL**.

The application is designed to provide reliable and instant communication between users through real-time bidirectional connections.

Unlike traditional HTTP-based communication, where clients may repeatedly request the server for new messages, Socket.IO enables the server to push events to connected clients as soon as they occur.

The backend also provides RESTful APIs for authentication, user management, chat management, and retrieving persistent message history.

---

## ✨ Features

* **Real-Time Messaging** using Socket.IO.
* **Authentication & Authorization** using JWT.
* **Private Chats** for one-to-one conversations.
* **Group Chats** with multiple members.
* **Chat Membership Management** with role-based permissions.
* **Persistent Message History** stored in PostgreSQL.
* **RESTful APIs** for managing users and chats.
* **Centralized Error Handling** for consistent API responses.
* **Async Error Handling** for Express and Socket.IO handlers.
* **PostgreSQL Transactions** for maintaining data consistency.
* **UUID-based Identifiers** for users, chats, and messages.
* **Environment-based Configuration** using dotenv.

---

## 🛠 Tech Stack

### Backend

* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** TypeScript
* **Real-Time Communication:** Socket.IO
* **Database:** PostgreSQL
* **Database Driver:** `pg`
* **Authentication:** JWT
* **Password Hashing:** bcrypt

### Development & Utilities

* dotenv
* CORS
* express-validator
* npm
* Git & GitHub

---

## 📂 Project Structure

```text
Real-time-chat/
├── src/
│   ├── config/
│   │   └── database.ts
│   │
│   ├── controllers/
│   │
│   ├── models/
│   │
│   ├── routes/
│   │
│   ├── middleware/
│   │
│   ├── sockets/
│   │
│   ├── utils/
│   │
│   ├── types/
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

> The exact structure may vary depending on the current implementation.

---

## 🚀 Installation & Setup

### Prerequisites

Make sure you have the following installed:

* Node.js 18+
* PostgreSQL
* npm
* Git

### 1. Clone the repository

```bash
git clone https://github.com/ahmed12334567/Real-time-chat.git
cd Real-time-chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then update the values according to your local PostgreSQL configuration.

### 4. Start the development server

```bash
npm run dev
```

The server should now be available at:

```text
http://localhost:3000
```

---

## 🔐 Environment Variables

Example `.env` configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=chat_db

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

> Never commit your real `.env` file or expose your JWT secret publicly.

---

## 📡 REST API Documentation

The backend exposes RESTful endpoints for authentication, users, chats, and messages.

### Authentication

| Method | Endpoint         | Description                             | Auth               |
| ------ | ---------------- | --------------------------------------- | ------------------ |
| `POST` | `/auth/register` | Register a new user                     | No                 |
| `POST` | `/auth/login`    | Login and receive authentication tokens | No                 |
| `POST` | `/auth/refresh`  | Generate a new access token             | No / Refresh Token |

### Chats

| Method | Endpoint                  | Description              | Auth |
| ------ | ------------------------- | ------------------------ | ---- |
| `GET`  | `/chats`                  | Get user's chats         | Yes  |
| `POST` | `/chats/private`          | Create a private chat    | Yes  |
| `GET`  | `/chats/:chatId`          | Get chat information     | Yes  |
| `GET`  | `/chats/:chatId/messages` | Get chat message history | Yes  |

### Chat Members

| Method   | Endpoint                           | Description            | Auth |
| -------- | ---------------------------------- | ---------------------- | ---- |
| `POST`   | `/chats/:chatId/members`           | Add a member to a chat | Yes  |
| `DELETE` | `/chats/:chatId/members/:memberId` | Remove a member        | Yes  |
| `PATCH`  | `/chats/:chatId/members/:memberId` | Update member role     | Yes  |

> Update the endpoint names above to match the exact routes implemented in the project.

---

## ⚡ Real-Time Events (Socket.IO)

Socket.IO is responsible for real-time communication between connected clients and the server.

### Connection

When a client establishes a connection:

```text
connection
```

The server can authenticate the socket and associate it with the current user.

### Chat Events

| Event             | Direction       | Purpose                        |
| ----------------- | --------------- | ------------------------------ |
| `connection`      | Client → Server | Establish Socket.IO connection |
| `join_room`       | Client → Server | Join a chat room               |
| `send_message`    | Client → Server | Send a new message             |
| `receive_message` | Server → Client | Deliver a new message          |
| `add_member`      | Client → Server | Add a member to a chat         |
| `disconnect`      | Client → Server | Handle socket disconnection    |

### Example: Send Message

Client:

```javascript
socket.emit("send_message", {
  chatId: "chat-uuid",
  content: "Hello!",
});
```

Server:

```text
send_message
      ↓
Validate user
      ↓
Validate chat membership
      ↓
Save message in PostgreSQL
      ↓
Emit receive_message
      ↓
Other connected members receive message
```

### Example: Receive Message

```javascript
socket.on("receive_message", (message) => {
  console.log(message);
});
```

---

## 🗄 Database Schema

The application uses PostgreSQL to persist users, chats, members, and messages.

### Users

Stores user authentication and profile information.

```text
users
├── id
├── username
├── email
├── password
└── created_at
```

### Chats

Stores chat information.

```text
chats
├── id
├── type
├── name
└── created_at
```

The chat type can represent different conversation types such as:

```text
private
group
```

### Chat Members

Represents the many-to-many relationship between users and chats.

```text
chat_members
├── chat_id
├── user_id
├── role
└── created_at
```

Possible roles:

```text
owner
member
viewer
```

### Messages

Stores messages sent inside chats.

```text
messages
├── id
├── chat_id
├── sender_id
├── content
└── created_at
```

### Relationships

```text
User
 │
 │ 1
 │
 ├──────────< Chat Members >──────────┐
 │                                    │
 │ N                                  │ N
 ▼                                    ▼
Chats ───────────────< Messages >──── User
```

More specifically:

* A user can belong to many chats.
* A chat can contain many users.
* A chat can contain many messages.
* Each message belongs to one chat.
* Each message is sent by one user.

---

## 🏗 Architecture & Error Handling

The project follows a layered backend architecture designed to separate responsibilities and keep the code maintainable.

### Request Flow

```text
Client
   │
   ▼
Express Route
   │
   ▼
Middleware
   │
   ▼
Controller
   │
   ▼
Model / Database
   │
   ▼
PostgreSQL
```

For real-time communication:

```text
Client
   │
   ▼
Socket.IO
   │
   ▼
Socket Handler
   │
   ▼
Validation / Authorization
   │
   ▼
Database
   │
   ▼
Socket.IO Event
   │
   ▼
Connected Clients
```

### Authentication Middleware

Protected HTTP routes verify the JWT before allowing the request to continue.

```text
Authorization Header
        ↓
Extract Token
        ↓
Verify JWT
        ↓
Get User ID
        ↓
Continue Request
```

### Socket Authentication

Socket connections can also be authenticated before allowing access to protected real-time events.

This prevents unauthorized users from joining chats or sending messages.

### Centralized Error Handling

Application errors are handled through centralized error middleware.

Example response:

```json
{
  "success": false,
  "error": "Message Not Found",
  "statusCode": 404
}
```

### Async Error Handling

Asynchronous operations are wrapped with handlers that forward rejected promises to the appropriate error handler instead of leaving unhandled promise rejections.

---

## 🔄 PostgreSQL Transactions

Transactions are used when multiple database operations must succeed or fail together.

Example:

```sql
BEGIN;

-- Create chat
-- Add first member
-- Add second member

COMMIT;
```

If an operation fails:

```sql
ROLLBACK;
```

This helps maintain database consistency and follows the core **ACID** principles:

* **Atomicity:** All operations succeed or none are applied.
* **Consistency:** Database constraints remain valid.
* **Isolation:** Concurrent transactions are isolated according to PostgreSQL's transaction model.
* **Durability:** Once committed, changes are persisted.

---

## 🚀 Future Improvements

* [ ] Read receipts
* [ ] Typing indicators
* [ ] Online / Offline presence
* [ ] Message editing
* [ ] Message deletion
* [ ] File and image uploads
* [ ] Push notifications
* [ ] Message pagination / cursor-based pagination
* [ ] Redis adapter for Socket.IO scaling
* [ ] Horizontal server scaling
* [ ] End-to-End Encryption
* [ ] Automated tests
* [ ] API documentation with Swagger/OpenAPI
* [ ] Docker support

---

## 📊 Scalability Considerations

The architecture can be extended to support larger numbers of concurrent users.

Potential scaling strategy:

```text
                ┌───────────────┐
                │    Client     │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ Load Balancer │
                └───────┬───────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
      ┌─────────────┐       ┌─────────────┐
      │ Node Server │       │ Node Server │
      │     #1      │       │     #2      │
      └──────┬──────┘       └──────┬──────┘
             │                     │
             └──────────┬──────────┘
                        ▼
                  ┌───────────┐
                  │   Redis   │
                  │ Socket.IO │
                  │   Adapter │
                  └─────┬─────┘
                        │
                        ▼
                  ┌───────────┐
                  │ PostgreSQL│
                  └───────────┘
```

Redis can be introduced later to synchronize Socket.IO events between multiple Node.js instances.

---

## 👨‍💻 Author

**Ahmed Abdulrahman**

Backend Developer focused on **Node.js, TypeScript, PostgreSQL, REST APIs, and Real-Time Applications**.

* GitHub: [@ahmed12334567](https://github.com/ahmed12334567)
* Repository: [Real-time-chat](https://github.com/ahmed12334567/Real-time-chat)

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

## 📄 License

This project is intended for educational and development purposes.
