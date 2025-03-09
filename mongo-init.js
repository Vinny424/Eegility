// MongoDB initialization script
db = db.getSiblingDB('eeg_database');

// Create collections
db.createCollection('users');
db.createCollection('eegdata');

// Create admin user if it doesn't exist
const adminExists = db.users.findOne({ email: "admin@example.com" });

if (!adminExists) {
  // Generate hashed password for admin
  // This is the hash for password "admin123"
  const adminPasswordHash = "$2a$10$CwTycUXWue0Thq9StjUM0uQCo.skQF2u3XsTKkd.0NAzW8XTB3YuG";
  
  db.users.insertOne({
    username: "admin",
    email: "admin@example.com",
    password: adminPasswordHash,
    role: "admin",
    firstName: "Admin",
    lastName: "User",
    organization: "EEG BIDS Organization",
    createdAt: new Date(),
    lastLogin: null
  });
  
  print("Admin user created successfully");
}

// Create default user if it doesn't exist
const userExists = db.users.findOne({ email: "user@example.com" });

if (!userExists) {
  // Generate hashed password for default user
  // This is the hash for password "user123"
  const userPasswordHash = "$2a$10$jjt6RXmLKrfS6JyEGQQJOeugQZTTiO9DRjzIWiRHf4TLXtdeZf4jm";
  
  db.users.insertOne({
    username: "testuser",
    email: "user@example.com",
    password: userPasswordHash,
    role: "user",
    firstName: "Test",
    lastName: "User",
    organization: "Example University",
    createdAt: new Date(),
    lastLogin: null
  });
  
  print("Test user created successfully");
}

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db.eegdata.createIndex({ userId: 1 });
db.eegdata.createIndex({ "metadata.subject.id": 1 });
db.eegdata.createIndex({ uploadDate: -1 });
db.eegdata.createIndex({ bidsCompliant: 1 });

print("MongoDB initialization completed");