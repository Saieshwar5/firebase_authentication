// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey:  "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const resetForm = document.getElementById('reset-form');
const userContent = document.getElementById('user-content');
const loadingSpinner = document.getElementById('loading-spinner');
const createAccountLink = document.getElementById('create-account');
const backToLoginBtn = document.getElementById('back-to-login');
const forgotPasswordLink = document.getElementById('forgot-password');
const backFromResetBtn = document.getElementById('back-from-reset');

// Form submissions
loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignUp);
resetForm.addEventListener('submit', handlePasswordReset);

// Navigation between forms
createAccountLink.addEventListener('click', showSignUpOptions);
backToLoginBtn.addEventListener('click', showLoginForm);
forgotPasswordLink.addEventListener('click', showResetForm);
backFromResetBtn.addEventListener('click', showLoginForm);

// Other buttons
document.getElementById('google-signin').addEventListener('click', signInWithGoogle);
document.getElementById('signup-google-btn').addEventListener('click', signInWithGoogle);
document.getElementById('logout-btn').addEventListener('click', handleSignOut);
document.getElementById('resend-verification').addEventListener('click', resendVerificationEmail);

// Check if user is already logged in
onAuthStateChanged(auth, user => {
  hideLoading();
  if (user) {
    if (user.emailVerified || user.providerData[0].providerId === 'google.com') {
      // User is verified or using Google auth - redirect to main page
      redirectToMainPage();
    } else {
      // Email not verified - show verification needed screen
      showEmailVerificationNeeded(user);
    }
  } else {
    showLoginForm();
  }
});

// Email/Password Login
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  // Email format validation
  if (!validateEmail(email)) {
    showError("Please enter a valid email address");
    return;
  }
  
  showLoading();
  
  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        hideLoading();
        showEmailVerificationNeeded(user);
      } else {
        // User is verified - redirect to main page
        redirectToMainPage();
      }
    })
    .catch(error => {
      hideLoading();
      if (error.code === 'auth/invalid-email') {
        showError("Invalid email format");
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        showError("Invalid email or password");
      } else {
        showError(error.message);
      }
    });
}

// Email/Password Sign Up
function handleSignUp(e) {
  e.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  
  // Validation
  if (!validateEmail(email)) {
    showError("Please enter a valid email address");
    return;
  }
  
  if (password !== confirmPassword) {
    showError("Passwords don't match");
    return;
  }
  
  showLoading();
  
  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      // Update profile with name
      return updateProfile(userCredential.user, {
        displayName: name
      }).then(() => {
        // Send verification email
        return sendEmailVerification(userCredential.user).then(() => {
          hideLoading();
          showEmailVerificationNeeded(userCredential.user);
        });
      });
    })
    .catch(error => {
      hideLoading();
      if (error.code === 'auth/email-already-in-use') {
        showError("This email is already registered");
      } else if (error.code === 'auth/invalid-email') {
        showError("Invalid email format");
      } else if (error.code === 'auth/weak-password') {
        showError("Password is too weak - use at least 6 characters");
      } else {
        showError(error.message);
      }
    });
}

// Resend verification email
function resendVerificationEmail() {
  const user = auth.currentUser;
  if (user) {
    showLoading();
    sendEmailVerification(user)
      .then(() => {
        hideLoading();
        alert('Verification email sent successfully. Please check your inbox.');
      })
      .catch(error => {
        hideLoading();
        showError(error.message);
      });
  }
}

// Password Reset
function handlePasswordReset(e) {
  e.preventDefault();
  
  const email = document.getElementById('reset-email').value;
  
  // Email format validation
  if (!validateEmail(email)) {
    showError("Please enter a valid email address");
    return;
  }
  
  showLoading();
  
  sendPasswordResetEmail(auth, email)
    .then(() => {
      hideLoading();
      alert(`Password reset email sent to ${email}`);
      showLoginForm();
    })
    .catch(error => {
      hideLoading();
      if (error.code === 'auth/user-not-found') {
        showError("No account exists with this email");
      } else {
        showError(error.message);
      }
    });
}

// Google Authentication
function signInWithGoogle() {
  showLoading();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  
  signInWithPopup(auth, provider)
    .then(result => {
      // User signed in successfully with Google - redirect to main page
      redirectToMainPage();
    })
    .catch(error => {
      hideLoading();
      showError(error.message);
    });
}

// Sign Out
function handleSignOut() {
  showLoading();
  
  firebaseSignOut(auth)
    .then(() => {
      showLoginForm();
      hideLoading();
      // Clear form inputs
      loginForm.reset();
      signupForm.reset();
      resetForm.reset();
    })
    .catch(error => {
      hideLoading();
      showError(error.message);
    });
}

// Redirect to main page after successful authentication
function redirectToMainPage() {
  // Change window location to the main page
  window.location.href = "main-page.html";
}

// UI State Management
function showLoginForm() {
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('signup-options').style.display = 'none';
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('reset-form').style.display = 'none';
  document.getElementById('user-content').style.display = 'none';
  document.getElementById('verification-needed').style.display = 'none';
}

function showSignUpOptions(e) {
  e.preventDefault();
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('signup-options').style.display = 'block';
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('reset-form').style.display = 'none';
  document.getElementById('user-content').style.display = 'none';
  document.getElementById('verification-needed').style.display = 'none';
}

function showSignUpForm() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('signup-options').style.display = 'none';
  document.getElementById('signup-form').style.display = 'block';
  document.getElementById('reset-form').style.display = 'none';
  document.getElementById('user-content').style.display = 'none';
  document.getElementById('verification-needed').style.display = 'none';
}

function showResetForm(e) {
  e.preventDefault();
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('signup-options').style.display = 'none';
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('reset-form').style.display = 'block';
  document.getElementById('user-content').style.display = 'none';
  document.getElementById('verification-needed').style.display = 'none';
}

function showEmailVerificationNeeded(user) {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('signup-options').style.display = 'none';
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('reset-form').style.display = 'none';
  document.getElementById('user-content').style.display = 'none';
  document.getElementById('verification-needed').style.display = 'block';
  
  // Update UI with user's email
  document.getElementById('verification-email').textContent = user.email;
}

// Utilities
function showLoading() {
  loadingSpinner.style.display = 'flex';
}

function hideLoading() {
  loadingSpinner.style.display = 'none';
}

function showError(message) {
  alert(message);
}

// Email validation function
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Exposing the signup form button functionality
document.getElementById('email-signup-btn').addEventListener('click', showSignUpForm);