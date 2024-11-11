# PayView Payment Portal Documentation

Students:
- Rahul Singh (ST10078034)
- Tanner Frank (ST10209390)
- Darshan Chetty (ST10226392)
- Tashen Pillay (ST10044707)
- Saneliso Lehlohla (ST10031913)

<div style="text-align: center; margin: 20px 0;">
    <a href="https://apdscustomerportal.online" style="display: inline-block; padding: 15px 30px; font-size: 20px; color: white; background-color: #007bff; border-radius: 5px; text-decoration: none;">
        You can use the website here
    </a>
</div>

## Login Test:
```
Emplyee ID : 55306855
Employee Password: Password@1234
```
## Security Measures

To ensure the security of the PayView Payment Portal, the following measures have been implemented against common attacks:

### 1. Session Jacking
- Regenerate Session ID on every login and use OTP for verification of login.

### 2. Clickjacking
- Implemented Z-Frame-Options Header.
- Configured Content Security Policy (CSP).

### 3. SQL Injection
- Utilized Supabase SDK, parameterized queries, and input validation.

### 4. Cross-Site Scripting (XSS)
- Configured Content Security Policy (CSP).

### 5. Man-in-the-Middle (MITM)
- Enforced HTTPS.
- Enabled HTTP Strict Transport Security (HSTS).

### 6. DDoS Attacks
- Implemented rate limiting.
- Used CAPTCHA for login and registration.

### Additional Measures
- Included CORS as needed.
- SSL/TLS certificate configured using Netlify and the domain host.
- Hashing and salting of password before storing it in the database
- Used RegEx in Frontend to validate input

## Tutorial

[![Watch the video](https://img.youtube.com/vi/7AJ2V1-x7Vc/0.jpg)](https://www.youtube.com/watch?v=7AJ2V1-x7Vc)

## Prerequisites

Before running the application, make sure you have the following installed on your machine:

- **Node.js** (version 22.x or later)
- **npm** and **Yarn** package manager
- **Vite** (for frontend)
- **Express** (for API server)
- **netlifycli** (for running API)

**NOTE:**
USES SUPABASE AS THE BACKEND DATABASE

You will also need a `.env` file found in the root of `/customer-express` and `/frontend` directories with the following environment variables configured:

**For Backend**
- `RESEND_API_KEY` – To send emails to users.
- `GEMINI_API` – Gemini AI api key to make calls to AI.
- `SUPABASE_KEY` – Supabase API key for storing data.
- `RECAPTCHA_SECRET` - your Google reCAPTCHA site key for bot protection.

**For Frontend**
- `VITE_GEMINI` – Gemini AI api key to make calls to AI.
- `VITE_SITE_KEY` – Used for Google reCaptcha generation.
- `VITE_EXPRESS_URL` – Used to set the url for the backend api.

## How to Run the Application

### Frontend (React)

**Clone the repository:**

   ```bash
   git clone git@github.com:VC-Customer-Portal/portal.git
   cd portal/frontend
   yarn install
   yarn dev
   ```

### Backend (Express)

   ```bash
   git clone git@github.com:VC-Customer-Portal/portal.git
   cd portal/backend
   npm install
   npm run dev
  ```

## PayView Payment Portal Frontend Documentation

This document provides an overview of the frontend code for the PayView Payment Portal. The frontend is built using React, TypeScript, and Vite.

### Inputs

The frontend receives user input through various forms and components, including:

- **Registration Form:** Collects user information for account creation.
- **Login Form:** Takes user credentials for authentication.
- **Employee Login:** Login as an Employee
- **OTP Form:** Accepts the one-time password sent to the user's email.
- **Edit Profile Form:** Allows users to update their account details.
- **Payment Form:** Gathers payment information and address details.
- **Contact Form:** Takes user messages and inquiries.
- **Chat Component:** Enables user interaction with the virtual assistant.

### Outputs

The frontend presents information to the user through several components and pages, such as:

- **Dashboard:** Displays user account summary, payment options, and contact information.
- **User Payments:** Shows a list of previous payments and their details, both in a table format and visualized through charts (pie chart for payment distribution and bar chart for total amounts by payment method).
- **Payment Confirmation:** Provides feedback on the payment process, including success or error messages.
- **Notifications:** Presents alerts and updates related to user actions, like successful registration, profile edits, or payments.
- **Chat Responses:** Shows replies from the virtual assistant based on user input.
- **Employee Users Dashboard:** See all users
- **Employee Transactions:** See all Recent User Transations 

### Usage

Users can interact with the portal to:

- Create a new account.
- Log in to their existing account.
- Securely make payments using various methods (Credit Card, Stripe, PayPal, Apple Pay).
- Review their past payments.
- Update their profile information.
- Send inquiries and messages to the support team.
- Get help from the virtual assistant for navigating the portal and its features.

The frontend code aims to provide a user-friendly and secure interface for managing online payments and interacting with the portal's services.


## PayView API Documentation

This document outlines the API endpoints for the PayView Customer Portal, a platform designed for secure online payments and detailed visualization of payment history. The API facilitates user registration, login, payment processing, address management, and communication with customer support.

### Notes

* All API endpoints are assumed to be prefixed with `/api/`.
* All POST requests require a JSON body.
* The `sessionToken` is used to authenticate all user data endpoints and the customer support endpoint.
* The `capVal` parameter in `/register` and `/login` is used for reCAPTCHA validation to prevent bot submissions.
* Password complexity is enforced during registration and password changes.
* Successful payment processing through `/payment` will redirect the user to the dashboard. 

This documentation provides a high-level overview of the PayView Customer Portal API. For more detailed information, refer to the source code comments.

### Authentication Endpoints

These endpoints manage user authentication and related actions.

* **`/register` (POST)**
    * **Description:** Registers a new user. A verification email is sent to the provided email address.
    * **Input:**
        * `fullname`: User's full name (string)
        * `email`: User's email address (string)
        * `password`: User's desired password (string)
        * `capVal`: reCAPTCHA response token (string)
    * **Output:**
        * Success message: "User registered successfully, please check your email to confirm"
        * User object: `{ fullname, email }`

* **`/confirm-email` (GET)**
    * **Description:** Confirms a user's email address using a confirmation link sent during registration.  Upon successful confirmation, an email containing the user's account number is sent.
    * **Input (Query Parameters):**
        * `id`: User ID (string)
        * `confirmation_gen`: Confirmation code from the email link (string)
    * **Output:**
        * Redirects to the login page upon successful confirmation: `https://apdscustomerportal.online/login` 

* **`/login` (POST)**
    * **Description:** Logs in an existing user. Sends an OTP (One-Time Password) email to the user's confirmed email address.
    * **Input:**
        * `accountNumber`: User's account number (string)
        * `password`: User's password (string)
        * `capVal`: reCAPTCHA response token (string)
    * **Output:**
        * Success message: "OTP sent to your email!"
        * `sessionToken`: A unique session token (string)

* **`/verify-otp` (POST)**
    * **Description:** Verifies the OTP provided by the user during login.
    * **Input:**
        * `otp`: 6-digit OTP code (string)
        * `sessionToken`: Session token received during login (string)
    * **Output:**
        * Success message: "Login successful!"

* **`/forgotpassword` (POST)**
    * **Description:** Initiates a password reset. Sends an email containing a new, randomly generated password to the user's registered email address.
    * **Input (Query Parameters):**
        * `accountNumber`: User's account number (string)
        * `token`: User's session token (string) 
    * **Output:**
        * Redirects to the login page after sending the password reset email: `https://apdscustomerportal.online/login`

* **`/changepassword` (POST)**
    * **Description:** Changes the password of an authenticated user.
    * **Input:** 
        * `token`: User's session token (string)
        * `password`: User's current password (string)
        * `newpassword`: User's new password (string)
    * **Output:**
        * Success message: "Password Changed Successfully!"

* **`/logout` (POST)**
    * **Description:** Logs out a user and clears the `sessionToken` and `otp_complete` flag. 
    * **Input:**
        * `sessionToken`: User's session token (string)
    * **Output:**
        * Success message: "Logout successful!"

### User Data Endpoints

These endpoints manage user data and are protected by a session token.

* **`/address` (POST)**
    * **Description:** Adds a new address to a user's profile.
    * **Input:**
        * `line_1`: Street address (string)
        * `line_2`: Optional additional address line (string)
        * `province`: Province (string)
        * `city`: City (string)
        * `postal_code`: Postal code (string)
        * `token`: User's session token (string)
    * **Output:**
        * Success message: "Address saved successfully!"

* **`/myaddresses` (POST)**
    * **Description:** Retrieves all addresses associated with an authenticated user.
    * **Input:**
        * `token`: User's session token (string)
    * **Output:**
        * Success message: "Address saved successfully!" 
        * `addresses`: Array of address objects (array)

* **`/payment` (POST)**
    * **Description:** Processes a payment for an authenticated user. Validates card details for Credit Card and Stripe payments. Sends a confirmation email with payment information.
    * **Input:**
        * `email`: User's email address (string)
        * `fullName`: User's full name (string)
        * `paymentMethod`: Payment method ID (1 for Credit Card, 2 for PayPal, 3 for Stripe, 4 for Apple Pay) (integer)
        * `cardNumber`: Card number (required for Credit Card and Stripe) (string)
        * `expirationDate`: Card expiration date in MM/YY format (required for Credit Card and Stripe) (string)
        * `cvv`: Card CVV (required for Credit Card and Stripe) (string)
        * `amount`: Payment amount (number)
        * `token`: User's session token (string)
    * **Output:**
        * Success message: "Payment processed successfully."
        * Payment data object

* **`/mypayments` (POST)**
    * **Description:** Retrieves all payments associated with an authenticated user.
    * **Input:**
        * `token`: User's session token (string)
    * **Output:**
        * Success message: "Payments retrieved successfully!"
        * `payments`: Array of payment objects (array)

* **`/userdetails` (POST)**
    * **Description:** Fetches the details of an authenticated user.
    * **Input:**
        * `token`: User's session token (string)
    * **Output:**
        * Success message: "User retrieved successfully!"
        * `user`: User object: `{ email, fullname, account_number }` (object)

* **`/edituser` (POST)**
    * **Description:** Updates an authenticated user's full name and email address.
    * **Input:**
        * `token`: User's session token (string)
        * `fullname`: User's new full name (string)
        * `email`: User's new email address (string)
    * **Output:**
        * Success message: "User updated successfully!"
        * Updated user object (object)

### Customer Support Endpoint

* **`/customerform` (POST)**
    * **Description:** Processes a contact form submission from an authenticated user. Uses Google's Gemini AI model to generate a response to the user's message. Sends an email with the AI-generated response to the user's email address. 
    * **Input:**
        * `fullname`: User's full name (string)
        * `email`: User's email address (string)
        * `message`: User's message (string)
    * **Output:**
        * Success message: "Expect an email response shortly..."
     
### Circle-CI and SonarQube:
![image](https://github.com/user-attachments/assets/caee8fb5-0707-471d-bce2-c6e28de173d2)
![image](https://github.com/user-attachments/assets/04452387-9319-4a05-a0b5-95330a9dd066)
![image](https://github.com/user-attachments/assets/660d9b00-e341-4e3b-8727-ec0739b05b7d)
![image](https://github.com/user-attachments/assets/72057fb6-f659-406e-8a6c-095e50a91f3e)


### References:

Bhardwaj, A. (2023) Implementing recaptcha in react, Clerk. Available at: https://clerk.com/blog/implementing-recaptcha-in-react (Accessed: 08 October 2024). 

Express on netlify (no date) Netlify Docs. Available at: https://docs.netlify.com/frameworks/express/ (Accessed: 08 October 2024). 

Herbert, D. (2023) What is react.js? uses, examples, & more, HubSpot Blog. Available at: https://blog.hubspot.com/website/react-js (Accessed: 08 October 2024). 

Paul (2021) Deploy express.js on netlify, Medium. Available at: https://paulreaney.medium.com/deploy-express-js-on-netlify-91cfaea39591 (Accessed: 08 October 2024). 

Sahil, M. (2024) Integrating recaptcha V2 in a react project, Medium. Available at: https://medium.com/@sahil90085/integrating-recaptcha-v2-in-a-react-project-39b5d8eb3ee0 (Accessed: 08 October 2024). 

Supabase (2024) Use supabase with react, Supabase Docs. Available at: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs (Accessed: 08 October 2024). 

W3Schools (no date) React Tutorial, W3Schools Online Web Tutorials. Available at: https://www.w3schools.com/REACT/DEFAULT.ASP (Accessed: 08 October 2024). 
