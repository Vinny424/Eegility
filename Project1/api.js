// api.js
import express from 'express';
import { getDB } from './db.js';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import cors from 'cors';
import { scryptSync, timingSafeEqual } from 'crypto';
import { generateToken, verifyToken } from './auth.js';

const router = express.Router();
let db; // Declare db variable

// Create an initialization function
export async function initializeApiRouter() {
    try {
        db = await getDB(); // Wait for DB connection
        return router;
    } catch (error) {
        console.error('Failed to initialize API router:', error);
        throw error;
    }
}

// CORS configuration
router.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'] // Important for JWT
}));


// Search patients
router.get('/search', async (req, res) => {
  try {
    const db = getDB();
    const { term } = req.query;
    
    const patients = await db.collection('patients').find({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { task: { $regex: term, $options: 'i' } }
      ]
    }).toArray();
    
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Add this route in api.js
// In api.js, update or add these routes:

// Get patient by ID
router.get('/patients/:id', authenticateJWT, async (req, res) => {
    try {
        const patient = await db.collection('patients').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (!patient) {
            return res.status(404).json({ 
                success: false, 
                error: 'Patient not found' 
            });
        }
        
        res.json({ 
            success: true, 
            patient  // Changed from 'data' to 'patient' to match client expectation
        });
    } catch (error) {
        console.error('Patient fetch error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Search patients by patientId 
router.get('/patients/search/:patientId', authenticateJWT, async (req, res) => {
    try {
        const patient = await db.collection('patients').findOne({ 
            patientId: req.params.patientId 
        });
        
        if (!patient) {
            return res.status(404).json({ 
                success: false, 
                error: 'Patient not found' 
            });
        }
        
        res.json({ 
            success: true, 
            patient
        });
    } catch (error) {
        console.error('Patient search error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Simple health check endpoint
router.get('/health', async (req, res) => {
  try {
      const db = getDB();
      await db.command({ ping: 1 });
      res.json({ status: 'healthy' });
  } catch (err) {
      res.status(503).json({ status: 'unhealthy' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await db.collection('users').findOne({ username });
      if (!user) throw new Error('Invalid credentials');
  
      // Password verification
      const [salt, storedHash] = user.password.split(':');
      const hashedBuffer = scryptSync(password, salt, 64);
      const storedBuffer = Buffer.from(storedHash, 'hex');
      
      if (!timingSafeEqual(hashedBuffer, storedBuffer)) {
        throw new Error('Invalid credentials');
      }
  
      // Generate JWT token instead of using session
      const token = generateToken(user);
      
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          roles: user.roles
        }
      });
      
    } catch (error) {
      res.status(401).json({ 
        success: false,
        error: error.message 
      });
    }
  });
  
  // JWT authentication middleware
router.get('/check-session', authenticateJWT, (req, res) => {
    // Get fresh user data from database
    db.collection('users').findOne({ _id: new ObjectId(req.user.id) })
        .then(user => {
            if (!user) {
                return res.json({ loggedIn: false });
            }
            
            res.json({
                loggedIn: true,
                user: {
                    id: user._id,
                    username: user.username,
                    roles: user.roles
                }
            });
        })
        .catch(err => {
            console.error('Session check error:', err);
            res.json({ loggedIn: false });
        });
});

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ 
            success: false, 
            error: 'Authorization header missing' 
        });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Token not provided' 
        });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        res.status(403).json({ 
            success: false, 
            error: 'Invalid or expired token' 
        });
    }
};
  

// Update patient data 
router.put('/patients/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { name, dob, ssn, phone, address, patientId, conditions, medications, physician } = req.body;

    try {
        const result = await db.collection('patients').updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    name,
                    dob: new Date(dob),
                    ssn,
                    phone,
                    address,
                    patientId,
                    conditions: conditions || null,
                    medications: medications || null,
                    physician: physician || null,
                    updatedAt: new Date()
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Patient not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Patient updated successfully',
            modifiedCount: result.modifiedCount 
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});


// Create patient 
router.post('/patients', authenticateJWT, async (req, res) => {
    try {
        const { name, dob, ssn, phone, address, patientId, conditions, medications, physician } = req.body;
        
        const result = await db.collection('patients').insertOne({
            name,
            dob: new Date(dob),
            ssn,
            phone,
            address,
            patientId,
            conditions: conditions || null,
            medications: medications || null,
            physician: physician || null,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({ 
            success: true,
            id: result.insertedId
        });
    } catch (error) {
        console.error('Create patient error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Delete patient 
router.delete('/patients/:id', authenticateJWT, async (req, res) => {
    try {
        const db = getDB();
        const patients = db.collection('patients');
        const result = await patients.deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        res.json({ 
            success: true,
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

export default router;