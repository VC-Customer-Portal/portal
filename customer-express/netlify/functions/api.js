import express, { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from "resend";
import ServerlessHttp from 'serverless-http';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from "path";
import fs from "fs";
import xssClean from "xss-clean";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import https from "https";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient('https://tmpymdpnixbbeskepjlh.supabase.co', process.env.SUPABASE_KEY);
const reCaptchaKey = process.env.RECAPTCHA_SECRET;
const router = Router();
const app = express();
app.set('trust proxy', true);

const corsOptions = {
    origin: [
        'https://apdscustomerportal.online',  // your production domain
        'http://localhost:5173',              // your local development environment
        'http://127.0.0.1:5173',              // local IP for localhost (if needed)
      ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(express.json());
app.use(xssClean());

// Clickjacking Protection
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none';");
    next();
});

// HSTS for MITM protection
app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
});

// CSP for XSS Protection
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'trusted-cdn.com';");
    next();
});

// Limit Requests made to protect against DDOS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: (req, res) => {
        return req.ip;
    }
});

app.use(limiter)





/*
    TYPE : AUTH
    API Endpoints that are used for User Functionality
    Register, Login, Verify Email, Otp, Change Password, Forgot Password, Logout
*/



// API EndPoint used for Registering New User and 
// Sending Verify Email
// POST
// Request Body (fullname, email, password, capVal)
router.post('/register', async (req, res) => {
    const { fullname, email, password, capVal } = req.body;
    const timestamp = new Date().toISOString();
    const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${reCaptchaKey}&response=${capVal}`;

    try {

        const recaptchaResponse = await new Promise((resolve, reject) => {
            const req = https.request(recaptchaUrl, { method: 'POST' }, (response) => {
                let data = '';

                // Collect data chunks
                response.on('data', (chunk) => {
                    data += chunk;
                });

                // Resolve the promise when the response ends
                response.on('end', () => {
                    resolve(JSON.parse(data)); // Parse the JSON response
                });
            });

            // Handle errors
            req.on('error', (error) => {
                reject(error);
            });

            // End the request
            req.end();
        });

        // Check if reCAPTCHA validation was successful
        if (!recaptchaResponse.success) {
            return res.status(400).json({ message: 'ReCAPTCHA validation failed' });
        }

        // Check if user with the same email already exists
        console.info(`[${timestamp}] Checking for existing user with email: ${email}`);

        const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (selectError) {
            console.error(`[${timestamp}] Error querying database for user with email: ${email}`, selectError);
            return res.status(500).json({ message: 'Error checking for existing user', error: selectError.message });
        }

        if (existingUser) {
            console.warn(`[${timestamp}] User with email ${email} already exists. Cannot create new account.`);
            return res.status(400).json({
                message: "User with the same email already exists"
            });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate confirmation_gen
        const confirmationGen = generateConfirmationCode(10);

        // Insert new user into the database with confirmation_gen
        const { data: insertedUser, error: insertError } = await supabase
            .from('users')
            .insert([
                { fullname: fullname, email: email, password: hashedPassword, confirmation_gen: confirmationGen, confirmed_email: false }
            ])
            .select('id');  // Retrieve uuid directly

        if (insertError) {
            console.error(`[${timestamp}] Error inserting user into database: ${email}`, insertError);
            return res.status(500).json({ message: 'Error creating user', error: insertError.message });
        }

        const newUser = insertedUser[0];  // Get the newly inserted user's uuid
        console.log('New UUID: ', newUser)

        if (!newUser) {
            console.warn(`[${timestamp}] No user found after insert`);
            return res.status(400).json({
                message: "No user found after insert"
            });
        }

        // Construct confirmation link
        const confirmationLink = `https://dapper-creponne-3b9deb.netlify.app/api/confirm-email?id=${newUser.id}&confirmation_gen=${confirmationGen}`;

        await sendConfirmationEmail(email, fullname, confirmationLink);

        console.info(`[${timestamp}] User registered and confirmation email sent: ${email}`);
        return res.status(201).json({
            message: "User registered successfully, please check your email to confirm",
            user: { fullname, email }
        });

    } catch (error) {
        console.error(`[${timestamp}] Unexpected error during registration process:`, error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
});


// API EndPoint used for Confirming Users Email and 
// Sending them their Account Number with Email
// GET
// Request PARAMS (userid, confirmationgen)
router.get('/confirm-email', async (req, res) => {
    const { id, confirmation_gen } = req.query;

    try {
        // Fetch user based on id and confirmation_gen
        const { data: user, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .eq('confirmation_gen', confirmation_gen)
            .maybeSingle();

        if (selectError) {
            console.error(`Error fetching user for confirmation: ${selectError.message}`);
            return res.status(500).json({ message: 'Error fetching user for confirmation' });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid confirmation link or user not found' });
        }

        // Generate a random 8-digit account number
        const accountNumber = generateAccountNumber();

        // Get the current date as a date-only string (YYYY-MM-DD)
        const registerDate = new Date().toISOString().split('T')[0];

        // Update the user's confirmed_email status and set the account number
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                confirmed_email: true,
                confirmation_gen: null,  // Clear confirmation_gen after confirming
                account_number: accountNumber, // Set the generated account number
                register_date: registerDate  // Set the current date without time
            })
            .eq('id', id);

        if (updateError) {
            console.error(`Error updating user confirmation status: ${updateError.message}`);
            return res.status(500).json({ message: 'Error updating user confirmation status' });
        }

        await sendAccountEmail(user.email, user.fullname, accountNumber);

        // Redirect to success page after email confirmation
        return res.redirect('https://apdscustomerportal.online/login'); // Redirect to a different link/page after confirmation

    } catch (error) {
        console.error('Unexpected error during email confirmation:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
});


// API EndPoint used for Login for User and 
// Sending OTP Email
// POST
// Request Body (accountNumber, password, capVal)
router.post('/login', async (req, res) => {
    const { accountNumber, password, capVal } = req.body;
    const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${reCaptchaKey}&response=${capVal}`;

    try {
        const recaptchaResponse = await new Promise((resolve, reject) => {
            const req = https.request(recaptchaUrl, { method: 'POST' }, (response) => {
                let data = '';

                // Collect data chunks
                response.on('data', (chunk) => {
                    data += chunk;
                });

                // Resolve the promise when the response ends
                response.on('end', () => {
                    resolve(JSON.parse(data)); // Parse the JSON response
                });
            });

            // Handle errors
            req.on('error', (error) => {
                reject(error);
            });

            // End the request
            req.end();
        });

        // Check if reCAPTCHA validation was successful
        if (!recaptchaResponse.success) {
            return res.status(400).json({ message: 'ReCAPTCHA validation failed' });
        }

        // Fetch user based on email
        const { data: user, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('account_number', accountNumber)
            .maybeSingle();

        if (selectError) {
            console.error(`Error fetching user: ${selectError.message}`);
            return res.status(500).json({ message: 'Error fetching user' });
        }

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if email is confirmed
        if (user.confirmed_email === false) {
            return res.status(400).json({ message: 'Please verify your account' });
        }

        // Generate OTP
        const otp = generateOTP();

        // Create a session token
        const sessionToken = crypto.randomBytes(16).toString('hex');

        // Get the current date and time
        const loginDate = new Date().toISOString().slice(0, 16);

        // Save OTP in the database
        const { error: UpdateError } = await supabase
            .from('users')
            .update({
                login_otp: otp,
                session_token: sessionToken,
                login_date: loginDate
            })
            .eq('id', user.id);

        if (UpdateError) {
            console.error(`Error creating OTP: ${otpError.message}`);
            return res.status(500).json({ message: 'Error creating OTP' });
        }

        await sendOtpEmail(user.email, user.fullname, otp);

        // Respond with session token and redirect to OTP page
        return res.status(200).json({
            message: 'OTP sent to your email!',
            sessionToken: sessionToken,
        });

    } catch (error) {
        console.error('Unexpected error during login:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
});

// API Endpoint for Employee Login
// POST
// Request Body (employeeID, password, capVal)
router.post('/employeelogin', async (req, res) => {
    const { employeeID, password, capVal } = req.body;
    const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${reCaptchaKey}&response=${capVal}`;

    try {
        // Verify reCAPTCHA
        const recaptchaResponse = await new Promise((resolve, reject) => {
            const req = https.request(recaptchaUrl, { method: 'POST' }, (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });
            req.on('error', (error) => {
                reject(error);
            });
            req.end();
        });

        // Check if reCAPTCHA validation was successful
        if (!recaptchaResponse.success) {
            return res.status(400).json({ message: 'ReCAPTCHA validation failed' });
        }

        // Fetch employee based on employeeID
        const { data: employee, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('account_number', employeeID)
            .maybeSingle();

        if (selectError) {
            console.error(`Error fetching employee: ${selectError.message}`);
            return res.status(500).json({ message: 'Error fetching employee' });
        }

        if (!employee) {
            return res.status(400).json({ message: 'Employee not found' });
        }

        // Check hashed password
        const isPasswordMatch = await bcrypt.compare(password, employee.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create a session token
        const sessionToken = crypto.randomBytes(16).toString('hex');

        // Save session token in the database
        const { error: updateError } = await supabase
            .from('users')
            .update({
                session_token: sessionToken
            })
            .eq('id', employee.id);

        if (updateError) {
            console.error(`Error updating session token: ${updateError.message}`);
            return res.status(500).json({ message: 'Error creating session' });
        }

        // Respond with session token
        return res.status(200).json({
            message: 'Login successful',
            sessionToken: sessionToken,
        });

    } catch (error) {
        console.error('Unexpected error during employee login:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
});


// API EndPoint used for Verifying OTP user used to Login
// POST
// Request Body (otp, sessionToken)
router.post('/verify-otp', async (req, res) => {
    const { otp, sessionToken } = req.body;

    try {
        // Fetch user based on session token
        const { data: user, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('session_token', sessionToken)
            .maybeSingle();

        if (selectError) {
            console.error(`Error fetching user for OTP verification: ${selectError.message}`);
            return res.status(500).json({ message: 'Error fetching user for OTP verification' });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid session token' });
        }

        // Check if OTP matches
        if (user.login_otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Optionally, clear the OTP after successful verification
        await supabase
            .from('users')
            .update({ login_otp: null, otp_complete: true }) // Clear the OTP and session token
            .eq('id', user.id);

        // Here you can log the user in and create a session in your app
        // For example, create a JWT or simply send a success message
        return res.status(200).json({ message: 'Login successful!' });

    } catch (error) {
        console.error('Unexpected error during OTP verification:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
});


// API EndPoint used for Reseting Users Password and 
// Sending them their new Password with Email
// Post
// Request PARAMS (accountNumber, token)
router.post('/forgotpassword', async (req, res) => {
    const { accountNumber, token } = req.query;

    try {
        // Fetch user based on id and confirmation_gen
        const { data: user, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('session_token', token)
            .eq('account_number', accountNumber)
            .maybeSingle();

        if (selectError) {
            console.error(`Error fetching user for forgot password: ${selectError.message}`);
            return res.status(500).json({ message: 'Error fetching user for forgot password' });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid forgot password link or user not found' });
        }

        const passwordGenerated = generatePassword();

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(passwordGenerated, saltRounds);

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword
            })
            .eq('id', user.id);

        if (updateError) {
            console.error(`Error updating user password: ${updateError.message}`);
            return res.status(500).json({ message: 'Error updating user password' });
        }

        await sendPasswordEmail(user.email, user.fullname, passwordGenerated);

        // Redirect to success page after email confirmation
        return res.redirect('https://apdscustomerportal.online/login'); // Redirect to a different link/page after confirmation

    } catch (error) {
        console.error('Unexpected error during dorgot password:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
});


// API EndPoint used to Change Password of Authenticated User
// POST
// Request Body (token, password, newpassword)
router.post('/changepassword', async (req, res) => {
    const { token, password, newpassword } = req.body;

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', token)  // Ensure to use the provided token
        .maybeSingle();

    if (selectError) {
        console.error(`Error fetching user with session token: ${selectError.message}`);
        return res.status(500).json({ message: 'Error fetching addresses' });
    }

    // Check if a user was found
    if (!user) {
        return res.status(400).json({ message: 'Invalid session token' });
    }

    // Check hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        return res.status(400).json({ message: 'Current Invalid Password' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newpassword, saltRounds);

    const { data: passwordChange, error: passwordError } = await supabase
        .from('users')
        .update({ password: hashedPassword }) // Clear the OTP and session token
        .eq('id', user.id);

    if (passwordError) {
        console.error(`Error Changing Pasword`);
        return res.status(500).json({ message: 'Error Changing Password' });
    }

    return res.status(200).json({ message: 'Password Changed Successfully!' });
});


// API EndPoint used to Logout User and clear sessiontoken and otp
// POST
// Request Body (token, password, newpassword)
router.post('/logout', async (req, res) => {
    const { sessionToken } = req.body;

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', sessionToken)  // Ensure to use the provided token
        .maybeSingle();

    if (selectError) {
        console.error(`Error logout user with session token: ${selectError.message}`);
        return res.status(500).json({ message: 'Error during logout...' });
    }

    // Check if a user was found
    if (!user) {
        return res.status(400).json({ message: 'Invalid session token' });
    }

    await supabase
        .from('users')
        .update({ session_token: null, otp_complete: false }) // Clear the OTP and session token
        .eq('id', user.id);

    return res.status(200).json({ message: 'Logout successful!' });
});




/*
    TYPE : USER CALLED ENDPOINTS
    PROTECTED USING TOKEN FOR ALL CALLS TO VALIDATE
    API Endpoints that are used for User Functionality
    Register, Login, Verify Email, Otp, Change Password, Forgot Password, Logout
*/



// API EndPoint used to Add a new Address to a user
// POST
// Request Body (line_1, line_2, province, city, postal_code, token)
router.post('/address', async (req, res) => {
    const { line_1, line_2, province, city, postal_code, token } = req.body;

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', token)
        .maybeSingle();

    if (selectError) {
        console.error(`Error logout user with session token: ${selectError.message}`);
        return res.status(500).json({ message: 'Error during saving address' });
    }

    // Check if a user was found
    if (!user) {
        return res.status(400).json({ message: 'Invalid session token' });
    }

    const { error: addressError } = await supabase
        .from('address')
        .insert([{ user_id: user.id, line_1: line_1, line_2: line_2, province: province, city: city, postal_code: postal_code }]) // Clear the OTP and session token

    if (addressError) {
        return res.status(500).json({ message: 'Error during saving address' });
    }

    return res.status(200).json({ message: 'Address saved successfully!' });
});


// API EndPoint used to fetch all addresses of Authenticated User
// POST
// Request Body (token)
router.post('/myaddresses', async (req, res) => {
    const { token } = req.body;

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', token)  // Ensure to use the provided token
        .maybeSingle();

    if (selectError) {
        console.error(`Error fetching user with session token: ${selectError.message}`);
        return res.status(500).json({ message: 'Error fetching addresses' });
    }

    // Check if a user was found
    if (!user) {
        return res.status(400).json({ message: 'Invalid session token' });
    }

    const { data: addresses, error: addressError } = await supabase
        .from('address')
        .select('line_1, line_2, postal_code, province, user_id, city, id')
        .eq('user_id', user.id)

    if (addressError) {
        return res.status(500).json({ message: 'Error fetching addresses' });
    }

    return res.status(200).json({ message: 'Address saved successfully!', addresses: addresses });
});


// API EndPoint used to make a new payment for a Authenticted User and 
// Sending Email with Payment Information
// POST
// Request Body (email, fullName, paymentMethod, cardNumber, expirationDate, cvv, amount, token)
router.post("/payment", async (req, res) => {
    const { email, fullName, paymentMethod, cardNumber, expirationDate, cvv, amount, token } = req.body;

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', token)  // Ensure to use the provided token
        .maybeSingle();

    // Handle potential errors during user fetching
    if (selectError) {
        console.error(`Error fetching user with session token: ${selectError.message}`);
        return res.status(500).json({ message: 'Error fetching user with session token' });
    }

    // Check if a user was found
    if (!user) {
        return res.status(400).json({ message: 'Invalid session token' });
    }

    if (paymentMethod === 1 || paymentMethod === 3) {
        if (!validateCard(cardNumber)) {
            return res.status(400).json({ message: "Invalid card number." });
        }
        if (!validateExpirationDate(expirationDate)) {
            return res.status(400).json({ message: "Card is expired." });
        }
    }

    const paymentData = {
        method_id: paymentMethod, email: email, fullname: fullName, amount: amount, user_id: user.id
    };

    if (paymentMethod === "1" || paymentMethod === "3") {
        paymentData.card_number = cardNumber;
        paymentData.expire_date = expirationDate;
        paymentData.cvv = cvv;
    }

    // Save payment to Supabase
    const { data, error } = await supabase
        .from("payments")
        .insert([paymentData])
        .select()


    if (error) {
        return res.status(500).json({ message: "Error saving payment." });
    }

    const paymentMethodName = getPaymentMethodName(paymentMethod);

    await sendPaymentEmail(fullName, email, amount, paymentMethodName);

    // Return success response
    res.status(201).json({ message: "Payment processed successfully.", data });
});


// API EndPoint used to get payments of Authenticated User
// POST
// Request Body (token)
router.post('/mypayments', async (req, res) => {
    const { token } = req.body;

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', token)  // Ensure to use the provided token
        .maybeSingle();

    if (selectError) {
        console.error(`Error fetching user with session token: ${selectError.message}`);
        return res.status(500).json({ message: 'Error fetching addresses' });
    }

    // Check if a user was found
    if (!user) {
        return res.status(400).json({ message: 'Invalid session token' });
    }

    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, card_number, expire_date, cvv, fullname, email, method_id, id')
        .eq('user_id', user.id)

    if (paymentsError) {
        return res.status(500).json({ message: 'Error fetching addresses' });
    }

    return res.status(200).json({ message: 'Paymnets retrieved successfully!', payments: payments });
});


// API EndPoint used to fetch details of Authenticated User
// POST
// Request Body (token)
router.post('/userdetails', async (req, res) => {
    const { token } = req.body;

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('email, fullname, account_number')
        .eq('session_token', token)  // Ensure to use the provided token
        .maybeSingle();

    if (selectError) {
        console.error(`Error fetching user with session token: ${selectError.message}`);
        return res.status(500).json({ message: 'Error fetching addresses' });
    }

    // Check if a user was found
    if (!user) {
        return res.status(400).json({ message: 'Invalid session token' });
    }


    return res.status(200).json({ message: 'User retrieved successfully!', user: user });
});


// API EndPoint used to Update Information of Authenticated User
// POST
// Request Body (token, fullname, email)
router.post('/edituser', async (req, res) => {
    const { token, fullname, email } = req.body;

    const { data: user, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', token)  // Ensure to use the provided token
        .maybeSingle();

    if (selectError) {
        console.error(`Error fetching user with session token: ${selectError.message}`);
        return res.status(500).json({ message: 'Error fetching addresses' });
    }

    // Check if a user was found
    if (!user) {
        return res.status(400).json({ message: 'Invalid session token' });
    }

    await supabase
        .from('users')
        .update({ fullname: fullname, email: email }) // Clear the OTP and session token
        .eq('id', user.id);

    return res.status(200).json({ message: 'User updated successfully!', user: user });
});


// API EndPoint used when Authenticated User submits contact form and 
// Send Email with AI Response
// POST
// Request Body (token, password, newpassword)
router.post("/customerform", async (req, res) => {
    const { fullname, email, message } = req.body;

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are a helpful and professional customer service representative for the PayView Payment Portal. The PayView platform allows users to make payments and view a comprehensive record of all their transactions through interactive charts and tables. The portal's key features include secure payment options and detailed visualizations of payment history. Your job is to assist users with navigating these features, answering queries, and addressing any concerns they have.

When a user submits a question through the customer support form, you are required to generate a response that is well-structured and easy to understand. Ensure your responses are formatted strictly in HTML (no Markdown or plaintext). Use appropriate HTML tags such as <p> for paragraphs, <h3> for headings, <ul> or <ol> for lists, and <a> for links. Maintain a friendly, professional tone in all communications, ensuring that you answer the user’s query clearly and thoroughly.
Key Features to Emphasize:

    Payment Options:
        Users can make payments through four secure methods: Credit Card, Stripe, Apple Pay, and PayPal.
        Ensure you can explain the process of making payments, common troubleshooting tips, and how to resolve payment failures.

    Viewing Payment History:
        Users can view their payment history through both charts that visualize their payment methods and amounts, as well as a table that displays all payment transactions in detail.
        If users ask about understanding the charts, help them interpret the graphical representation of their payment trends and methods. The table allows users to filter and sort payment data for detailed review.

    Navigational Guidance:
        Always provide direct links to relevant sections of the portal when applicable.
        For example:
            Profile Editing(Navbar Right): <a href="https://apdscustomerportal.online/edit">Edit Profile</a>
            Make a Payment(Navbar Centre): <a href="https://apdscustomerportal.online/payment">Make a Payment</a>
            View Payments(Navbar Centre): <a href="https://apdscustomerportal.online/mypayments">View Payments</a>
            Contact Support(Dashboard): <a href="https://apdscustomerportal.online/dashboard#contact">Submit a Query</a>
        Ensure users know how to access these sections of the portal based on their query.

Guidelines for Responses:

    Personalize the response: Use the user's name in your reply. Ensure that the email and message they submitted are acknowledged directly in the reply.
    Friendly and professional tone: Use a warm, approachable tone, but maintain professionalism.
    HTML formatting: All responses must be formatted in HTML for proper display. Avoid Markdown or plaintext.
    
    The user ${fullname}, with email ${email}, has asked the following question: "${message}"`

    });

    try {
        // Try to get AI response with retry logic in case of service overload
        const responseText = await fetchAIResponseWithRetry(model, message, 3, 2000);

        // Send the AI-generated response via email
        await sendContactEmail(email, responseText);

        // Return the generated response as JSON
        res.status(200).json({ message: 'Expect a Email response shortly...' });
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({
            message: "Sorry, something went wrong. Please try again later.",
            error: error.message
        });
    }
});


// API Endpoint used to fetch users' data
// GET
// Request params
router.get('/users', async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(400).json({ message: 'Authorization header is missing' });
        }

        // Bearer token from the header (format "Bearer <token>")
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(400).json({ message: 'Bearer token is missing' });
        }

        // Verify the token
        const { data: user, error: authError } = await supabase
            .from('users')
            .select('*')
            .eq('session_token', token)  // Ensure to use the provided token
            .maybeSingle();

        if (authError) {
            console.error('Error authenticating token:', authError.message);
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        // Check if a user was found
        if (!user) {
            return res.status(400).json({ message: 'Invalid session token' });
        }

        // If the user is authenticated, fetch all users from the database (excluding employees)
        const { data: users, error: selectError } = await supabase
            .from('users')
            .select('id, email ,register_date, login_date, fullname')
            .neq('isEmployee', true);  // Ensure to not pull employees

        if (selectError) {
            console.error(`Error fetching users: ${selectError.message}`);
            return res.status(500).json({ message: 'Error fetching users' });
        }

        // Check if users were found
        if (!users || users.length === 0) {
            return res.status(400).json({ message: 'No Users Found' });
        }

        // Send the list of users back in the response
        return res.status(200).json({ message: 'Users fetched successfully', users: users });

    } catch (error) {
        console.error('Unexpected error fetching users:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
});


// API EndPoint used to get all Trasactions
// GET
// Request Body (token)
router.get('/transactions', async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(400).json({ message: 'Authorization header is missing' });
        }

        // Bearer token from the header (format "Bearer <token>")
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(400).json({ message: 'Bearer token is missing' });
        }

        // Verify the token
        const { data: user, error: authError } = await supabase
            .from('users')
            .select('*')
            .eq('session_token', token)  // Ensure to use the provided token
            .maybeSingle();

        if (authError) {
            console.error('Error authenticating token:', authError.message);
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        // Check if a user was found
        if (!user) {
            return res.status(400).json({ message: 'Invalid session token' });
        }

        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount, method_id, id, user_id, created_at')

        if (paymentsError) {
            return res.status(500).json({ message: 'Error fetching payments', error: paymentsError.message });
        }

        return res.status(200).json({ message: 'Payments retrieved successfully!', transactions: payments });
    } catch (error) {
        console.error('Unexpected error fetching users:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
});




/*
    TYPE : HELPER FUNCTIONS
    API Endpoints that are used for User Functionality
    Register, Login, Verify Email, Otp, Change Password, Forgot Password, Logout
*/



// Helper Function used to get AI response for Contact Form
// Caller (/customerform)
// RETURN (resonse or error)
// PARAMS (model, message, retries, delay)
async function fetchAIResponseWithRetry(model, message, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(message);
            return await result.response.text();
        } catch (error) {
            if (error.status === 503) {
                console.error(`Model service unavailable, retrying attempt ${i + 1} of ${retries}`);
                await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
            } else {
                throw error; // Rethrow if it's not a 503 error
            }
        }
    }
    throw new Error("The model is overloaded. Please try again later."); // After retries
}

// Helper Function used to Generate Confirmation Code
// Caller (/register)
// RETURN (confirmationCode)
// PARAMS (length)
const generateConfirmationCode = (length) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// Helper Function used to Generate Account Number
// Caller (/confirm-email)
// RETURN (accountNumber)
// PARAMS (none)
const generateAccountNumber = () => {
    return Math.floor(10000000 + Math.random() * 90000000);
};

// Helper Function used to Generate OTP
// Caller (/login)
// RETURN (otp)
// PARAMS (none)
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000); // Ensures a 6-digit number
};

// Helper Function used to Generate Password
// Caller (/forgotpassword)
// RETURN (password)
// PARAMS (none)
function generatePassword() {
    const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*(),.?":{}|<>';

    let password = '';

    // Ensure at least one character from each category
    password += upperCaseChars[Math.floor(Math.random() * upperCaseChars.length)];
    password += lowerCaseChars[Math.floor(Math.random() * lowerCaseChars.length)];
    password += numberChars[Math.floor(Math.random() * numberChars.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Generate remaining characters randomly
    const allChars = upperCaseChars + lowerCaseChars + numberChars + specialChars;
    const remainingLength = 8 - password.length;

    for (let i = 0; i < remainingLength; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable order
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Helper Function used to validate a Card Number (Credit Card, Stripe)
// Caller (/payment)
// RETURN (true or false)
// PARAMS (cardNumber)
const validateCard = (cardNumber) => {
    const nDigits = cardNumber.length;
    let sum = 0;
    let isSecond = false;
    for (let i = nDigits - 1; i >= 0; i--) {
        let d = cardNumber.charAt(i);
        if (isSecond) {
            d = (parseInt(d) * 2).toString();
            if (d.length > 1) {
                d = (parseInt(d.charAt(0)) + parseInt(d.charAt(1))).toString();
            }
        }
        sum += parseInt(d);
        isSecond = !isSecond;
    }
    return sum % 10 === 0;
};

// Helper Function used to validate a Cards Expiration Date (Credit Card, Stripe)
// Caller (/payment)
// RETURN (true or false)
// PARAMS (expirationDate)
const validateExpirationDate = (expirationDate) => {
    const [month, year] = expirationDate.split("/").map((item) => parseInt(item, 10));
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear() % 100; // Get last two digits of the year

    // Check if the card is expired
    return (
        year > currentYear || (year === currentYear && month >= currentMonth)
    );
};

// Helper Function used to get Payment name for sending Payment Email
// Caller (/payment)
// RETURN (Payment Name)
// PARAMS (paymentMethod)
const getPaymentMethodName = (paymentMethod) => {
    switch (paymentMethod) {
        case 1:
            return "Credit Card";
        case 2:
            return "PayPal";
        case 3:
            return "Stripe";
        case 4:
            return "ApplePay";
        default:
            return "Unknown";
    }
};




/*
    TYPE : HELPER FUNCTIONS
    API Endpoints that are used for User Functionality
    Register, Login, Verify Email, Otp, Change Password, Forgot Password, Logout
*/



// Helper Function used to send Confirmation Email
// Caller (/)
// RETURN (none)
// PARAMS (email, fullname, confirmationlink)
const sendConfirmationEmail = async (email, fullname, confirmationlink) => {
    try {
        const htmlMessage = getConfirmHtmlTemplate(fullname, confirmationlink);

        const { data, error } = await resend.emails.send({
            from: "APDS Verify Email <noreplyverify@apdscustomerportal.online>",
            to: [email],
            subject: "Confirm your email",
            html: htmlMessage,
        });

        if (error) {
            console.error(`Failed to send email: ${error.message}`);
        } else {
            console.log('Email sent:', data);
        }

    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Helper Function used to send Account Number Email
// Caller (/)
// RETURN (none)
// PARAMS (email, fullname, accountNumber)
const sendAccountEmail = async (email, fullname, accountNumber) => {
    try {
        const htmlMessage = getAccountHtmlTemplate(fullname, accountNumber);

        const { data, error } = await resend.emails.send({
            from: "APDS Verify Email <noreplyverify@apdscustomerportal.online>",
            to: [email],
            subject: "Account Number",
            html: htmlMessage,
        });

        if (error) {
            console.error(`Failed to send email: ${error.message}`);
        } else {
            console.log('Email sent:', data);
        }

    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Helper Function used to send OTP Email
// Caller (/)
// RETURN (none)
// PARAMS (email, fullname, otp)
const sendOtpEmail = async (email, fullname, otp) => {
    try {
        const htmlMessage = getOtpHtmlTemplate(fullname, otp);

        const { data, error } = await resend.emails.send({
            from: "APDS Verify Email <noreplyverify@apdscustomerportal.online>",
            to: [email],
            subject: "OTP",
            html: htmlMessage,
        });

        if (error) {
            console.error(`Failed to send email: ${error.message}`);
        } else {
            console.log('Email sent:', data);
        }

    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Helper Function used to send Payment Email
// Caller (/)
// RETURN (none)
// PARAMS (fullname, email, amount, paymentMethod)
const sendPaymentEmail = async (fullname, email, amount, paymentMethod) => {
    try {

        const htmlMessage = getPaymentHtmlTemplate(fullname, amount, paymentMethod)

        const { data, error } = await resend.emails.send({
            from: "APDS Payment Confirmation <noreplypayment@apdscustomerportal.online>",
            to: [email],
            subject: "Payment Sucessful!",
            html: htmlMessage,
        });

        if (error) {
            console.error(`Failed to send email: ${error.message}`);
        } else {
            console.log('Email sent:', data);
        }

    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Helper Function used to send Generated Password
// Caller (/)
// RETURN (none)
// PARAMS (email, fullname, password)
const sendPasswordEmail = async (email, fullname, password) => {
    try {
        const htmlMessage = getPasswordHtmlTemplate(fullname, password);

        const { data, error } = await resend.emails.send({
            from: "APDS Customer Portal <passwordreset@apdscustomerportal.online>",
            to: [email],
            subject: "Password Reset",
            html: htmlMessage,
        });

        if (error) {
            console.error(`Failed to send email: ${error.message}`);
        } else {
            console.log('Email sent:', data);
        }

    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Helper Function used to send Contact Email from AI
// Caller (/)
// RETURN (none)
// PARAMS (email, htmlMessage)
const sendContactEmail = async (email, htmlMessage) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "APDS Customer Portal <help@apdscustomerportal.online>",
            to: [email],
            subject: "Customer Service Response",
            html: htmlMessage,
        });

        if (error) {
            console.error(`Failed to send email: ${error.message}`);
        } else {
            console.log('Email sent:', data);
        }

    } catch (error) {
        console.error('Error sending email:', error);
    }
};


// Helper Function used to get HTML tempalte for Confirm Email
// Caller (sendConfirmationEmail())
// RETURN (html)
// PARAMS (fullname, confirmationLink)
const getConfirmHtmlTemplate = (fullname, confirmationLink) => {
    const filePath = path.join(__dirname, 'confirmemail.html'); // adjust path as necessary
    let html = fs.readFileSync(filePath, 'utf-8'); // read HTML file

    // Replace placeholders with dynamic values
    html = html.replace('{{fullname}}', fullname);
    html = html.replace('{{confirmationLink}}', confirmationLink);

    return html;
};

// Helper Function used to get HTML tempalte for Account Number Email
// Caller (sendAccountEmail())
// RETURN (html)
// PARAMS (fullname, accountNumber)
const getAccountHtmlTemplate = (fullname, accountNumber) => {
    const filePath = path.join(__dirname, 'accountemail.html'); // adjust path as necessary
    let html = fs.readFileSync(filePath, 'utf-8'); // read HTML file

    // Replace placeholders with dynamic values
    html = html.replace('{{fullname}}', fullname);
    html = html.replace('{{accountNumber}}', accountNumber);

    return html;
};

// Helper Function used to get HTML tempalte for Account Number Email
// Caller (sendOtpEmail())
// RETURN (html)
// PARAMS (fullname, otp)
const getOtpHtmlTemplate = (fullname, otp) => {
    const filePath = path.join(__dirname, 'otpemail.html'); // adjust path as necessary
    let html = fs.readFileSync(filePath, 'utf-8'); // read HTML file

    // Replace placeholders with dynamic values
    html = html.replace('{{fullname}}', fullname);
    html = html.replace('{{otp}}', otp);

    return html;
};

// Helper Function used to get HTML tempalte for Account Number Email
// Caller (sendOtpEmail())
// RETURN (html)
// PARAMS (fullname, otp)
const getPasswordHtmlTemplate = (fullname, password) => {
    const filePath = path.join(__dirname, 'passwordemail.html'); // adjust path as necessary
    let html = fs.readFileSync(filePath, 'utf-8'); // read HTML file

    // Replace placeholders with dynamic values
    html = html.replace('{{fullname}}', fullname);
    html = html.replace('{{password}}', password);

    return html;
};

// Helper Function used to get HTML tempalte for Payment Email
// Caller (sendPaymentEmail())
// RETURN (html)
// PARAMS (fullname, amount, paymentMethod)
const getPaymentHtmlTemplate = (fullname, amount, paymentMethod) => {
    const filePath = path.join(__dirname, 'paymentemail.html'); // adjust path as necessary
    let html = fs.readFileSync(filePath, 'utf-8'); // read HTML file

    // Replace placeholders with dynamic values
    html = html.replace('{{fullname}}', fullname);
    html = html.replace('{{paymentMethod}}', paymentMethod);
    html = html.replace('{{amount}}', amount);

    return html;
};


app.use('/api/', router)
export const handler = ServerlessHttp(app);
