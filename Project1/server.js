import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { connect, getDB } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';
import { setInterval } from 'timers/promises';
import { initializeApiRouter } from './api.js';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

// ES Modules alternative for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Database connection
async function initializeDatabase() {
  try {
    await connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Initialize Collections
async function initializeCollections(db) {
  
  // Create collections if they don't exist
  const collections = [
    { name: 'patients', validator: {} },
    { name: 'users', validator: {} },
    { name: 'eeg_files', validator: {} },
    { name: 'eegdata', validator: {} },
    { name: 'eegRecords', validator: {} }, 
    { name: 'auditLog', validator: {} },   
    { name: 'downloadHistory', validator: {} }, 
    { name: 'roles', validator: {} }       
  ];

  for (const coll of collections) {
    try {
      await db.createCollection(coll.name, coll.validator);
      console.log(`Created collection: ${coll.name}`);
    } catch (err) {
      if (err.codeName !== 'NamespaceExists') {
        console.error(`Error creating ${coll.name}:`, err);
      }
    }
  }

  // Insert initial data if collections are empty
  // In server.js, update the initial data insertion
if ((await db.collection('patients').countDocuments()) === 0) {
  await db.collection('patients').insertMany([
      { 
          name: "John Doe", 
          dob: new Date("1990-05-15"), 
          task: "Task 1",
          patientId: "0001234", // Add this
          ssn: "1234",
          phone: "555-123-4567",
          address: "123 Main St",
          conditions: "None",
          medications: "None",
          physician: "Dr. Smith"
      },
      { 
          name: "Jane Smith", 
          dob: new Date("1985-10-22"), 
          task: "Task 2",
          patientId: "0005678", // Add this
          ssn: "5678",
          phone: "555-987-6543",
          address: "456 Oak Ave",
          conditions: "Hypertension",
          medications: "Lisinopril",
          physician: "Dr. Johnson"
      }
  ]);
}

  // Initialize roles if they don't exist
if ((await db.collection('roles').countDocuments()) === 0) {
  await db.collection('roles').insertMany([
    {
      name: "admin",
      permissions: {
        users: { create: true, read: true, update: true, delete: true },
        patients: { create: true, read: true, update: true, delete: true },
        eegRecords: { create: true, read: true, update: true, delete: true }
      },
      description: "System Administrator with full access"
    },
    {
      name: "user",
      permissions: {
        patients: { read: true },
        eegRecords: { read: true }
      },
      description: "Regular user with limited access"
    }
  ]);
  console.log("Default roles created");
}

}


async function createDatabaseFunctions(db) {
  // Create a MongoDB function for EEG file uploads
  await db.command({
    insert: "system.js",
    documents: [{
      _id: "uploadEEGRecord",
      value: function(patientId, recordData, fileData, userId) {
        // 1. First validate if the user has admin privileges
        const user = db.users.findOne({ _id: userId });
        if (!user || user.role !== "admin") {
          return { status: "error", message: "Unauthorized: Admin privileges required" };
        }
       
        // 2. Validate patient exists
        const patient = db.patients.findOne({ patientId: patientId });
        if (!patient) {
          return { status: "error", message: "Patient not found" };
        }
       
        // 3. Store the file in GridFS (implementation would go here)
        const fileId = new ObjectId();
        
        // 4. Create the EEG record
        const eegRecord = {
          patientId: patientId,
          recordDate: new Date(recordData.recordDate || new Date()),
          fileId: fileId,
          fileName: recordData.fileName,
          fileFormat: recordData.fileFormat,
          fileSize: recordData.fileSize,
          recordingDuration: recordData.recordingDuration,
          channelCount: recordData.channelCount,
          samplingRate: recordData.samplingRate,
          equipmentType: recordData.equipmentType,
          technician: recordData.technician,
          status: "new",
          tags: recordData.tags || [],
          notes: recordData.notes || "",
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId
        };
       
        // 5. Insert the record
        const result = db.eegRecords.insertOne(eegRecord);
       
        // 6. Create audit log entry
        db.auditLog.insertOne({
          userId: userId,
          username: user.username,
          action: "create",
          resourceType: "eegRecord",
          resourceId: result.insertedId.toString(),
          details: `Created EEG record for patient ${patientId}`,
          timestamp: new Date(),
          ipAddress: recordData.ipAddress || "unknown",
          userAgent: recordData.userAgent || "unknown"
        });
       
        return {
          status: "success",
          message: "EEG record created successfully",
          recordId: result.insertedId
        };
      }
    }]
  });

  // Create a MongoDB function for EEG file downloads
  await db.command({
    insert: "system.js",
    documents: [{
      _id: "downloadEEGRecord",
      value: function(fileId, userId, downloadInfo) {
        // 1. Validate the user exists
        const user = db.users.findOne({ _id: userId });
        if (!user) {
          return { status: "error", message: "User not found" };
        }
       
        // 2. Validate the file exists
        const eegRecord = db.eegRecords.findOne({ fileId: fileId });
        if (!eegRecord) {
          return { status: "error", message: "EEG record not found" };
        }
       
        // 3. Log the download
        db.downloadHistory.insertOne({
          userId: userId,
          username: user.username,
          fileId: fileId,
          fileName: eegRecord.fileName,
          patientId: eegRecord.patientId,
          downloadDate: new Date(),
          ipAddress: downloadInfo.ipAddress || "unknown",
          userAgent: downloadInfo.userAgent || "unknown",
          downloadReason: downloadInfo.reason || ""
        });
       
        // 4. Update user's lastDownload timestamp
        db.users.updateOne(
          { _id: userId },
          { $set: { lastDownload: new Date() } }
        );
       
        // 5. Create audit log entry
        db.auditLog.insertOne({
          userId: userId,
          username: user.username,
          action: "download",
          resourceType: "eegRecord",
          resourceId: eegRecord._id.toString(),
          details: `Downloaded EEG record for patient ${eegRecord.patientId}`,
          timestamp: new Date(),
          ipAddress: downloadInfo.ipAddress || "unknown",
          userAgent: downloadInfo.userAgent || "unknown"
        });
       
        return {
          status: "success",
          message: "Download logged successfully"
        };
      }
    }]
  });

  // Create a function to check user permissions
  await db.command({
    insert: "system.js",
    documents: [{
      _id: "checkUserPermission",
      value: function(userId, resourceType, action) {
        const user = db.users.findOne({ _id: userId, status: "active" });
        if (!user) {
          return { hasPermission: false, message: "User not found or inactive" };
        }
       
        // Check if user has the required permission
        if (user.permissions &&
            user.permissions[resourceType] &&
            user.permissions[resourceType][action] === true) {
          return { hasPermission: true };
        }
       
        return {
          hasPermission: false,
          message: `User lacks permission for ${action} on ${resourceType}`
        };
      }
    }]
  });

  // Create a function to assign a role to a user
  await db.command({
    insert: "system.js",
    documents: [{
      _id: "assignRoleToUser",
      value: function(userId, roleName, adminId) {
        // Check if admin has permission
        const adminCheck = db.system.js.findOne({ _id: "checkUserPermission" }).value(adminId, "users", "update");
        if (!adminCheck.hasPermission) {
          return { status: "error", message: adminCheck.message };
        }
       
        // Get the role definition
        const role = db.roles.findOne({ name: roleName });
        if (!role) {
          return { status: "error", message: "Role not found" };
        }
       
        // Update the user
        const updateResult = db.users.updateOne(
          { _id: userId },
          {
            $addToSet: { roles: roleName },
            $set: {
              permissions: role.permissions,
              updatedAt: new Date(),
              lastUpdatedBy: adminId
            }
          }
        );
       
        if (updateResult.modifiedCount === 1) {
          // Log the role assignment
          db.auditLog.insertOne({
            userId: adminId,
            username: db.users.findOne({ _id: adminId }).username,
            action: "assign_role",
            resourceType: "user",
            resourceId: userId.toString(),
            details: `Assigned role '${roleName}' to user`,
            timestamp: new Date(),
            ipAddress: "system",
            userAgent: "system"
          });
         
          return { status: "success", message: `Role '${roleName}' assigned successfully` };
        } else {
          return { status: "error", message: "User not found or role already assigned" };
        }
      }
    }]
  });

  // Create a function to authenticate a user
  await db.command({
    insert: "system.js",
    documents: [{
      _id: "authenticateUser",
      value: function(username, passwordHash) {
        // In a real application, you would verify the password hash here
        const user = db.users.findOne({
          username: username,
          status: "active"
        });
       
        if (!user) {
          return { authenticated: false, message: "User not found or inactive" };
        }
       
        // Simulating password check (in a real app, you'd compare hashes)
        const passwordCorrect = (user.password === passwordHash);
       
        if (passwordCorrect) {
          // Update login information
          db.users.updateOne(
            { _id: user._id },
            {
              $set: {
                lastLogin: new Date(),
                failedLoginAttempts: 0
              }
            }
          );
         
          // Log successful login
          db.auditLog.insertOne({
            userId: user._id,
            username: user.username,
            action: "login",
            resourceType: "auth",
            details: "Successful login",
            timestamp: new Date(),
            ipAddress: "captured-from-request",
            userAgent: "captured-from-request"
          });
         
          return {
            authenticated: true,
            userId: user._id,
            username: user.username,
            roles: user.roles,
            permissions: user.permissions
          };
        } else {
          // Increment failed login attempts
          db.users.updateOne(
            { _id: user._id },
            { $inc: { failedLoginAttempts: 1 } }
          );
         
          // Check if account should be locked
          const updatedUser = db.users.findOne({ _id: user._id });
          if (updatedUser.failedLoginAttempts >= 5) {
            db.users.updateOne(
              { _id: user._id },
              { $set: { status: "suspended" } }
            );
           
            // Log account suspension
            db.auditLog.insertOne({
              userId: user._id,
              username: user.username,
              action: "suspend_account",
              resourceType: "auth",
              details: "Account suspended due to multiple failed login attempts",
              timestamp: new Date(),
              ipAddress: "captured-from-request",
              userAgent: "captured-from-request"
            });
          }
         
          return { authenticated: false, message: "Invalid credentials" };
        }
      }
    }]
  });

  
}

async function startPollingForNewRecords() {
  const db = getDB();
  let lastCheckedTime = new Date();
  
  console.log('Starting polling for new EEG records...');
  
  // Run every 5 seconds
  for await (const _ of setInterval(5000)) {
    try {
      const newRecords = await db.collection('eegRecords').find({
        createdAt: { $gt: lastCheckedTime },
        status: 'new'
      }).toArray();

      if (newRecords.length > 0) {
        console.log(`Found ${newRecords.length} new EEG records to process`);
        
        for (const record of newRecords) {
          // Update patient's lastEEGRecordDate
          await db.collection('patients').updateOne(
            { patientId: record.patientId },
            { $set: { lastEEGRecordDate: new Date() } }
          );
          
          // Create audit log entry
          const user = await db.collection('users').findOne({ _id: record.createdBy });
          
          await db.collection('auditLog').insertOne({
            userId: record.createdBy,
            username: user?.username || 'system',
            action: "upload",
            resourceType: "eegRecord",
            resourceId: record._id.toString(),
            details: `EEG record uploaded for patient ${record.patientId}`,
            timestamp: new Date(),
            ipAddress: "polling-system",
            userAgent: "polling-system"
          });
          
          console.log(`Processed new EEG record ${record._id}`);
        }
        
        lastCheckedTime = new Date();
      }
    } catch (error) {
      console.error('Error during polling:', error);
    }
  }
}

// Modified initializeDefaultUsers()
async function initializeDefaultUsers() {
  const db = getDB();
   
  // Helper function to hash passwords
    const hashPassword = (password) => {
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hashedPassword}`; // Store salt and hash together
  };
  // Admin user setup
  if (!(await db.collection('users').findOne({ username: 'admin' }))) {
    const adminRole = await db.collection('roles').findOne({ name: 'admin' });
    const adminPassword = 'admin123'; // Change in production!
    await db.collection('users').insertOne({
      username: "admin",
      email: "admin@example.com",
      password: hashPassword(adminPassword),
      roles: ["admin"],
      permissions: adminRole.permissions, // Inherit from role
      status: "active",
      department: "IT",
      title: "System Administrator",
      phoneNumber: "555-123-4567",
      createdAt: new Date(),
      lastLogin: new Date(),
      lastPasswordChange: new Date(),
      failedLoginAttempts: 0,
      preferences: {
        theme: "light",
        notificationsEnabled: true,
        defaultView: "dashboard"
      },
      mfaEnabled: true
    });
    console.log("Admin user created");
  }

  // Regular user setup
  if (!(await db.collection('users').findOne({ username: 'jsmith' }))) {
    
    const userRole = await db.collection('roles').findOne({ name: 'user' });
    const adminUser = await db.collection('users').findOne({ username: 'admin' });
    const userPassword = 'user123'; // Change in production!

    await db.collection('users').insertOne({
      username: "jsmith",
      email: "jsmith@example.com",
      password: hashPassword(userPassword),
      permissions: userRole.permissions,
      status: "active",
      firstName: "John",
      lastName: "Smith",
      roles: ["user"],
      department: "Neurology",
      title: "Research Assistant",
      phoneNumber: "555-987-6543",
      createdAt: new Date(),
      lastLogin: new Date(),
      lastPasswordChange: new Date(),
      failedLoginAttempts: 0,
      createdBy: adminUser ? adminUser._id : null,
      preferences: {
        theme: "dark",
        notificationsEnabled: true,
        defaultView: "patients"
      },
      mfaEnabled: false
    });
    console.log("Regular user created");
  }

}


// Initialize and start server
async function startServer() {
  try {
    // 1. First connect to database
    console.log('Initializing database connection...');
    await connect();
    
    // 2. Get DB instance
    const db = getDB();
    console.log('Database connection established');
    
    // 3. Initialize collections
    console.log('Initializing collections...');
    await initializeCollections(db);
    
    // 4. Initialize default users
    console.log('Initializing default users...');
    await initializeDefaultUsers();
    
    // 5. Create database functions
    console.log('Creating database functions...');
    await createDatabaseFunctions(db);

     // Add middleware BEFORE routes
     app.use(express.json()); // This was missing or in the wrong position
     app.use(express.urlencoded({ extended: true }));
     app.use(express.static('public'));
    
    // 7. Initialize API router (after everything else is ready)
    console.log('Initializing API router...');
    const apiRouter = await initializeApiRouter();
    app.use('/api', apiRouter);
    
    // 8. Start polling
    console.log('Starting polling service...');
    startPollingForNewRecords();
    
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);
export { getDB }; 