import express, { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from "resend";
import ServerlessHttp from 'serverless-http';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient('https://tmpymdpnixbbeskepjlh.supabase.co', process.env.SUPABASE_KEY)
const router = Router();
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Allow requests from all origins
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// Function to send email
const sendConfirmationEmail = async (email, htmlMessage) => {
    try {
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

const sendPaymentEmail = async (email, htmlMessage) => {
    try {
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


// Helper to generate a random string
const generateConfirmationCode = (length) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

const generateAccountNumber = () => {
    return Math.floor(10000000 + Math.random() * 90000000);
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000); // Ensures a 6-digit number
};

// Updated register route to handle sending confirmation email
router.post('/register', async (req, res) => {
    const { fullname, email, password } = req.body;
    const timestamp = new Date().toISOString();

    try {
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
        const confirmationLink = `http://localhost:8888/api/confirm-email?id=${newUser.id}&confirmation_gen=${confirmationGen}`;

        // Send confirmation email
        const emailMessage = `
            <p>Hi ${fullname},</p>
            <p>Please confirm your email by clicking the link below:</p>
            <a href="${confirmationLink}">Confirm Email</a>
        `;

        await sendConfirmationEmail(email, emailMessage);

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

        // Update the user's confirmed_email status and set the account number
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                confirmed_email: true,
                confirmation_gen: null,  // Clear confirmation_gen after confirming
                account_number: accountNumber // Set the generated account number
            })
            .eq('id', id);

        if (updateError) {
            console.error(`Error updating user confirmation status: ${updateError.message}`);
            return res.status(500).json({ message: 'Error updating user confirmation status' });
        }

        // Send confirmation email
        const emailMessage = `
            <p>Hi ${user.fullname},</p>
            <p>Bellow is your account number you can use when signing in:</p>
            <p>${accountNumber}</p>
        `;

        await sendConfirmationEmail(user.email, emailMessage);

        // Redirect to success page after email confirmation
        return res.redirect('http://localhost:5173/login'); // Redirect to a different link/page after confirmation

    } catch (error) {
        console.error('Unexpected error during email confirmation:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    const { accountNumber, password } = req.body;

    try {
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
        if (!user.confirmed_email) {
            return res.status(400).json({ message: 'Please verify your account' });
        }

        // Generate OTP
        const otp = generateOTP();

        // Create a session token
        const sessionToken = crypto.randomBytes(16).toString('hex');

        // Save OTP in the database
        const { error: UpdateError } = await supabase
            .from('users')
            .update({
                login_otp: otp,
                session_token: sessionToken
            })
            .eq('id', user.id);

        if (UpdateError) {
            console.error(`Error creating OTP: ${otpError.message}`);
            return res.status(500).json({ message: 'Error creating OTP' });
        }

        // Send confirmation email
        const emailMessage = `
            <p>Hi ${user.fullname},</p>
            <p>Bellow is your OTP you can use to login:</p>
            <p>${otp}</p>
        `;

        await sendConfirmationEmail(user.email, emailMessage);


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

// Validate session endpoint
router.post('/validate-session', async (req, res) => {
    const { token } = req.body;

    // Ensure the token is provided
    if (!token) {
        return res.status(400).json({ message: 'Session token is required' });
    }

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

    // Respond with user data and otp_complete status
    return res.status(200).json({
        message: 'Session token is valid',
        otp_complete: user.otp_complete // Assuming otp_complete is a field in the users table
    });
});

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

// Function to validate expiration date
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

    const emailMessage = `
            <p>Hi ${fullName},</p>
            <p>Payment was Sucessful:</p>
            <p>Amount: R ${amount} </p>
        `;

    await sendPaymentEmail(email, emailMessage);

    // Return success response
    res.status(201).json({ message: "Payment processed successfully.", data });
});

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


// Fetch User Details Endpoint (refactored)
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

// Update User Details Endpoint
router.put('/user', async (req, res) => {

});

// Helper function to retry the AI request in case of service overload
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

router.post("/customerform", async (req, res) => {
    const { fullname, email, message } = req.body;

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are a helpful and professional customer service representative. The user ${fullname}, with email ${email}, has asked the following question: "${message}". Please respond in a friendly and informative tone, ensuring that the response is formatted strictly in HTML (no markdown or plaintext allowed). Include HTML tags for proper formatting, such as paragraphs, headings, and lists if necessary.

Ensure the sign-off is structured as follows:
<p>Thanks for getting in contact,</p>
<p><strong>APDS Customer Portal</strong></p>`

    });

    try {
        // Try to get AI response with retry logic in case of service overload
        const responseText = await fetchAIResponseWithRetry(model, message, 3, 2000);

        // Send the AI-generated response via email
        await sendEmail(email, responseText);

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

// Function to send email
const sendEmail = async (email, htmlMessage) => {
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

app.use('/api/', router)
export const handler = ServerlessHttp(app);
