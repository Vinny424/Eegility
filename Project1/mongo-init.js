db = db.getSiblingDB('eegility');

db.createCollection("users", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["username", "email", "password", "roles", "status", "createdAt"],
        properties: {
          username: {
            bsonType: "string",
            description: "Username for login - required and unique"
          },
          email: {
            bsonType: "string",
            pattern: "^.+@.+$",
            description: "Email address - required and must be valid format"
          },
          password: {
            bsonType: "string",
            description: "Hashed password - required"
          },
          firstName: {
            bsonType: "string",
            description: "User's first name"
          },
          lastName: {
            bsonType: "string",
            description: "User's last name"
          },
          roles: {
            bsonType: "array",
            description: "Array of roles assigned to the user - required",
            minItems: 1,
            items: {
              enum: ["admin", "user"]
            }
          },
          permissions: {
            bsonType: "object",
            description: "Fine-grained permissions for the user",
            properties: {
              patients: {
                bsonType: "object",
                properties: {
                  create: { bsonType: "bool" },
                  read: { bsonType: "bool" },
                  update: { bsonType: "bool" },
                  delete: { bsonType: "bool" }
                }
              },
              eegRecords: {
                bsonType: "object",
                properties: {
                  upload: { bsonType: "bool" },
                  download: { bsonType: "bool" },
                  update: { bsonType: "bool" },
                  delete: { bsonType: "bool" }
                }
              },
              users: {
                bsonType: "object",
                properties: {
                  create: { bsonType: "bool" },
                  read: { bsonType: "bool" },
                  update: { bsonType: "bool" },
                  delete: { bsonType: "bool" }
                }
              },
              reports: {
                bsonType: "object",
                properties: {
                  generate: { bsonType: "bool" },
                  export: { bsonType: "bool" }
                }
              }
            }
          },
          status: {
            enum: ["active", "inactive", "suspended", "pending"],
            description: "Current account status"
          },
          phoneNumber: {
            bsonType: "string",
            description: "Contact phone number"
          },
          department: {
            bsonType: "string",
            description: "Department or unit the user belongs to"
          },
          title: {
            bsonType: "string",
            description: "Professional title of the user"
          },
          createdAt: {
            bsonType: "date",
            description: "Account creation timestamp - required"
          },
          lastLogin: {
            bsonType: "date",
            description: "Last login timestamp"
          },
          lastPasswordChange: {
            bsonType: "date",
            description: "Last password change timestamp"
          },
          lastDownload: {
            bsonType: "date",
            description: "Last file download timestamp"
          },
          failedLoginAttempts: {
            bsonType: "int",
            description: "Count of consecutive failed login attempts"
          },
          createdBy: {
            bsonType: "objectId",
            description: "Reference to admin user who created this account"
          },
          profilePicture: {
            bsonType: "string",
            description: "Path to user's profile picture"
          },
          preferences: {
            bsonType: "object",
            description: "User interface preferences",
            properties: {
              theme: { bsonType: "string" },
              notificationsEnabled: { bsonType: "bool" },
              defaultView: { bsonType: "string" }
            }
          },
          apiKey: {
            bsonType: "string",
            description: "API key for programmatic access (if applicable)"
          },
          mfaEnabled: {
            bsonType: "bool",
            description: "Whether multi-factor authentication is enabled"
          },
          mfaSecret: {
            bsonType: "string",
            description: "Secret key for MFA (encrypted)"
          }
        }
      }
    }
});

  // Create necessary indexes for users
  db.collection("users").createIndex({ "username": 1 }, { unique: true });
  db.collection("users").createIndex({ "email": 1 }, { unique: true });
  db.collection("users").createIndex({ "roles": 1 });
  db.collection("users").createIndex({ "status": 1 });
  db.collection("users").createIndex({ "department": 1 });

  // Create roles collection to manage role definitions
  db.createCollection("roles", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "description", "permissions"],
        properties: {
          name: {
            bsonType: "string",
            description: "Role name - required"
          },
          description: {
            bsonType: "string",
            description: "Role description"
          },
          permissions: {
            bsonType: "object",
            description: "Default permissions for this role",
            required: ["patients", "eegRecords", "users", "reports"],
            properties: {
              patients: {
                bsonType: "object",
                required: ["create", "read", "update", "delete"],
                properties: {
                  create: { bsonType: "bool" },
                  read: { bsonType: "bool" },
                  update: { bsonType: "bool" },
                  delete: { bsonType: "bool" }
                }
              },
              eegRecords: {
                bsonType: "object",
                required: ["upload", "download", "update", "delete"],
                properties: {
                  upload: { bsonType: "bool" },
                  download: { bsonType: "bool" },
                  update: { bsonType: "bool" },
                  delete: { bsonType: "bool" }
                }
              },
              users: {
                bsonType: "object",
                required: ["create", "read", "update", "delete"],
                properties: {
                  create: { bsonType: "bool" },
                  read: { bsonType: "bool" },
                  update: { bsonType: "bool" },
                  delete: { bsonType: "bool" }
                }
              },
              reports: {
                bsonType: "object",
                required: ["generate", "export"],
                properties: {
                  generate: { bsonType: "bool" },
                  export: { bsonType: "bool" }
                }
              }
            }
          },
          createdAt: {
            bsonType: "date",
            description: "Role creation timestamp"
          },
          updatedAt: {
            bsonType: "date",
            description: "Role last update timestamp"
          },
          createdBy: {
            bsonType: "objectId",
            description: "Admin who created this role"
          }
        }
      }
    }
  });

  db.collection("roles").createIndex({ "name": 1 }, { unique: true });

  // Create patients collection 
  db.createCollection("patients", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "dob"],
        properties: {
          name: { bsonType: "string" },
          dob: { bsonType: "date" },
          task: { bsonType: "string" },
          lastEEGRecordDate: { bsonType: "date" },
          medicalHistory: { bsonType: "array" },
          notes: { bsonType: "string" }
        }
      }
    }
  });

  // Create eegRecords collection
  db.createCollection("eegRecords", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["patientId", "fileId", "fileName", "status"],
        properties: {
          patientId: { bsonType: "string" },
          recordDate: { bsonType: "date" },
          fileId: { bsonType: "objectId" },
          fileName: { bsonType: "string" },
          fileFormat: { bsonType: "string" },
          fileSize: { bsonType: "int" },
          recordingDuration: { bsonType: "int" },
          channelCount: { bsonType: "int" },
          samplingRate: { bsonType: "int" },
          equipmentType: { bsonType: "string" },
          technician: { bsonType: "string" },
          status: { 
            bsonType: "string",
            enum: ["new", "processed", "archived", "deleted"]
          },
          tags: { bsonType: "array" },
          notes: { bsonType: "string" },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" },
          createdBy: { bsonType: "objectId" }
        }
      }
    }
  });

  // Create auditLog collection
  db.createCollection("auditLog", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "action", "resourceType", "timestamp"],
        properties: {
          userId: { bsonType: "objectId" },
          username: { bsonType: "string" },
          action: { bsonType: "string" },
          resourceType: { bsonType: "string" },
          resourceId: { bsonType: "string" },
          details: { bsonType: "string" },
          timestamp: { bsonType: "date" },
          ipAddress: { bsonType: "string" },
          userAgent: { bsonType: "string" }
        }
      }
    }
  });

  // Create downloadHistory collection
  db.createCollection("downloadHistory", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "fileId", "downloadDate"],
        properties: {
          userId: { bsonType: "objectId" },
          username: { bsonType: "string" },
          fileId: { bsonType: "objectId" },
          fileName: { bsonType: "string" },
          patientId: { bsonType: "string" },
          downloadDate: { bsonType: "date" },
          ipAddress: { bsonType: "string" },
          userAgent: { bsonType: "string" },
          downloadReason: { bsonType: "string" }
        }
      }
    }
  });


  db.collection("patients").countDocuments() 
    db.collection("patients").insertMany([
      { 
        name: "John Doe", 
        dob: new Date("1990-05-15"), 
        task: "Task 1",
        medicalHistory: [],
        notes: "Sample patient 1"
      },
      { 
        name: "Jane Smith", 
        dob: new Date("1985-10-22"), 
        task: "Task 2",
        medicalHistory: [],
        notes: "Sample patient 2"
      }
    ]);
    console.log("Inserted sample patients");

db.collection("roles").countDocuments()
    db.collection("roles").insertMany([
      {
        name: "admin",
        description: "System administrator with full access to all features",
        permissions: {
          patients: {
            create: true,
            read: true,
            update: true,
            delete: true
          },
          eegRecords: {
            upload: true,
            download: true,
            update: true,
            delete: true
          },
          users: {
            create: true,
            read: true,
            update: true,
            delete: true
          },
          reports: {
            generate: true,
            export: true
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "user",
        description: "Regular user with view and download access only",
        permissions: {
          patients: {
            create: false,
            read: true,
            update: false,
            delete: false
          },
          eegRecords: {
            upload: false,
            download: true,
            update: false,
            delete: false
          },
          users: {
            create: false,
            read: false,
            update: false,
            delete: false
          },
          reports: {
            generate: true,
            export: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log("Inserted default roles");
  

  