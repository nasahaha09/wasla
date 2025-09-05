// Authentication system for Wasla
import { 
  createUser, 
  signInUser, 
  signOutUser, 
  getCurrentUser, 
  updateUserCredits 
} from './supabase.js';

// Performance: Cache DOM elements
const domCache = new Map();

function getCachedElement(id) {
    if (!domCache.has(id)) {
        domCache.set(id, document.getElementById(id));
    }
    return domCache.get(id);
}

// User state
let currentUser = null;
let isAuthenticated = false;

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

async function initializeAuth() {
    try {
        const { data: user, error } = await getCurrentUser();
        
        if (user && !error) {
            currentUser = user;
            isAuthenticated = true;
            updateUIForAuthenticatedUser();
        } else {
            updateUIForUnauthenticatedUser();
        }
    } catch (error) {
        console.error('Error initializing auth:', error);
        updateUIForUnauthenticatedUser();
    }
}

function updateUIForAuthenticatedUser() {
    // Hide auth button, show user menu
    const authButton = getCachedElement('auth-button');
    const userMenu = getCachedElement('user-menu');
    const mobileAuthButton = getCachedElement('mobile-auth-button');
    const mobileUserMenu = getCachedElement('mobile-user-menu');
    
    // Batch DOM updates
    requestAnimationFrame(() => {
        if (authButton) authButton.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        if (mobileAuthButton) mobileAuthButton.classList.add('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.remove('hidden');
    });
    
    // Update user info
    updateUserInfo();
}

function updateUIForUnauthenticatedUser() {
    // Show auth button, hide user menu
    const authButton = getCachedElement('auth-button');
    const userMenu = getCachedElement('user-menu');
    const mobileAuthButton = getCachedElement('mobile-auth-button');
    const mobileUserMenu = getCachedElement('mobile-user-menu');
    
    // Batch DOM updates
    requestAnimationFrame(() => {
        if (authButton) authButton.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
        if (mobileAuthButton) mobileAuthButton.classList.remove('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.add('hidden');
    });
}

function updateUserInfo() {
    if (!currentUser) return;
    
    // Cache and batch DOM updates
    requestAnimationFrame(() => {
        const userNameElements = document.querySelectorAll('#user-name, #mobile-user-name');
        const userInitialsElements = document.querySelectorAll('#user-initials, #mobile-user-initials');
        const userCreditsElements = document.querySelectorAll('#user-credits, #mobile-user-credits, #balance-credits');
        
        const initials = getInitials(currentUser.name);
        
        userNameElements.forEach(el => el.textContent = currentUser.name);
        userInitialsElements.forEach(el => el.textContent = initials);
        userCreditsElements.forEach(el => el.textContent = currentUser.credits);
    });
}

// Memoize initials calculation
const initialsCache = new Map();

function getInitials(name) {
    if (initialsCache.has(name)) {
        return initialsCache.get(name);
    }
    
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    initialsCache.set(name, initials);
    return initials;
}

// Optimized modal functions
function showAuthModal() {
    const modal = getCachedElement('auth-modal');
    if (modal) {
        modal.classList.remove('hidden');
        switchAuthTab('signup'); // Default to signup
    }
}

function hideAuthModal() {
    const modal = getCachedElement('auth-modal');
    if (modal) {
        modal.classList.add('hidden');
        clearAuthForms();
    }
}

// Country selection
function selectCountry(country) {
    if (country === 'egypt') {
        document.getElementById('country-selection').classList.add('hidden');
        localStorage.setItem('selectedCountry', 'egypt');
    } else {
        alert(currentLanguage === 'ar' 
            ? 'هذه الميزة ستكون متاحة قريباً للدول الأخرى!'
            : 'This feature will be available soon for other countries!'
        );
    }
}

// Authentication functions
function switchAuthTab(tab) {
    const signupTab = document.getElementById('signup-tab');
    const loginTab = document.getElementById('login-tab');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const modalTitle = document.getElementById('auth-modal-title');
    const modalSubtitle = document.getElementById('auth-modal-subtitle');
    
    // Reset tab styles
    signupTab.classList.remove('active');
    loginTab.classList.remove('active');
    signupForm.classList.remove('active');
    loginForm.classList.remove('active');
    
    if (tab === 'signup') {
        signupTab.classList.add('active');
        signupForm.classList.add('active');
        modalTitle.textContent = currentLanguage === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account';
        modalSubtitle.textContent = currentLanguage === 'ar' ? 'انضم إلى مجتمع وصلة واحصل على رصيد مجاني!' : 'Join Wasla community and get free credits!';
    } else {
        loginTab.classList.add('active');
        loginForm.classList.add('active');
        modalTitle.textContent = currentLanguage === 'ar' ? 'تسجيل الدخول' : 'Sign In';
        modalSubtitle.textContent = currentLanguage === 'ar' ? 'مرحباً بعودتك إلى وصلة!' : 'Welcome back to Wasla!';
    }
}

async function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const currency = document.getElementById('signup-currency').value;
    
    if (!name || !email || !password) {
        alert(currentLanguage === 'ar' 
            ? 'يرجى ملء جميع الحقول المطلوبة'
            : 'Please fill in all required fields'
        );
        return;
    }
    
    if (!isValidEmail(email)) {
        alert(currentLanguage === 'ar' 
            ? 'يرجى إدخال بريد إلكتروني صحيح'
            : 'Please enter a valid email address'
        );
        return;
    }
    
    if (password.length < 6) {
        alert(currentLanguage === 'ar' 
            ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
            : 'Password must be at least 6 characters long'
        );
        return;
    }
    
    try {
        // Show loading state
        const submitButton = document.querySelector('#signup-form button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = currentLanguage === 'ar' ? 'جاري الإنشاء...' : 'Creating...';
        submitButton.disabled = true;
        
        const { data, error } = await createUser({
            name,
            email,
            password,
            currency
        });
        
        if (error) throw error;
        
        currentUser = data;
        isAuthenticated = true;
        
        // Update UI
        updateUIForAuthenticatedUser();
        hideAuthModal();
        
        // Show success message
        alert(currentLanguage === 'ar' 
            ? 'تم إنشاء حسابك بنجاح! حصلت على 10 رصيد مجاني.'
            : 'Account created successfully! You received 10 free credits.'
        );
    } catch (error) {
        alert(currentLanguage === 'ar' 
            ? `خطأ في إنشاء الحساب: ${error.message}`
            : `Error creating account: ${error.message}`
        );
    } finally {
        // Reset button state
        const submitButton = document.querySelector('#signup-form button[type="submit"]');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    if (!email || !password) {
        alert(currentLanguage === 'ar' 
            ? 'يرجى ملء جميع الحقول المطلوبة'
            : 'Please fill in all required fields'
        );
        return;
    }
    
    if (!isValidEmail(email)) {
        alert(currentLanguage === 'ar' 
            ? 'يرجى إدخال بريد إلكتروني صحيح'
            : 'Please enter a valid email address'
        );
        return;
    }
    
    try {
        // Show loading state
        const submitButton = document.querySelector('#login-form button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = currentLanguage === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...';
        submitButton.disabled = true;
        
        const { data, error } = await signInUser(email, password);
        
        if (error) throw error;
        
        currentUser = data.user;
        isAuthenticated = true;
        
        // Update UI
        updateUIForAuthenticatedUser();
        hideAuthModal();
        
        // Show success message
        alert(currentLanguage === 'ar' 
            ? 'تم تسجيل الدخول بنجاح!'
            : 'Logged in successfully!'
        );
    } catch (error) {
        alert(currentLanguage === 'ar' 
            ? `خطأ في تسجيل الدخول: ${error.message}`
            : `Error signing in: ${error.message}`
        );
    } finally {
        // Reset button state
        const submitButton = document.querySelector('#login-form button[type="submit"]');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

async function logout() {
    try {
        await signOutUser();
        
        currentUser = null;
        isAuthenticated = false;
        
        // Update UI
        updateUIForUnauthenticatedUser();
        
        // Redirect to home page
        showPage('home');
        
        alert(currentLanguage === 'ar' 
            ? 'تم تسجيل الخروج بنجاح'
            : 'Logged out successfully'
        );
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

function clearAuthForms() {
    // Clear signup form
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-currency').value = 'EGP';
    
    // Clear login form
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

// Feature access control
function checkAuthAndNavigate(page) {
    if (!isAuthenticated) {
        showFeatureLockedModal();
        return;
    }
    
    // Check if user has enough credits for certain features
    if ((page === 'chatbot' || page === 'search') && currentUser.credits <= 0) {
        alert(currentLanguage === 'ar' 
            ? 'ليس لديك رصيد كافي. يرجى شراء المزيد من الرصيد.'
            : 'You don\'t have enough credits. Please purchase more credits.'
        );
        showPage('credits');
        return;
    }
    
    showPage(page);
}

function showFeatureLockedModal() {
    document.getElementById('feature-locked-modal').classList.remove('hidden');
}

function hideFeatureLockedModal() {
    document.getElementById('feature-locked-modal').classList.add('hidden');
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Credit management
async function deductCredit() {
    if (!isAuthenticated || !currentUser) return false;
    
    if (currentUser.credits <= 0) {
        alert(currentLanguage === 'ar' 
            ? 'ليس لديك رصيد كافي. يرجى شراء المزيد من الرصيد.'
            : 'You don\'t have enough credits. Please purchase more credits.'
        );
        showPage('credits');
        return false;
    }
    
    try {
        const newCredits = currentUser.credits - 1;
        const { data, error } = await updateUserCredits(currentUser.id, newCredits);
        
        if (error) throw error;
        
        currentUser.credits = newCredits;
        updateUserInfo();
        return true;
    } catch (error) {
        console.error('Error deducting credit:', error);
        return false;
    }
}

async function addCredits(amount) {
    if (!isAuthenticated || !currentUser) return;
    
    try {
        const newCredits = currentUser.credits + amount;
        const { data, error } = await updateUserCredits(currentUser.id, newCredits);
        
        if (error) throw error;
        
        currentUser.credits = newCredits;
        updateUserInfo();
    } catch (error) {
    }
}
// Check if country selection was already made
document.addEventListener('DOMContentLoaded', function() {
    const selectedCountry = localStorage.getItem('selectedCountry');
    if (selectedCountry === 'egypt') {
        document.getElementById('country-selection').classList.add('hidden');
    }
});