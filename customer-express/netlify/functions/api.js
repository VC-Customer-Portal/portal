import admin from "firebase-admin";
import express, { Router } from "express";
import bcrypt from "bcryptjs";
import ServerlessHttp from 'serverless-http';
import path from "path";

const router = Router();
const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Allow requests from all origins
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200); 
    }
    next();
});

const serviceAccount = require(path.resolve('./serviceAccountKey.json'));

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Registration Endpoint
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Check if user already exists
        const userSnapshot = await db.collection('users').where('email', '==', email).get();
        if (!userSnapshot.empty) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash and salt password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Save user to Firestore
        await db.collection('users').add({
            email: email,
            password: hashedPassword,
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login Endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Fetch user from Firestore
        const userSnapshot = await db.collection('users').where('email', '==', email).get();
        if (userSnapshot.empty) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        let userData = null;
        userSnapshot.forEach(doc => {
            userData = doc.data();
        });

        // Compare hashed passwords
        const isMatch = bcrypt.compareSync(password, userData.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.use('/api/', router)
export const handler = ServerlessHttp(app);
