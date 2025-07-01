// MongoDB initialization script for EEGility Medical RBAC System
db = db.getSiblingDB('eeg_database');

// Create collections
db.createCollection('users');
db.createCollection('eegdata');
db.createCollection('datasharing');

// Create administrator account with maximum elevated permissions
const adminExists = db.users.findOne({ email: "admin@eegility.com" });

if (!adminExists) {
  // Generate hashed password for admin
  // This is the hash for password "admin123"
  const adminPasswordHash = "$2a$10$CwTycUXWue0Thq9StjUM0uQCo.skQF2u3XsTKkd.0NAzW8XTB3YuG";
  
  db.users.insertOne({
    email: "admin@eegility.com",
    firstName: "System",
    lastName: "Administrator",
    passwordHash: adminPasswordHash,
    role: 2, // UserRole.Admin (enum value)
    institution: "EEGility Platform",
    department: "System Administration",
    phone: "+1-555-ADMIN",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    lastLoginAt: null,
    permissions: [
      "read", 
      "upload", 
      "share_data", 
      "view_shared", 
      "manage_users", 
      "export_data", 
      "view_all_data", 
      "delete_data", 
      "system_admin"
    ],
    canViewDepartmentData: true,
    canViewAllData: true,
    sharedDataAccess: []
  });
  
  print("🔒 Administrator account created successfully");
  print("   Email: admin@eegility.com");
  print("   Password: admin123");
  print("   Role: System Administrator");
}

// Create department head for testing
const deptHeadExists = db.users.findOne({ email: "dept.head@hospital.com" });

if (!deptHeadExists) {
  // Generate hashed password for department head
  // This is the hash for password "dept1234"
  const deptPasswordHash = "$2a$11$fOaF2SJrNpwTtju9D.mYH.3.QOWH/MFphYsI/gDFajvpw2BgznYIe";
  
  db.users.insertOne({
    email: "dept.head@hospital.com",
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    passwordHash: deptPasswordHash,
    role: 1, // UserRole.DepartmentHead (enum value)
    institution: "General Hospital",
    department: "Neurology",
    phone: "+1-555-DEPT",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    lastLoginAt: null,
    permissions: [
      "read", 
      "upload", 
      "share_data", 
      "view_shared", 
      "export_data", 
      "view_department_data"
    ],
    canViewDepartmentData: true,
    canViewAllData: false,
    sharedDataAccess: []
  });
  
  print("👩‍⚕️ Department Head account created successfully");
  print("   Email: dept.head@hospital.com");
  print("   Password: dept1234");
  print("   Role: Department Head - Neurology");
}

// Create regular user for testing
const testUserExists = db.users.findOne({ email: "doctor@hospital.com" });

if (!testUserExists) {
  // Generate hashed password for regular user  
  // This is the hash for password "user1234"
  const userPasswordHash = "$2a$11$0fkWW6DR.d/pWaXoNQI7PufG1D0HGQVnxYbOMpzrhbZP7uSBhVoiO";
  
  db.users.insertOne({
    email: "doctor@hospital.com",
    firstName: "Dr. Michael",
    lastName: "Smith",
    passwordHash: userPasswordHash,
    role: 0, // UserRole.User (enum value)
    institution: "General Hospital",
    department: "Neurology",
    phone: "+1-555-USER",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    lastLoginAt: null,
    permissions: ["read", "upload"],
    canViewDepartmentData: false,
    canViewAllData: false,
    sharedDataAccess: []
  });
  
  print("👨‍⚕️ Regular User account created successfully");
  print("   Email: doctor@hospital.com");
  print("   Password: user1234");
  print("   Role: Regular User - Neurology");
}

// Create indexes for optimal performance
print("📊 Creating database indexes...");

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ institution: 1, department: 1 });
db.users.createIndex({ isActive: 1 });

// EEG data indexes
db.eegdata.createIndex({ userId: 1 });
db.eegdata.createIndex({ "metadata.subject.id": 1 });
db.eegdata.createIndex({ uploadDate: -1 });
db.eegdata.createIndex({ bidsCompliant: 1 });
db.eegdata.createIndex({ isShared: 1 });
db.eegdata.createIndex({ sharedWithUserIds: 1 });

// Data sharing indexes
db.datasharing.createIndex({ eegDataId: 1 });
db.datasharing.createIndex({ sharedByUserId: 1 });
db.datasharing.createIndex({ sharedWithUserId: 1 });
db.datasharing.createIndex({ status: 1 });
db.datasharing.createIndex({ expiresAt: 1 });

print("✅ MongoDB initialization completed successfully!");
print("");
print("🔐 MEDICAL RBAC TEST ACCOUNTS CREATED:");
print("=====================================");
print("👑 SYSTEM ADMINISTRATOR:");
print("   Email: admin@eegility.com");
print("   Password: admin123");
print("   Access: ALL DATA + USER MANAGEMENT");
print("");
print("👩‍⚕️ DEPARTMENT HEAD (Neurology):");
print("   Email: dept.head@hospital.com");
print("   Password: dept1234");
print("   Access: ALL NEUROLOGY DEPARTMENT DATA");
print("");
print("👨‍⚕️ REGULAR USER (Neurology):");
print("   Email: doctor@hospital.com");
print("   Password: user1234");
print("   Access: OWN DATA + SHARED DATA");
print("");
print("🚀 Ready for medical RBAC testing!");