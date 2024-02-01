
# Chat-Server

It is a comprehensive exploration of backend development, where I deep dive into the details of building APIs, crafting middleware, defining routes, and understanding numerous other enlightening concepts.


## Table of Contents

- [Built with](#built-with)
- [Features](#features)
- [Used Packages](#used-packages)
- [The Process](#the-process)
- [What I Learned](#what-i-learned)
- [Running the Project](#running-the-project)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Usage](#usage)
- [Screenshots](#screenshots)



## Built with

[![Node.js](https://img.shields.io/badge/Node.js-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-blue)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-yellow)](https://socket.io/)



## Features

- Authentication

   - Login
   - Register
   - Send OTP
   - Verify OTP
   - Send Email
   - Forgot password
   - Reset password

- Protected Route

- Update User Profile



## Used Packages

Explore the packages that form the backbone of this project.

- **@sendgrid/mail:** A reliable package for sending emails using SendGrid's API.
- **bcryptjs:** Ensures secure and efficient password hashing for enhanced user security.
- **body-parser:** Simplifies handling of incoming request bodies in Express applications.
- **cors:** Enables Cross-Origin Resource Sharing for secure and controlled API access.
- **crypto:** Provides cryptographic functionalities essential for secure data handling.
- **dotenv:** Loads environment variables from a .env file, keeping sensitive data secure.
- **express:** The robust web application framework that powers this server.
- **express-mongo-sanitize:** Mitigates NoSQL injection attacks by sanitizing user input.
- **express-rate-limit:** Implements rate-limiting middleware to protect against abuse and brute-force attacks.
- **helmet:** Enhances security by setting various HTTP headers for Express applications.
- **jsonwebtoken:** Implements JSON Web Token (JWT) authentication for secure user sessions.
- **mongoose:** Elegant MongoDB object modeling for Node.js applications.
- **morgan:** HTTP request logger middleware for Express applications.
- **otp-generator:** Generates one-time passwords (OTPs) for enhanced authentication security.
- **xss:** Guards against cross-site scripting (XSS) attacks by sanitizing user input.## The Process

Follow these steps to organize your project structure:

1. **Create `server.js` file:** This file will be the entry point for your server.

2. **Create `app.js` file:** This file can be used to configure and initialize your Express application.

3. **Create `models` folder:** Organize your database schema by creating a folder called `models`. Inside it, create separate files for different schema definitions.

4. **Create `controller` folder:** For handling routes and business logic, create a folder called `controller`. Inside it, create files such as `auth.js` and `user.js` to house different handler functions.

5. **Create `utils` folder:** For utility functions that may be used across your application, create a folder named `utils`.

6. **Create `services` folder:** For specific services (e.g., mailing, notification), create a folder named `services`. Inside it, you can organize different functions based on the services provided.

7. **Create `routes` folder:** For setting up routing, create a folder called `routes`. Inside it, create files such as `auth.js` and `user.js` to define routes and route-specific logic.
## What I Learned

In the course of developing Chat Server, I acquired a wealth of knowledge and skills:

- **Backend Environment Setup:** Understanding the foundational steps to set up a backend environment as a beginner.
- **Backend Essentials:** Crafting APIs, implementing middleware, and defining routes to create a seamless backend architecture.
- **Express.js Proficiency:** Building a robust and efficient Express.js server to handle diverse functionalities.
- **Express Methods and Concepts:** Exploring various Express methods and concepts, delving into the extensive Express documentation.
- **Static File Serving:** Learning how to serve static files using Express for a more dynamic web application.
- **WebSocket Communication:** Mastering the implementation of real-time, bidirectional communication using Socket.io.

# Running the Project

## Prerequisites

Before you get started, ensure your machine is equipped with the following tools:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (Node Package Manager)

## Installation

1. Clone the repository or download the source code.

    ```bash
    https://github.com/gshubham804/Chat-Server.git

    cd chat-server
    ```

2. Install the project dependencies.

    ```bash
    npm install
    ```

## Usage

Now, let's kick off the project! Follow these steps:

- Start the server.
    ```bash
    node server.js
    ```

## Screenshots

![App Screenshot](https://via.placeholder.com/468x300?text=App+Screenshot+Here)

