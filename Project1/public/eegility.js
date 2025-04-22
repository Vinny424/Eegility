const API_BASE_URL = window.location.origin + '/api';
// Current user state
let currentMode = 'user';
let currentUser = null;
let currentToken = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
        const response = await fetch('/api/check-session', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Session check failed');
        }
        
        const data = await response.json();
        
        if (data.loggedIn) {
            currentUser = data.user;
            if (currentUser.roles && currentUser.roles.includes('admin')) {
                document.getElementById('admin-controls').classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Session check failed:', error);
        localStorage.removeItem('authToken');
    }
    
    showSection('home');
});
   
// Show a specific section
function showDDBLogin() {
    document.getElementById('ddb-login-prompt').classList.add('hidden');
    document.getElementById('ddb-login-form').classList.remove('hidden');
}


function hideDDBLogin() {
    document.getElementById('ddb-login-form').classList.add('hidden');
    document.getElementById('ddb-login-prompt').classList.remove('hidden');
}


//Show Sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show the requested section
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Special handling for admin section
    if (sectionId === 'admin') {
        if (currentUser?.roles?.includes('admin')) {
            document.getElementById('admin-content').classList.remove('hidden');
            document.getElementById('admin-login-prompt').classList.add('hidden');
        } else {
            document.getElementById('admin-content').classList.add('hidden');
            document.getElementById('admin-login-prompt').classList.remove('hidden');
        }
    }
    
    // Special handling for DDB Search section
    if (sectionId === 'ddb-search') {
        if (currentUser) {
            document.getElementById('ddb-content').classList.remove('hidden');
            document.getElementById('ddb-login-prompt').classList.add('hidden');
            document.getElementById('ddb-login-form').classList.add('hidden');
        } else {
            document.getElementById('ddb-content').classList.add('hidden');
            document.getElementById('ddb-login-prompt').classList.remove('hidden');
            document.getElementById('ddb-login-form').classList.add('hidden');
        }
    }
}

// Change between Admin/User Modes
function changeMode() {
    const selectedMode = document.getElementById('mode').value;
    
    if (selectedMode === 'admin') {
        if (currentUser?.roles && currentUser.roles.includes('admin')) {
            currentMode = 'admin';
            showSection('admin');
        } else {
            document.getElementById('mode').value = 'user';
            showSection('admin');
            const errorElement = document.getElementById('admin-login-error');
            errorElement.textContent = 'Please login as admin first';
            errorElement.classList.remove('hidden');
        }
    } else {
        currentMode = 'user';
        showSection('home');
    }
}
//Validate search words
function validateSearch() {
    if (!currentUser) {
        showError('Please login first');
        return false;
    }
    const searchInput = document.getElementById('search-input').value;
    if (!searchInput) {
        showError('Please enter a search term.');
        return false;
    }
    fetchSearchResults(searchInput);
    return false;
}

// User Login
async function ddbLogin() {
    const username = document.getElementById('ddb-username').value.trim();
    const password = document.getElementById('ddb-password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Login failed");

        currentUser = data.user;
        currentToken = data.token;
        
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        
        // Update UI
        document.getElementById('ddb-login-form').classList.add('hidden');
        document.getElementById('ddb-content').classList.remove('hidden');
        
    } catch (error) {
        showError(error.message);
    }
}

// Add token to all authenticated requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
        ...options,
        headers
    });
}

// Admin Login 
async function adminLogin() {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('admin-login-error');
    
    errorElement.classList.add('hidden');

    if (!username || !password) {
        errorElement.textContent = 'Please enter both username and password';
        errorElement.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Login failed");
        }

        // Store user data
        currentUser = data.user;
        
        // Check if user has admin role
        if (currentUser.roles && currentUser.roles.includes('admin')) {
            // Hide login prompt and show admin content
            document.getElementById('admin-login-prompt').classList.add('hidden');
            document.getElementById('admin-content').classList.remove('hidden');
            
            // Update mode selector
            document.getElementById('mode').value = 'admin';
            currentMode = 'admin';
            
            // Clear form
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-password').value = '';
        } else {
            throw new Error("User does not have admin privileges");
        }
    } catch (error) {
        console.error('Admin login error:', error);
        errorElement.textContent = error.message;
        errorElement.classList.remove('hidden');
    }
}


// Patient creation functions
function showPatientForm() {
    if (!currentUser?.roles?.includes('admin')) {
        showError('Admin access required');
        return;
    }
    document.getElementById('patient-form').classList.remove('hidden');
}

function showModifyPatient() {
    if (!currentUser?.roles?.includes('admin')) {
        showError('Admin access required');
        return;
    }
    document.getElementById('modify-patient').classList.remove('hidden');
}

function hidePatientForm() {
    document.getElementById('patient-form').classList.add('hidden');
    document.getElementById('new-patient-form').reset();
}

// Logout Function
async function logout() {
    // Simply clear the token and user data
    localStorage.removeItem('authToken');
    currentUser = null;
    currentToken = null;
    document.getElementById('mode').value = 'user';
    showSection('home');
}

// createPatient that uses JWT
async function createPatient() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showError('Please login first');
            return;
        }

        const formData = {
            name: `${document.getElementById('patient-first-name').value.trim()} ${document.getElementById('patient-last-name').value.trim()}`,
            dob: document.getElementById('patient-dob').value,
            ssn: document.getElementById('patient-ssn').value.trim(),
            phone: document.getElementById('patient-phone').value.trim(),
            address: document.getElementById('patient-address').value.trim(),
            patientId: document.getElementById('patient-id').value.trim(),
            conditions: document.getElementById('patient-conditions').value.trim() || null,
            medications: document.getElementById('patient-medications').value.trim() || null,
            physician: document.getElementById('patient-physician').value.trim() || null
        };

        // Validate required fields
        const requiredFields = ['name', 'dob', 'ssn', 'phone', 'address', 'patientId'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const response = await fetch(`api/patients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Failed to create patient");
        }

        alert('Patient created successfully!');
        hidePatientForm();
    } catch (error) {
        console.error("Patient creation failed:", error);
        showError(`Failed to create patient: ${error.message}`);
    }
}


function hidePatientForm() {
    document.getElementById('patient-form').classList.add('hidden');
    document.getElementById('new-patient-form').reset();
}

// Patient modification functions

function hideModifyForm() {
    document.getElementById('patient-modify-form').classList.add('hidden');
    document.getElementById('modify-patient-form').reset();
}

// searchPatient function
async function searchPatient() {
    const patientId = document.getElementById('search-patient-id').value.trim();
    
    if (!patientId) {
        showError('Please enter a Patient ID');
        return;
    }

    try {
        const response = await fetchWithAuth(`/api/patients/search/${patientId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Patient not found");
        }

        if (!data.success) {
            throw new Error(data.error || "Patient not found");
        }

        // Populate the form
        const patient = data.patient;
        document.getElementById('modify-name').value = patient.name;
        document.getElementById('modify-dob').value = patient.dob.split('T')[0];
        document.getElementById('modify-ssn').value = patient.ssn || '';
        document.getElementById('modify-phone').value = patient.phone || '';
        document.getElementById('modify-address').value = patient.address || '';
        document.getElementById('modify-patient-id').value = patient.patientId || '';
        document.getElementById('modify-conditions').value = patient.conditions || '';
        document.getElementById('modify-medications').value = patient.medications || '';
        document.getElementById('modify-physician').value = patient.physician || '';
        
        // Show the modify form
        document.getElementById('patient-modify-form').classList.remove('hidden');
    } catch (error) {
        showError('Error finding patient: ' + error.message);
    }
}

// updatePatient function
async function updatePatient() {
    const patientId = document.getElementById('modify-patient-id').value.trim();
    const name = document.getElementById('modify-name').value.trim();
    const dob = document.getElementById('modify-dob').value;
    const ssn = document.getElementById('modify-ssn').value.trim();
    const phone = document.getElementById('modify-phone').value.trim();
    const address = document.getElementById('modify-address').value.trim();
    const conditions = document.getElementById('modify-conditions').value.trim();
    const medications = document.getElementById('modify-medications').value.trim();
    const physician = document.getElementById('modify-physician').value.trim();
    
    if (!name || !dob || !ssn || !phone || !address || !patientId) {
        showError('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetchWithAuth(`/api/patients/search/${patientId}`);
        const searchData = await response.json();

        if (!searchData.success || !searchData.patient) {
            throw new Error("Patient not found");
        }

        const updateResponse = await fetchWithAuth(`/api/patients/${searchData.patient._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                dob,
                ssn,
                phone,
                address,
                patientId,
                conditions: conditions || null,
                medications: medications || null,
                physician: physician || null
            }),
        });

        const updateData = await updateResponse.json();

        if (!updateData.success) {
            throw new Error(updateData.error || "Failed to update patient");
        }

        alert('Patient updated successfully!');
        hideModifyForm();
    } catch (error) {
        showError('Error updating patient: ' + error.message);
    }
}



function validateAdminLogin() {
    const adminUser = document.getElementById('admin-user').value;
    const adminId = document.getElementById('admin-id').value;

    if (!adminUser || !adminId) {
        alert('Please fill in all fields.');
        return false;
    }

}
 
async function fetchSearchResults(searchTerm) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '<p>Searching...</p>';
    
    try {
        const response = await fetchWithAuth(`/api/search?term=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || "Search failed");
        }

        // Display results
        if (data.data.length > 0) {
            resultsDiv.innerHTML = `
                <table class="patient-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date of Birth</th>
                            <th>Task</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.data.map(patient => `
                            <tr>
                                <td>${patient.name}</td>
                                <td>${new Date(patient.dob).toLocaleDateString()}</td>
                                <td>${patient.task}</td>
                                <td>
                                    <button onclick="viewPatientDetails('${patient._id}')" class="view-details-btn">
                                        View Details
                                    </button>
                                    ${currentUser?.role === 'admin' ? `
                                    <button onclick="editPatient('${patient._id}')" class="edit-btn">
                                        Edit
                                    </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            resultsDiv.innerHTML = '<p class="no-results">No matching patients found</p>';
        }
        
    } catch (error) {
        console.error("Search error:", error);
        resultsDiv.innerHTML = `
            <div class="error">
                <p>Error: ${error.message}</p>
            </div>`;
    }
}

async function loadPatientDetails() {
    const patientId = sessionStorage.getItem('currentPatientId');
    if (!patientId) {
        document.getElementById('patient-info').innerHTML = '<p class="error">No patient selected</p>';
        return;
    }

    try {
        // Fetch patient details
        const patientResponse = await fetch(`/api/patients/${patientId}/details`);
        const patientData = await patientResponse.json();
        
        if (!patientData.success) {
            throw new Error(patientData.error || "Failed to load patient details");
        }

        // Display patient info
        const patient = patientData.data.patient;
        document.getElementById('patient-info').innerHTML = `
            <table class="patient-details-table">
                <tr>
                    <th>First Name:</th>
                    <td>${patient.firstName}</td>
                    <th>Last Name:</th>
                    <td>${patient.lastName}</td>
                </tr>
                <tr>
                    <th>Date of Birth:</th>
                    <td>${new Date(patient.dob).toLocaleDateString()}</td>
                    <th>Patient ID:</th>
                    <td>${patient.patientId}</td>
                </tr>
                <tr>
                    <th>Last 4 SSN:</th>
                    <td>${patient.ssn}</td>
                    <th>Phone:</th>
                    <td>${patient.phone}</td>
                </tr>
                <tr>
                    <th>Address:</th>
                    <td colspan="3">${patient.address}</td>
                </tr>
                <tr>
                    <th>Medical Conditions:</th>
                    <td colspan="3">${patient.conditions || 'None recorded'}</td>
                </tr>
                <tr>
                    <th>Medications:</th>
                    <td colspan="3">${patient.medications || 'None recorded'}</td>
                </tr>
                <tr>
                    <th>Primary Physician:</th>
                    <td colspan="3">${patient.physician || 'None specified'}</td>
                </tr>
            </table>
        `;

        // Fetch and display associated files
        const filesResponse = await fetch(`/api/patients/${patientId}/files`);
        const filesData = await filesResponse.json();
        
        if (filesData.success && filesData.data.files.length > 0) {
            const filesList = document.getElementById('files-list');
            filesList.innerHTML = filesData.data.files.map(file => `
                <tr>
                    <td>${file.name}</td>
                    <td>${file.type}</td>
                    <td>${new Date(file.uploadDate).toLocaleString()}</td>
                    <td>
                        <button onclick="downloadFile('${file.id}', '${file.type}')">Download</button>
                        ${currentUser?.role === 'admin' ? 
                        `<button onclick="deleteFile('${file.id}')">Delete</button>` : ''}
                    </td>
                </tr>
            `).join('');
        } else {
            document.getElementById('files-list').innerHTML = `
                <tr>
                    <td colspan="4">No files found for this patient</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error("Error loading patient details:", error);
        document.getElementById('patient-info').innerHTML = `
            <div class="error">
                <p>Error loading patient details: ${error.message}</p>
            </div>
        `;
    }
}

async function downloadFile(fileId, format) {
    try {
        // In a real implementation, this would initiate a download
        const response = await fetch(`/api/files/${fileId}/download?format=${format}`);
        const data = await response.json();
        
        if (data.success) {
            // This would be replaced with actual download logic
            alert(`Preparing download of file ${fileId} in ${format} format`);
            console.log('Download initiated:', data.data.downloadUrl);
        } else {
            throw new Error(data.error || "Download failed");
        }
    } catch (error) {
        showError('Download error: ' + error.message);
    }
}

async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
        const response = await fetch(`/api/files/${fileId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            alert('File deleted successfully');
            loadPatientDetails(); // Refresh the file list
        } else {
            throw new Error(data.error || "Delete failed");
        }
    } catch (error) {
        showError('Delete error: ' + error.message);
    }
}

function viewPatientDetails(patientId) {
    // Store the patient ID in session storage
    sessionStorage.setItem('currentPatientId', patientId);
    // Open the details page
    window.open('patient-details.html', '_blank');
}

async function savePatientChanges(patientId) {
    if (currentMode !== 'admin' || currentUser?.role !== 'admin') {
        showError('Must be in admin mode to modify data');
        return;
    }

    const row = document.querySelector(`tr[data-id="${patientId}"]`);
    const inputs = row.querySelectorAll('input');
    const updates = {};

    inputs.forEach(input => {
        updates[input.dataset.field] = input.value;
    });

    try {
        const response = await fetch(`/api/patients/${patientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Update failed");
        }

        alert('Patient data updated successfully');
    } catch (error) {
        showError('Update error: ' + error.message);
    }
}

// uploadEEGFile function
async function uploadEEGFile() {
    if (!currentUser || currentUser.role !== 'admin') {
        showError('Admin access required for file uploads');
        return;
    }

    const fileInput = document.getElementById('eeg-file-upload');
    const fileType = document.getElementById('upload-file-type').value;
    const patientId = document.getElementById('patient-task-upload').value;
    const name = document.getElementById('patient-name-upload').value;
    const dob = document.getElementById('patient-dob-upload').value;

    // Validate all required fields
    if (!name || !dob || !patientId || !fileInput.files.length || !fileType) {
        showError('Please fill in all required fields');
        return;
    }

    // Validate file extension matches selected type
    const fileName = fileInput.files[0].name.toLowerCase();
    const fileExt = fileName.split('.').pop();
    const allowedExtensions = ['edf', 'bdf', 'cnt'];
    
    if (!allowedExtensions.includes(fileExt)) {
        showError('Invalid file type. Only EDF, BDF, and CNT files are allowed');
        return;
    }

    const formData = new FormData();
    formData.append('eegFile', fileInput.files[0]);
    formData.append('patientId', patientId);
    formData.append('dob', dob);
    formData.append('name', name);
    formData.append('fileType', fileType);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Upload failed");
        }

        alert(`EEG file uploaded successfully as ${fileType.toUpperCase()}`);
        fileInput.value = '';
        document.getElementById('upload-form').reset();
    } catch (error) {
        showError('Upload error: ' + error.message);
    }
}

// downloadEEGFile function
async function downloadEEGFile() {
    if (!currentUser) {
        showError('Please login first');
        return;
    }

    const fileId = document.getElementById('download-file-id').value;
    const format = document.getElementById('download-format').value;

    if (!fileId || !format) {
        showError('Please enter a file ID and select a format');
        return;
    }

    try {
        // First check if conversion is needed
        const checkResponse = await fetch(`/api/files/${fileId}/info`);
        const checkData = await checkResponse.json();

        if (!checkData.success) {
            throw new Error(checkData.error || "File not found");
        }

        const originalFormat = checkData.data.fileType.toLowerCase();
        const targetFormat = format.toLowerCase();

        if (originalFormat !== targetFormat) {
            if (!confirm(`This file is in ${originalFormat.toUpperCase()} format. Convert to ${targetFormat.toUpperCase()} before downloading?`)) {
                return;
            }

            // Convert the file first
            const convertResponse = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    fileId, 
                    targetFormat 
                }),
            });

            const convertData = await convertResponse.json();

            if (!convertData.success) {
                throw new Error(convertData.error || "Conversion failed");
            }

            // Download the converted file
            alert(`File converted to ${targetFormat.toUpperCase()}. Starting download...`);
            initiateDownload(convertData.data.convertedFileId, targetFormat);
        } else {
            // Download original file
            initiateDownload(fileId, targetFormat);
        }
    } catch (error) {
        showError('Download error: ' + error.message);
    }
}

function initiateDownload(fileId, format) {
    // In a real implementation, this would redirect to the download endpoint
    // or create a temporary download link
    console.log(`Initiating download of file ${fileId} in ${format} format`);
    
    // Simulate download (replace with actual download logic)
    const downloadUrl = `/api/files/${fileId}/download?format=${format}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `eeg_data.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    alert(`Downloading file as ${format.toUpperCase()}`);
}
async function convertEEGFile(fileId, targetFormat) {
    if (currentUser?.role !== 'admin') {
        showError('Admin access required');
        return;
    }

    try {
        const response = await fetch('/api/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileId, targetFormat }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Conversion failed");
        }

        alert(`File converted to ${targetFormat} successfully. New file ID: ${data.data.convertedFileId}`);
    } catch (error) {
        showError('Conversion error: ' + error.message);
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message') || document.createElement('div');
    errorElement.textContent = message;
    errorElement.className = 'error';
    errorElement.style.display = 'block';
    
    // If the element doesn't exist in DOM, add it temporarily
    if (!document.getElementById('error-message')) {
        errorElement.id = 'error-message';
        document.body.prepend(errorElement);
    }
    
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}
