// Main application logic for Wasla
import { 
  createUserRoute, 
  getUserRoutes, 
  getAllUserRoutes, 
  voteOnRoute, 
  recordRouteSearch 
} from './supabase.js';

// Performance optimizations
let debounceTimer = null;
let cachedStops = null;
let cachedRoutes = null;
let cachedPackages = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set initial time for chat
    const initialTime = document.getElementById('initial-time');
    if (initialTime) {
        initialTime.textContent = new Date().toLocaleTimeString();
    }
    
    // Load important stops
    loadImportantStops();
    
    // Load user routes
    loadUserRoutes();
    
    // Load credit packages
    loadCreditPackages();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update translations
    updateTranslations();
    
    // Show home page by default
    showPage('home');
}

function setupEventListeners() {
    // Chat input enter key
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                debounce(sendMessage, 300);
            }
        });
    }
    
    // Search inputs enter key
    const originInput = document.getElementById('origin-input');
    const destinationInput = document.getElementById('destination-input');
    
    if (originInput && destinationInput) {
        [originInput, destinationInput].forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    debounce(searchRoutes, 500);
                }
            });
        });
    }
}

// Debounce function to prevent excessive API calls
function debounce(func, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
}

// Navigation functions
function showPage(pageId) {
    // Use requestAnimationFrame for smooth transitions
    requestAnimationFrame(() => {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update navigation active state
        updateNavigation(pageId);
    });
}

function updateNavigation(activePageId) {
    // Use document fragments for better performance
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    // Batch DOM updates
    navLinks.forEach(link => {
        const isActive = link.dataset.page === activePageId;
        link.classList.toggle('active', isActive);
    });
    
    mobileNavLinks.forEach(link => {
        const isActive = link.dataset.page === activePageId;
        link.classList.toggle('active', isActive);
    });
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');
    
    // Use classList.toggle for cleaner code
    const isHidden = mobileMenu.classList.toggle('hidden');
    menuIcon.classList.toggle('hidden', !isHidden);
    closeIcon.classList.toggle('hidden', isHidden);
}

// Optimized message creation using document fragments
function createMessageElement(text, isUser) {
    const fragment = document.createDocumentFragment();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `message-bubble ${isUser ? 'user' : 'bot'}`;
    
    const textP = document.createElement('p');
    textP.className = 'text-sm';
    textP.textContent = text;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'text-xs opacity-70 mt-1';
    timeDiv.textContent = new Date().toLocaleTimeString();
    
    bubbleDiv.appendChild(textP);
    bubbleDiv.appendChild(timeDiv);
    messageDiv.appendChild(bubbleDiv);
    fragment.appendChild(messageDiv);
    
    return fragment;
}

function addChatMessage(text, isUser) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageFragment = createMessageElement(text, isUser);
    messagesContainer.appendChild(messageFragment);
    
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// Optimized route options creation
function addRouteOptions() {
    const messagesContainer = document.getElementById('chat-messages');
    const fragment = document.createDocumentFragment();
    
    const routes = getRouteData();
    
    routes.forEach((route, routeIndex) => {
        const routeDiv = createRouteElement(route, routeIndex);
        fragment.appendChild(routeDiv);
    });
    
    messagesContainer.appendChild(fragment);
    requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// Extract route data to avoid recreation
function getRouteData() {
    if (cachedRoutes) return cachedRoutes;
    
    cachedRoutes = [
        {
            duration: '1h 45m',
            cost: '15 EGP',
            steps: currentLanguage === 'ar' ? [
                'امشي إلى محطة مترو مدينة نصر (5 دقائق)',
                'اركب مترو الخط 3 إلى العتبة (25 دقيقة)',
                'انتقل إلى مترو الخط 2 باتجاه الجيزة (15 دقيقة)',
                'انزل في محطة الجيزة',
                'اركب ميكروباص #927 إلى 6 أكتوبر (45 دقيقة)',
                'امشي إلى الوجهة (10 دقائق)'
            ] : [
                'Walk to Nasr City Metro Station (5 min)',
                'Take Metro Line 3 to Attaba (25 min)',
                'Transfer to Metro Line 2 toward Giza (15 min)',
                'Exit at Giza Station',
                'Take Microbus #927 to 6th October (45 min)',
                'Walk to destination (10 min)'
            ],
            modes: ['Walk', 'Metro', 'Microbus']
        },
        {
            duration: '2h 15m',
            cost: '12 EGP',
            steps: currentLanguage === 'ar' ? [
                'امشي إلى موقف الأتوبيس في مدينة نصر (8 دقائق)',
                'اركب أتوبيس #174 إلى رمسيس (35 دقيقة)',
                'انتقل إلى أتوبيس #381 باتجاه 6 أكتوبر (ساعة و20 دقيقة)',
                'امشي إلى الوجهة (12 دقيقة)'
            ] : [
                'Walk to Nasr City Bus Stop (8 min)',
                'Take Bus #174 to Ramses (35 min)',
                'Transfer to Bus #381 toward 6th October (1h 20 min)',
                'Walk to destination (12 min)'
            ],
            modes: ['Walk', 'Bus']
        }
    ];
    
    return cachedRoutes;
}

// Optimized route element creation
function createRouteElement(route, routeIndex) {
    const routeDiv = document.createElement('div');
    routeDiv.className = 'bg-yellow-50 border border-yellow-200 rounded-lg p-4';
    
    // Create header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex items-center justify-between mb-3';
    
    // Create info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'flex items-center space-x-4';
    infoDiv.innerHTML = `
        <div class="flex items-center text-gray-600">
            <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm">${route.duration}</span>
        </div>
        <div class="flex items-center text-gray-600">
            <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
            <span class="text-sm">${route.cost}</span>
        </div>
    `;
    
    // Create modes section
    const modesDiv = document.createElement('div');
    modesDiv.className = 'flex space-x-1';
    route.modes.forEach(mode => {
        const modeSpan = document.createElement('span');
        modeSpan.className = 'px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full';
        modeSpan.textContent = mode;
        modesDiv.appendChild(modeSpan);
    });
    
    headerDiv.appendChild(infoDiv);
    headerDiv.appendChild(modesDiv);
    
    // Create steps section
    const stepsDiv = document.createElement('div');
    stepsDiv.className = 'space-y-2';
    
    route.steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'flex items-start';
        stepDiv.innerHTML = `
            <div class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">
                ${index + 1}
            </div>
            <p class="text-sm text-gray-700">${step}</p>
        `;
        stepsDiv.appendChild(stepDiv);
    });
    
    routeDiv.appendChild(headerDiv);
    routeDiv.appendChild(stepsDiv);
    
    return routeDiv;
}

// Optimized search results display
function displaySearchResults() {
    const resultsDiv = document.getElementById('results-container');
    const fragment = document.createDocumentFragment();
    
    const mockResults = [
        {
            id: '1',
            duration: '1h 30m',
            cost: '18 EGP',
            distance: '45 km',
            steps: currentLanguage === 'ar' ? [
                { instruction: 'امشي إلى أقرب محطة مترو', mode: 'مشي', duration: '5 دقائق' },
                { instruction: 'اركب مترو الخط 1 إلى السادات', mode: 'مترو', duration: '25 دقيقة' },
                { instruction: 'انتقل إلى مترو الخط 2', mode: 'مترو', duration: '5 دقائق' },
                { instruction: 'اركب مترو الخط 2 إلى الجيزة', mode: 'مترو', duration: '20 دقيقة' },
                { instruction: 'اركب أتوبيس #381 إلى الوجهة', mode: 'أتوبيس', duration: '35 دقيقة' }
            ] : [
                { instruction: 'Walk to nearest Metro station', mode: 'Walk', duration: '5 min' },
                { instruction: 'Take Metro Line 1 to Sadat', mode: 'Metro', duration: '25 min' },
                { instruction: 'Transfer to Metro Line 2', mode: 'Metro', duration: '5 min' },
                { instruction: 'Take Metro Line 2 to Giza', mode: 'Metro', duration: '20 min' },
                { instruction: 'Take Bus #381 to destination', mode: 'Bus', duration: '35 min' }
            ]
        }
    ];
    
    mockResults.forEach((route, index) => {
        const routeElement = createSearchRouteElement(route, index);
        fragment.appendChild(routeElement);
    });
    
    resultsDiv.innerHTML = '';
    resultsDiv.appendChild(fragment);
}

// Separate function for creating search route elements
function createSearchRouteElement(route, index) {
    const routeDiv = document.createElement('div');
    routeDiv.className = 'route-card';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex items-center justify-between mb-4';
    headerDiv.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-900">${currentLanguage === 'ar' ? 'الطريق' : 'Route'} ${index + 1}</h3>
        <div class="flex items-center space-x-4 text-sm text-gray-600">
            <div class="flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>${route.duration}</span>
            </div>
            <div class="flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
                <span>${route.cost}</span>
            </div>
            <div class="text-gray-500">${route.distance}</div>
        </div>
    `;
    
    const stepsDiv = document.createElement('div');
    stepsDiv.className = 'space-y-3';
    
    route.steps.forEach((step, stepIndex) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'flex items-start';
        stepDiv.innerHTML = `
            <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-4">
                ${stepIndex + 1}
            </div>
            <div class="flex-1">
                <p class="text-gray-900">${step.instruction}</p>
                <div class="flex items-center mt-1">
                    <span class="px-2 py-1 rounded-full text-xs mr-2 ${getModeColor(step.mode)}">
                        ${step.mode}
                    </span>
                    <span class="text-gray-500 text-sm">${step.duration}</span>
                </div>
            </div>
        `;
        stepsDiv.appendChild(stepDiv);
    });
    
    routeDiv.appendChild(headerDiv);
    routeDiv.appendChild(stepsDiv);
    
    return routeDiv;
}

// Cache mode colors to avoid repeated calculations
const modeColorCache = new Map();

function getModeColor(mode) {
    if (modeColorCache.has(mode)) {
        return modeColorCache.get(mode);
    }
    
    const modeColors = {
        'Metro': 'bg-blue-100 text-blue-800',
        'مترو': 'bg-blue-100 text-blue-800',
        'Bus': 'bg-green-100 text-green-800',
        'أتوبيس': 'bg-green-100 text-green-800',
        'Microbus': 'bg-purple-100 text-purple-800',
        'ميكروباص': 'bg-purple-100 text-purple-800',
        'Walk': 'bg-gray-100 text-gray-800',
        'مشي': 'bg-gray-100 text-gray-800'
    };
    
    const color = modeColors[mode] || 'bg-gray-100 text-gray-800';
    modeColorCache.set(mode, color);
    return color;
}

// Optimized important stops loading with caching
function loadImportantStops() {
    const stopsGrid = document.getElementById('stops-grid');
    if (!stopsGrid) return;
    
    if (cachedStops && stopsGrid.children.length > 0) {
        // Update existing elements instead of recreating
        updateStopsContent();
        return;
    }
    
    const stops = getStopsData();
    const fragment = document.createDocumentFragment();
    
    stops.forEach(stop => {
        const stopElement = createStopElement(stop);
        fragment.appendChild(stopElement);
    });
    
    stopsGrid.innerHTML = '';
    stopsGrid.appendChild(fragment);
    cachedStops = stops;
}

// Extract stops data
function getStopsData() {
    return [
        {
            id: 'ramses',
            name: currentLanguage === 'ar' ? 'محطة رمسيس' : 'Ramses Station',
            nameSecondary: currentLanguage === 'ar' ? 'Ramses Station' : 'محطة رمسيس',
            description: currentLanguage === 'ar' 
                ? 'محور السكك الحديدية والمترو الرئيسي الذي يربط القاهرة ببقية مصر'
                : 'Major railway and metro hub connecting Cairo with rest of Egypt',
            connections: currentLanguage === 'ar' 
                ? ['مترو الخط 2', 'السكك الحديدية الوطنية', '50+ خط أتوبيس']
                : ['Metro Line 2', 'National Railway', '50+ Bus Lines'],
            imageUrl: 'https://images.pexels.com/photos/2935687/pexels-photo-2935687.jpeg',
            routes: 75,
            isMetroStation: true,
        },
        {
            id: 'tahrir',
            name: currentLanguage === 'ar' ? 'ميدان التحرير' : 'Tahrir Square',
            nameSecondary: currentLanguage === 'ar' ? 'Tahrir Square' : 'ميدان التحرير',
            description: currentLanguage === 'ar'
                ? 'الميدان التاريخي المركزي مع شبكات واسعة من الأتوبيسات والميكروباصات'
                : 'Historic central square with extensive bus and microbus networks',
            connections: currentLanguage === 'ar'
                ? ['مترو الخط 2', '30+ خط أتوبيس', '20+ خط ميكروباص']
                : ['Metro Line 2', '30+ Bus Lines', '20+ Microbus Lines'],
            imageUrl: 'https://images.pexels.com/photos/2363807/pexels-photo-2363807.jpeg',
            routes: 65,
            isMetroStation: true,
        },
        {
            id: 'aboud',
            name: currentLanguage === 'ar' ? 'عبود' : 'Aboud',
            nameSecondary: currentLanguage === 'ar' ? 'Aboud' : 'عبود',
            description: currentLanguage === 'ar'
                ? 'تقاطع مواصلات رئيسي في الجيزة يربط بالمناطق الغربية'
                : 'Key transportation junction in Giza connecting to western regions',
            connections: currentLanguage === 'ar'
                ? ['15+ خط أتوبيس', '25+ خط ميكروباص']
                : ['15+ Bus Lines', '25+ Microbus Lines'],
            imageUrl: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg',
            routes: 45,
            isMetroStation: false,
        }
    ];
}

// Create stop element
function createStopElement(stop) {
    const stopDiv = document.createElement('div');
    stopDiv.className = 'stop-card';
    stopDiv.onclick = () => showStopDetails(stop.id);
    
    stopDiv.innerHTML = `
        <div class="relative h-48 overflow-hidden">
            <img src="${stop.imageUrl}" alt="${stop.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div class="absolute bottom-4 left-4 text-white">
                <h3 class="text-xl font-bold">${stop.name}</h3>
                <p class="text-sm opacity-90">${stop.nameSecondary}</p>
            </div>
            ${stop.isMetroStation ? `
                <div class="absolute top-4 right-4">
                    <svg class="h-6 w-6 text-white bg-blue-600 p-1 rounded" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                </div>
            ` : ''}
        </div>
        <div class="p-6">
            <p class="text-gray-600 text-sm mb-4">${stop.description}</p>
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center text-yellow-600">
                    <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <span class="text-sm font-medium">${stop.routes} ${currentLanguage === 'ar' ? 'طريق' : 'Routes'}</span>
                </div>
                <svg class="h-4 w-4 text-gray-400 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-900 mb-2">${currentLanguage === 'ar' ? 'أنواع المواصلات' : 'Transportation Types'}</h4>
                <div class="flex flex-wrap gap-1">
                    ${stop.connections.map(connection => `
                        <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            ${connection}
                        </span>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    return stopDiv;
}

// Update stops content when language changes
function updateStopsContent() {
    const stopsGrid = document.getElementById('stops-grid');
    if (!stopsGrid || !cachedStops) return;
    
    // Clear cache to force recreation with new language
    cachedStops = null;
    loadImportantStops();
}

// Optimized language toggle function
function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    
    // Clear caches when language changes
    cachedStops = null;
    cachedRoutes = null;
    cachedPackages = null;
    
    updateTranslations();
    
    // Reload dynamic content
    loadImportantStops();
    loadUserRoutes();
    loadCreditPackages();
}

// ChatBot functions
function sendMessage() {
    // Check authentication and credits
    if (!deductCredit()) {
        return;
    }
    
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, true);
    chatInput.value = '';
    
    // Show loading
    showChatLoading();
    
    // Simulate bot response
    setTimeout(() => {
        hideChatLoading();
        const botResponse = currentLanguage === 'ar' 
            ? 'وجدت عدة طرق لك من مدينة نصر إلى مدينة 6 أكتوبر:'
            : 'I found several routes for you from Nasr City to 6th of October City:';
        addChatMessage(botResponse, false);
        
        // Add route options
        setTimeout(() => {
            addRouteOptions();
        }, 500);
    }, 1500);
}

function addChatMessage_old(text, isUser) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `message-bubble ${isUser ? 'user' : 'bot'}`;
    
    const textP = document.createElement('p');
    textP.className = 'text-sm';
    textP.textContent = text;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'text-xs opacity-70 mt-1';
    timeDiv.textContent = new Date().toLocaleTimeString();
    
    bubbleDiv.appendChild(textP);
    bubbleDiv.appendChild(timeDiv);
    messageDiv.appendChild(bubbleDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    requestAnimationFrame(() => messagesContainer.scrollTop = messagesContainer.scrollHeight);
}

function showChatLoading() {
    const messagesContainer = document.getElementById('chat-messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'chat-loading';
    loadingDiv.className = 'chat-message bot';
    loadingDiv.innerHTML = `
        <div class="message-bubble bot">
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

function hideChatLoading() {
    const loadingDiv = document.getElementById('chat-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function addRouteOptions_old() {
    const messagesContainer = document.getElementById('chat-messages');
    const routeOptionsDiv = document.createElement('div');
    routeOptionsDiv.className = 'space-y-4';
    
    const routes = [
        {
            duration: '1h 45m',
            cost: '15 EGP',
            steps: currentLanguage === 'ar' ? [
                'امشي إلى محطة مترو مدينة نصر (5 دقائق)',
                'اركب مترو الخط 3 إلى العتبة (25 دقيقة)',
                'انتقل إلى مترو الخط 2 باتجاه الجيزة (15 دقيقة)',
                'انزل في محطة الجيزة',
                'اركب ميكروباص #927 إلى 6 أكتوبر (45 دقيقة)',
                'امشي إلى الوجهة (10 دقائق)'
            ] : [
                'Walk to Nasr City Metro Station (5 min)',
                'Take Metro Line 3 to Attaba (25 min)',
                'Transfer to Metro Line 2 toward Giza (15 min)',
                'Exit at Giza Station',
                'Take Microbus #927 to 6th October (45 min)',
                'Walk to destination (10 min)'
            ],
            modes: ['Walk', 'Metro', 'Microbus']
        },
        {
            duration: '2h 15m',
            cost: '12 EGP',
            steps: currentLanguage === 'ar' ? [
                'امشي إلى موقف الأتوبيس في مدينة نصر (8 دقائق)',
                'اركب أتوبيس #174 إلى رمسيس (35 دقيقة)',
                'انتقل إلى أتوبيس #381 باتجاه 6 أكتوبر (ساعة و20 دقيقة)',
                'امشي إلى الوجهة (12 دقيقة)'
            ] : [
                'Walk to Nasr City Bus Stop (8 min)',
                'Take Bus #174 to Ramses (35 min)',
                'Transfer to Bus #381 toward 6th October (1h 20 min)',
                'Walk to destination (12 min)'
            ],
            modes: ['Walk', 'Bus']
        }
    ];
    
    routes.forEach((route, routeIndex) => {
        const routeDiv = document.createElement('div');
        routeDiv.className = 'bg-yellow-50 border border-yellow-200 rounded-lg p-4';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex items-center justify-between mb-3';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center space-x-4';
        infoDiv.innerHTML = `
            <div class="flex items-center text-gray-600">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm">${route.duration}</span>
            </div>
            <div class="flex items-center text-gray-600">
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
                <span class="text-sm">${route.cost}</span>
            </div>
        `;
        
        const modesDiv = document.createElement('div');
        modesDiv.className = 'flex space-x-1';
        route.modes.forEach(mode => {
            const modeSpan = document.createElement('span');
            modeSpan.className = 'px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full';
            modeSpan.textContent = mode;
            modesDiv.appendChild(modeSpan);
        });
        
        headerDiv.appendChild(infoDiv);
        headerDiv.appendChild(modesDiv);
        
        const stepsDiv = document.createElement('div');
        stepsDiv.className = 'space-y-2';
        
        route.steps.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'flex items-start';
            stepDiv.innerHTML = `
                <div class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">
                    ${index + 1}
                </div>
                <p class="text-sm text-gray-700">${step}</p>
            `;
            stepsDiv.appendChild(stepDiv);
        });
        
        routeDiv.appendChild(headerDiv);
        routeDiv.appendChild(stepsDiv);
        routeOptionsDiv.appendChild(routeDiv);
    });
    
    messagesContainer.appendChild(routeOptionsDiv);
    requestAnimationFrame(() => messagesContainer.scrollTop = messagesContainer.scrollHeight);
}

// Search functions
function searchRoutes() {
    // Check authentication and credits
    if (!deductCredit()) {
        return;
    }
    
    const origin = document.getElementById('origin-input').value.trim();
    const destination = document.getElementById('destination-input').value.trim();
    
    if (!origin || !destination) return;
    
    const resultsContainer = document.getElementById('search-results');
    const resultsDiv = document.getElementById('results-container');
    
    // Show loading
    resultsDiv.innerHTML = `
        <div class="text-center py-8">
            <div class="loading-dots mx-auto mb-4">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
            <p class="text-gray-600">${t('searching')}</p>
        </div>
    `;
    resultsContainer.classList.remove('hidden');
    
    // Simulate search
    setTimeout(() => {
        displaySearchResults();
    }, 2000);
}

function displaySearchResults_old() {
    const resultsDiv = document.getElementById('results-container');
    
    const mockResults = [
        {
            id: '1',
            duration: '1h 30m',
            cost: '18 EGP',
            distance: '45 km',
            steps: currentLanguage === 'ar' ? [
                { instruction: 'امشي إلى أقرب محطة مترو', mode: 'مشي', duration: '5 دقائق' },
                { instruction: 'اركب مترو الخط 1 إلى السادات', mode: 'مترو', duration: '25 دقيقة' },
                { instruction: 'انتقل إلى مترو الخط 2', mode: 'مترو', duration: '5 دقائق' },
                { instruction: 'اركب مترو الخط 2 إلى الجيزة', mode: 'مترو', duration: '20 دقيقة' },
                { instruction: 'اركب أتوبيس #381 إلى الوجهة', mode: 'أتوبيس', duration: '35 دقيقة' }
            ] : [
                { instruction: 'Walk to nearest Metro station', mode: 'Walk', duration: '5 min' },
                { instruction: 'Take Metro Line 1 to Sadat', mode: 'Metro', duration: '25 min' },
                { instruction: 'Transfer to Metro Line 2', mode: 'Metro', duration: '5 min' },
                { instruction: 'Take Metro Line 2 to Giza', mode: 'Metro', duration: '20 min' },
                { instruction: 'Take Bus #381 to destination', mode: 'Bus', duration: '35 min' }
            ]
        }
    ];
    
    resultsDiv.innerHTML = '';
    
    mockResults.forEach((route, index) => {
        const routeDiv = document.createElement('div');
        routeDiv.className = 'route-card';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex items-center justify-between mb-4';
        headerDiv.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-900">${currentLanguage === 'ar' ? 'الطريق' : 'Route'} ${index + 1}</h3>
            <div class="flex items-center space-x-4 text-sm text-gray-600">
                <div class="flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>${route.duration}</span>
                </div>
                <div class="flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    <span>${route.cost}</span>
                </div>
                <div class="text-gray-500">${route.distance}</div>
            </div>
        `;
        
        const stepsDiv = document.createElement('div');
        stepsDiv.className = 'space-y-3';
        
        route.steps.forEach((step, stepIndex) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'flex items-start';
            stepDiv.innerHTML = `
                <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-4">
                    ${stepIndex + 1}
                </div>
                <div class="flex-1">
                    <p class="text-gray-900">${step.instruction}</p>
                    <div class="flex items-center mt-1">
                        <span class="px-2 py-1 rounded-full text-xs mr-2 ${getModeColor(step.mode)}">
                            ${step.mode}
                        </span>
                        <span class="text-gray-500 text-sm">${step.duration}</span>
                    </div>
                </div>
            `;
            stepsDiv.appendChild(stepDiv);
        });
        
        routeDiv.appendChild(headerDiv);
        routeDiv.appendChild(stepsDiv);
        resultsDiv.appendChild(routeDiv);
    });
}

function getModeColor_old(mode) {
    const modeColors = {
        'Metro': 'bg-blue-100 text-blue-800',
        'مترو': 'bg-blue-100 text-blue-800',
        'Bus': 'bg-green-100 text-green-800',
        'أتوبيس': 'bg-green-100 text-green-800',
        'Microbus': 'bg-purple-100 text-purple-800',
        'ميكروباص': 'bg-purple-100 text-purple-800',
        'Walk': 'bg-gray-100 text-gray-800',
        'مشي': 'bg-gray-100 text-gray-800'
    };
    return modeColors[mode] || 'bg-gray-100 text-gray-800';
}


    
    const stops = [
        {
            id: 'ramses',
            name: currentLanguage === 'ar' ? 'محطة رمسيس' : 'Ramses Station',
            nameSecondary: currentLanguage === 'ar' ? 'Ramses Station' : 'محطة رمسيس',
            description: currentLanguage === 'ar' 
                ? 'محور السكك الحديدية والمترو الرئيسي الذي يربط القاهرة ببقية مصر'
                : 'Major railway and metro hub connecting Cairo with rest of Egypt',
            connections: currentLanguage === 'ar' 
                ? ['مترو الخط 2', 'السكك الحديدية الوطنية', '50+ خط أتوبيس']
                : ['Metro Line 2', 'National Railway', '50+ Bus Lines'],
            imageUrl: 'https://images.pexels.com/photos/2935687/pexels-photo-2935687.jpeg',
            routes: 75,
            isMetroStation: true,
        },
        {
            id: 'tahrir',
            name: currentLanguage === 'ar' ? 'ميدان التحرير' : 'Tahrir Square',
            nameSecondary: currentLanguage === 'ar' ? 'Tahrir Square' : 'ميدان التحرير',
            description: currentLanguage === 'ar'
                ? 'الميدان التاريخي المركزي مع شبكات واسعة من الأتوبيسات والميكروباصات'
                : 'Historic central square with extensive bus and microbus networks',
            connections: currentLanguage === 'ar'
                ? ['مترو الخط 2', '30+ خط أتوبيس', '20+ خط ميكروباص']
                : ['Metro Line 2', '30+ Bus Lines', '20+ Microbus Lines'],
            imageUrl: 'https://images.pexels.com/photos/2363807/pexels-photo-2363807.jpeg',
            routes
