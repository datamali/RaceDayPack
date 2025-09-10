// APP.JS EXECUTION TEST
console.log('=== APP.JS IS EXECUTING ===');
console.log('Current time:', new Date().toISOString());

// Toast notification system
class ToastManager {
    constructor() {
        this.container = null;
    }

    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show(title, message, type = 'success', duration = 5000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.success}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    success(title, message, duration) {
        return this.show(title, message, 'success', duration);
    }

    error(title, message, duration) {
        return this.show(title, message, 'error', duration);
    }

    warning(title, message, duration) {
        return this.show(title, message, 'warning', duration);
    }

    info(title, message, duration) {
        return this.show(title, message, 'info', duration);
    }
}

// Global toast instance
const toast = new ToastManager();
window.toastManager = toast;

class RaceDayPack {
    constructor() {
        this.currentPage = 'landing-page';
        this.currentUser = null;
        this.isOfflineMode = false;
        this.userData = {
            name: '',
            experience: '',
            preferredRaceTypes: [],
            raceDetails: {},
            recommendations: {}
        };
        this.weatherData = null;
        this.currentPlanId = null;
        this.savedPlans = [];
        
        this.init();
    }

    init() {
        console.log('App initializing...');
        this.setupEventListeners();
        
        // Check if Firebase is available and configured
        console.log('dbService available:', typeof dbService !== 'undefined');
        console.log('Firebase configured:', this.isFirebaseConfigured());
        
        if (typeof dbService !== 'undefined' && this.isFirebaseConfigured()) {
            console.log('Starting with Firebase authentication');
            // Show auth page immediately if Firebase is configured
            this.showPage('auth-page');
            // Initialize Firebase authentication listener
            console.log('Setting up auth listener...');
            dbService.initAuth((user) => {
                console.log('Auth listener triggered with user:', user);
                this.handleAuthStateChange(user);
            });
        } else {
            // Firebase not configured, start in offline mode
            console.log('Starting in offline mode');
            this.isOfflineMode = true;
            this.loadUserData();
            this.showPage('landing-page');
        }
    }

    isFirebaseConfigured() {
        // Check if Firebase config has been updated from placeholder values
        try {
            return typeof firebase !== 'undefined' && 
                   firebase.apps.length > 0 &&
                   firebase.app().options.apiKey !== "your-api-key-here";
        } catch (error) {
            return false;
        }
    }

    checkInitialAuth() {
        // Show auth page if Firebase is configured and user is not authenticated
        if (this.isFirebaseConfigured() && !this.currentUser && !this.isOfflineMode) {
            this.showPage('auth-page');
        } else {
            this.loadUserData();
            this.showPage('landing-page');
        }
    }

    handleAuthStateChange(user) {
        console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
        console.log('Current page:', this.currentPage);
        this.currentUser = user;
        
        if (user) {
            // User is signed in
            console.log('User details:', { uid: user.uid, email: user.email, displayName: user.displayName });
            
            // Always show dashboard when user is signed in, regardless of current page
            console.log('User signed in, showing dashboard');
            console.log('About to call showPage dashboard-page');
            this.showPage('dashboard-page');
            console.log('showPage dashboard-page completed');
            
            // Update user profile
            try {
                const displayNameEl = document.getElementById('user-display-name');
                if (displayNameEl) {
                    displayNameEl.textContent = user.displayName || user.email || 'User';
                }
            } catch (error) {
                console.error('Error updating display name:', error);
            }
            
            // Load user data
            this.loadUserProfile();
            this.loadSavedPlans();
        } else {
            // User is signed out
            console.log('User signed out, clearing data');
            this.currentUser = null;
            this.userData = {
                name: '',
                experience: '',
                preferredRaceTypes: [],
                raceDetails: {},
                recommendations: {}
            };
            this.savedPlans = [];
            if (!this.isOfflineMode) {
                console.log('Redirecting to auth page');
                this.showPage('auth-page');
            }
        }
    }

    async loadUserProfile() {
        if (!this.currentUser || typeof dbService === 'undefined') return;

        try {
            const profile = await dbService.getUserProfile();
            if (profile) {
                this.userData.name = profile.displayName || this.currentUser.displayName;
                this.userData.experience = profile.experience || '';
                this.userData.preferredRaceTypes = profile.preferredRaceTypes || [];
                
                // Update UI
                const displayNameEl = document.getElementById('user-display-name');
                if (displayNameEl) {
                    displayNameEl.textContent = this.userData.name || 'User';
                }
            }
        } catch (error) {
            console.log('Error loading user profile:', error);
        }
    }

    async loadSavedPlans() {
        if (!this.currentUser || typeof dbService === 'undefined') return;

        try {
            this.savedPlans = await dbService.getRacePlans();
            this.renderSavedPlans();
        } catch (error) {
            console.log('Error loading saved plans:', error);
        }
    }

    renderSavedPlans() {
        const savedPlansContainer = document.getElementById('saved-plans');
        const emptyState = document.getElementById('empty-plans');
        
        if (!savedPlansContainer) return;

        if (!this.savedPlans || this.savedPlans.length === 0) {
            // Show empty state
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            savedPlansContainer.innerHTML = emptyState ? emptyState.outerHTML : `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>No race plans yet</h3>
                    <p>Create your first race plan to get personalized recommendations</p>
                    <button class="btn btn-primary" id="create-first-plan">Create Your First Plan</button>
                </div>
            `;
        } else {
            // Show saved plans
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            savedPlansContainer.innerHTML = this.savedPlans.map(plan => `
                <div class="plan-card" data-plan-id="${plan.id}">
                    <div class="plan-header">
                        <h3>${plan.raceDetails?.raceType || 'Race Plan'}</h3>
                        <span class="plan-date">${plan.raceDetails?.raceDate || ''}</span>
                    </div>
                    <div class="plan-details">
                        <p><strong>Location:</strong> ${plan.raceDetails?.location || 'Not specified'}</p>
                        <p><strong>Temperature:</strong> ${plan.raceDetails?.temperature || 'Not specified'}°F</p>
                    </div>
                    <div class="plan-actions">
                        <button class="btn btn-primary btn-sm" onclick="raceDayPack.viewPlan('${plan.id}')">View</button>
                        <button class="btn btn-secondary btn-sm" onclick="raceDayPack.deletePlan('${plan.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        }
        
        // Re-setup event listeners for new buttons
        this.setupDashboardEventListeners();
    }

    setupAuthEventListeners() {
        console.log('=== SETTING UP AUTH EVENT LISTENERS ===');
        console.log('Document ready state:', document.readyState);
        
        // Wait a bit and try multiple times if needed
        const trySetupListeners = (attempt = 1) => {
            console.log(`Setup attempt #${attempt}`);
            
            // Sign in form
            const signinForm = document.getElementById('signin');
            console.log('Signin form element:', signinForm);
            console.log('Signin form parent visible?', signinForm?.offsetParent !== null);
            
            if (signinForm) {
                console.log('Found signin form, adding listener');
                signinForm.addEventListener('submit', (e) => {
                    console.log('SIGNIN FORM SUBMIT EVENT TRIGGERED');
                    e.preventDefault();
                    this.handleSignIn();
                });
                
                // Also add click listener to submit button
                const submitBtn = signinForm.querySelector('button[type="submit"]');
                console.log('Submit button found:', !!submitBtn);
                if (submitBtn) {
                    submitBtn.addEventListener('click', (e) => {
                        console.log('Sign in submit button clicked');
                        // Don't prevent default here - let form submit
                    });
                }
            } else {
                console.log('Signin form not found');
                if (attempt < 3) {
                    setTimeout(() => trySetupListeners(attempt + 1), 500);
                    return;
                }
            }
        };
        
        trySetupListeners();

        // Sign up form
        const signupForm = document.getElementById('signup');
        console.log('Signup form element:', signupForm);
        if (signupForm) {
            console.log('Found signup form, adding listener');
            signupForm.addEventListener('submit', (e) => {
                console.log('SIGNUP FORM SUBMIT EVENT TRIGGERED');
                e.preventDefault();
                this.handleSignUp();
            });
            
            // Also add click listener to submit button
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => {
                    console.log('Sign up submit button clicked');
                });
            }
        } else {
            console.log('Signup form not found');
        }

        // Google sign in
        const googleSigninBtn = document.getElementById('google-signin');
        if (googleSigninBtn) {
            googleSigninBtn.addEventListener('click', () => {
                this.handleGoogleSignIn();
            });
        }

        // Google sign up (same as sign in)
        const googleSignupBtn = document.getElementById('google-signup');
        if (googleSignupBtn) {
            googleSignupBtn.addEventListener('click', () => {
                this.handleGoogleSignIn();
            });
        }

        // Switch to sign up form
        const showSignupLink = document.getElementById('show-signup');
        if (showSignupLink) {
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthForm('signup');
            });
        }

        // Switch to sign in form
        const showSigninLink = document.getElementById('show-signin');
        if (showSigninLink) {
            showSigninLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthForm('signin');
            });
        }
    }

    setupDashboardEventListeners() {
        // Sign out button
        const signoutBtn = document.getElementById('signout-btn');
        if (signoutBtn) {
            signoutBtn.addEventListener('click', async () => {
                try {
                    if (typeof dbService !== 'undefined') {
                        await dbService.signOut();
                        toast.success('Signed Out', 'You have been signed out successfully');
                    }
                } catch (error) {
                    console.error('Sign out error:', error);
                    toast.error('Sign Out Error', 'Failed to sign out');
                }
            });
        }

        // New race plan button
        const newRacePlanBtn = document.getElementById('new-race-plan');
        if (newRacePlanBtn) {
            newRacePlanBtn.addEventListener('click', () => {
                this.showPage('onboarding-page');
            });
        }

        // Create first plan button
        const createFirstPlanBtn = document.getElementById('create-first-plan');
        if (createFirstPlanBtn) {
            createFirstPlanBtn.addEventListener('click', () => {
                this.showPage('onboarding-page');
            });
        }

        // Account settings button
        const accountSettingsBtn = document.getElementById('account-settings');
        if (accountSettingsBtn) {
            accountSettingsBtn.addEventListener('click', () => {
                // Switch to profile tab in dashboard
                this.switchTab('profile');
            });
        }
    }

    setupEventListeners() {
        // Authentication event listeners
        this.setupAuthEventListeners();
        
        // Landing page
        document.getElementById('quick-start').addEventListener('click', () => {
            this.showPage('race-setup-page');
        });
        
        document.getElementById('detailed-setup').addEventListener('click', () => {
            this.showPage('onboarding-page');
        });

        // Onboarding
        document.getElementById('onboarding-next').addEventListener('click', () => {
            this.handleOnboardingNext();
        });
        
        document.getElementById('onboarding-back').addEventListener('click', () => {
            this.handleOnboardingBack();
        });

        // Race setup
        document.getElementById('setup-back').addEventListener('click', () => {
            this.showPage('onboarding-page');
        });
        
        document.getElementById('generate-recommendations').addEventListener('click', () => {
            this.generateRecommendations();
        });

        // Recommendations
        document.getElementById('recommendations-back').addEventListener('click', () => {
            this.showPage('race-setup-page');
        });
        
        document.getElementById('save-plan').addEventListener('click', () => {
            this.savePlan();
        });
        
        document.getElementById('share-plan').addEventListener('click', () => {
            this.sharePlan();
        });

        // Race details form changes
        document.getElementById('race-location').addEventListener('blur', () => {
            this.fetchWeatherData();
        });
        
        document.getElementById('race-date').addEventListener('change', () => {
            this.fetchWeatherData();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Dashboard event listeners
        this.setupDashboardEventListeners();
    }

    showPage(pageId) {
        console.log('Attempting to show page:', pageId);
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            console.log('Successfully showed page:', pageId);
        } else {
            console.error('Page not found:', pageId);
        }
    }

    handleOnboardingNext() {
        // Collect form data
        const name = document.getElementById('user-name').value;
        const experience = document.querySelector('input[name="experience"]:checked')?.value;
        const preferredRaceTypes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(input => input.value);

        // Validate
        if (!name || !experience || preferredRaceTypes.length === 0) {
            alert('Please fill in all fields');
            return;
        }

        // Save data
        this.userData.name = name;
        this.userData.experience = experience;
        this.userData.preferredRaceTypes = preferredRaceTypes;
        
        this.saveUserData();
        this.showPage('race-setup-page');
    }

    handleOnboardingBack() {
        this.showPage('landing-page');
    }

    async fetchWeatherData() {
        const location = document.getElementById('race-location').value;
        const date = document.getElementById('race-date').value;
        
        if (!location || !date) return;

        // For demo purposes, we'll simulate weather data
        // In a real app, you'd use a weather API like OpenWeatherMap
        const weatherInfo = document.getElementById('weather-forecast');
        weatherInfo.innerHTML = `
            <div class="weather-data">
                <h4>Forecast for ${location}</h4>
                <div class="weather-details">
                    <span class="temp">65°F</span>
                    <span class="condition">Partly Cloudy</span>
                    <span class="humidity">Humidity: 45%</span>
                    <span class="wind">Wind: 8 mph</span>
                </div>
                <p class="weather-note">Perfect conditions for racing! 🌤️</p>
            </div>
        `;

        this.weatherData = {
            temperature: 65,
            condition: 'partly-cloudy',
            humidity: 45,
            wind: 8
        };
    }

    generateRecommendations() {
        // Collect race details
        const raceType = document.getElementById('race-type').value;
        const raceDate = document.getElementById('race-date').value;
        const raceTime = document.getElementById('race-time').value;
        const location = document.getElementById('race-location').value;
        const terrain = document.getElementById('terrain').value;
        const temperature = document.getElementById('temperature').value || this.weatherData?.temperature || 65;
        const conditions = document.getElementById('conditions').value || this.weatherData?.condition || 'sunny';

        if (!raceType || !raceDate) {
            alert('Please fill in race type and date');
            return;
        }

        // Save race details
        this.userData.raceDetails = {
            raceType,
            raceDate,
            raceTime,
            location,
            terrain,
            temperature: parseInt(temperature),
            conditions
        };

        // Generate recommendations based on data
        this.userData.recommendations = this.calculateRecommendations();
        
        this.saveUserData();
        this.populateRecommendations();
        this.showPage('recommendations-page');
    }

    calculateRecommendations() {
        const { raceType, temperature, conditions, terrain } = this.userData.raceDetails;
        const experience = this.userData.experience;
        
        const recommendations = {
            clothing: this.getClothingRecommendations(raceType, temperature, conditions),
            packing: this.getPackingRecommendations(raceType, experience),
            timeline: this.getTimelineRecommendations(raceType)
        };

        return recommendations;
    }

    getClothingRecommendations(raceType, temperature, conditions) {
        const clothing = {
            essential: [],
            weatherSpecific: [],
            accessories: []
        };

        // Base recommendations by race type
        if (raceType.includes('run') || raceType.includes('marathon')) {
            clothing.essential = [
                { name: 'Running shoes', priority: 'must-have', note: 'Well-broken-in pair' },
                { name: 'Running socks', priority: 'must-have', note: 'Moisture-wicking, no cotton' },
                { name: 'Running shorts/tights', priority: 'must-have', note: 'Comfortable, chafe-free fit' }
            ];

            if (temperature < 50) {
                clothing.essential.push({ name: 'Long-sleeve tech shirt', priority: 'must-have', note: 'Moisture-wicking material' });
            } else {
                clothing.essential.push({ name: 'Tech t-shirt', priority: 'must-have', note: 'Breathable, moisture-wicking' });
            }
        }

        if (raceType.includes('cycling')) {
            clothing.essential = [
                { name: 'Cycling shoes', priority: 'must-have', note: 'Compatible with your pedals' },
                { name: 'Cycling shorts/bibs', priority: 'must-have', note: 'Padded chamois for comfort' },
                { name: 'Cycling jersey', priority: 'must-have', note: 'Fitted, with rear pockets' },
                { name: 'Helmet', priority: 'must-have', note: 'Properly fitted and certified' }
            ];
        }

        if (raceType.includes('triathlon')) {
            clothing.essential = [
                { name: 'Tri-suit', priority: 'must-have', note: 'One piece for all disciplines' },
                { name: 'Running shoes', priority: 'must-have', note: 'Easy to slip on' },
                { name: 'Cycling shoes', priority: 'must-have', note: 'Quick transitions' },
                { name: 'Helmet', priority: 'must-have', note: 'Aero design preferred' }
            ];
        }

        // Weather-specific items
        if (temperature < 40) {
            clothing.weatherSpecific.push(
                { name: 'Thermal base layer', priority: 'recommended', note: 'Merino wool or synthetic' },
                { name: 'Windproof jacket', priority: 'recommended', note: 'Packable and breathable' },
                { name: 'Warm gloves', priority: 'recommended', note: 'Touchscreen compatible' }
            );
        } else if (temperature < 60) {
            clothing.weatherSpecific.push(
                { name: 'Light jacket/vest', priority: 'optional', note: 'Can discard during race' },
                { name: 'Arm warmers', priority: 'optional', note: 'Easy to remove and store' }
            );
        }

        if (conditions.includes('rain')) {
            clothing.weatherSpecific.push(
                { name: 'Rain jacket', priority: 'recommended', note: 'Lightweight and breathable' },
                { name: 'Waterproof shoe covers', priority: 'optional', note: 'For cycling events' }
            );
        }

        if (temperature > 75) {
            clothing.weatherSpecific.push(
                { name: 'Cooling towel', priority: 'recommended', note: 'Pre-soak for race start' },
                { name: 'Light-colored clothing', priority: 'recommended', note: 'Reflects heat better' }
            );
        }

        // Accessories
        clothing.accessories = [
            { name: 'GPS watch', priority: 'recommended', note: 'For pacing and navigation' },
            { name: 'Sunglasses', priority: 'recommended', note: 'UV protection and wind shield' },
            { name: 'Race belt', priority: 'optional', note: 'For bib number attachment' },
            { name: 'Hat/visor', priority: 'optional', note: 'Sun protection and sweat management' }
        ];

        return clothing;
    }

    getPackingRecommendations(raceType, experience) {
        const packing = {
            preRace: [
                { name: 'Race bib and timing chip', priority: 'must-have', checked: false },
                { name: 'Photo ID', priority: 'must-have', checked: false },
                { name: 'Pre-race snack', priority: 'recommended', checked: false },
                { name: 'Water bottle', priority: 'recommended', checked: false },
                { name: 'Warm-up clothing', priority: 'recommended', checked: false }
            ],
            duringRace: [
                { name: 'Energy gels/snacks', priority: 'recommended', checked: false },
                { name: 'Emergency contact info', priority: 'must-have', checked: false },
                { name: 'Small cash/card', priority: 'recommended', checked: false }
            ],
            postRace: [
                { name: 'Change of clothes', priority: 'must-have', checked: false },
                { name: 'Recovery drink', priority: 'recommended', checked: false },
                { name: 'Towel', priority: 'recommended', checked: false },
                { name: 'Flip-flops/slides', priority: 'optional', checked: false },
                { name: 'Plastic bag for wet clothes', priority: 'recommended', checked: false }
            ]
        };

        // Add experience-specific items
        if (experience === 'beginner') {
            packing.preRace.push(
                { name: 'Course map', priority: 'recommended', checked: false },
                { name: 'Emergency contact card', priority: 'must-have', checked: false }
            );
        }

        // Add race-type specific items
        if (raceType.includes('triathlon')) {
            packing.duringRace.push(
                { name: 'Transition bag', priority: 'must-have', checked: false },
                { name: 'Goggles', priority: 'must-have', checked: false },
                { name: 'Swim cap', priority: 'must-have', checked: false }
            );
        }

        if (raceType.includes('cycling')) {
            packing.preRace.push(
                { name: 'Bike tools/repair kit', priority: 'must-have', checked: false },
                { name: 'Spare tubes', priority: 'must-have', checked: false },
                { name: 'Bike pump', priority: 'must-have', checked: false }
            );
        }

        return packing;
    }

    getTimelineRecommendations(raceType) {
        return {
            weekBefore: [
                'Check weather forecast and adjust gear accordingly',
                'Test all race day equipment during training',
                'Plan transportation and parking',
                'Confirm race registration and packet pickup'
            ],
            nightBefore: [
                'Pack race day bag completely',
                'Lay out race day outfit',
                'Check final weather forecast',
                'Prepare race day breakfast',
                'Get adequate sleep (7-9 hours)'
            ],
            raceDay: [
                'Eat familiar breakfast 2-3 hours before race',
                'Arrive at venue 60-90 minutes early',
                'Complete final gear check',
                'Warm up appropriately for race distance',
                'Stay hydrated but avoid overdrinking'
            ]
        };
    }

    populateRecommendations() {
        const { raceType, raceDate, location, temperature, conditions } = this.userData.raceDetails;
        
        // Update race summary
        document.getElementById('summary-race-type').textContent = this.formatRaceType(raceType);
        document.getElementById('summary-date').textContent = new Date(raceDate).toLocaleDateString();
        document.getElementById('summary-weather').textContent = `${temperature}°F, ${this.formatCondition(conditions)}`;

        // Populate clothing recommendations
        this.populateClothingTab();
        
        // Populate packing lists
        this.populatePackingTab();
        
        // Populate timeline
        this.populateTimelineTab();
    }

    populateClothingTab() {
        const clothing = this.userData.recommendations.clothing;
        
        // Essential clothing
        const essentialContainer = document.getElementById('essential-clothing');
        essentialContainer.innerHTML = '';
        clothing.essential.forEach(item => {
            essentialContainer.appendChild(this.createClothingItem(item));
        });

        // Weather-specific clothing
        const weatherContainer = document.getElementById('weather-clothing');
        weatherContainer.innerHTML = '';
        clothing.weatherSpecific.forEach(item => {
            weatherContainer.appendChild(this.createClothingItem(item));
        });

        // Accessories
        const accessoriesContainer = document.getElementById('accessories');
        accessoriesContainer.innerHTML = '';
        clothing.accessories.forEach(item => {
            accessoriesContainer.appendChild(this.createClothingItem(item));
        });
    }

    createClothingItem(item) {
        const div = document.createElement('div');
        div.className = `clothing-item ${item.priority}`;
        div.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-note">${item.note}</span>
            </div>
            <span class="priority-badge ${item.priority}">${item.priority}</span>
        `;
        return div;
    }

    populatePackingTab() {
        const packing = this.userData.recommendations.packing;
        
        // Pre-race items
        const preRaceContainer = document.getElementById('pre-race-items');
        preRaceContainer.innerHTML = '';
        packing.preRace.forEach((item, index) => {
            preRaceContainer.appendChild(this.createPackingItem(item, 'pre-race', index));
        });

        // During race items
        const duringRaceContainer = document.getElementById('during-race-items');
        duringRaceContainer.innerHTML = '';
        packing.duringRace.forEach((item, index) => {
            duringRaceContainer.appendChild(this.createPackingItem(item, 'during-race', index));
        });

        // Post-race items
        const postRaceContainer = document.getElementById('post-race-items');
        postRaceContainer.innerHTML = '';
        packing.postRace.forEach((item, index) => {
            postRaceContainer.appendChild(this.createPackingItem(item, 'post-race', index));
        });
    }

    createPackingItem(item, category, index) {
        const div = document.createElement('div');
        div.className = `packing-item ${item.priority}`;
        if (item.checked) div.classList.add('checked');
        
        div.innerHTML = `
            <input type="checkbox" ${item.checked ? 'checked' : ''} 
                   onchange="raceDayPack.togglePackingItem('${category}', ${index})">
            <span class="item-name">${item.name}</span>
            <span class="priority-badge ${item.priority}">${item.priority}</span>
        `;
        return div;
    }

    togglePackingItem(category, index) {
        const categoryMap = {
            'pre-race': 'preRace',
            'during-race': 'duringRace',
            'post-race': 'postRace'
        };
        
        const items = this.userData.recommendations.packing[categoryMap[category]];
        items[index].checked = !items[index].checked;
        this.saveUserData();
    }

    populateTimelineTab() {
        const timeline = this.userData.recommendations.timeline;
        
        // Week before tasks
        const weekBeforeContainer = document.getElementById('week-before-tasks');
        weekBeforeContainer.innerHTML = '';
        timeline.weekBefore.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task;
            weekBeforeContainer.appendChild(li);
        });

        // Night before tasks
        const nightBeforeContainer = document.getElementById('night-before-tasks');
        nightBeforeContainer.innerHTML = '';
        timeline.nightBefore.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task;
            nightBeforeContainer.appendChild(li);
        });

        // Race morning tasks
        const raceMorningContainer = document.getElementById('race-morning-tasks');
        raceMorningContainer.innerHTML = '';
        timeline.raceDay.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task;
            raceMorningContainer.appendChild(li);
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    savePlan() {
        this.saveUserData();
        alert('Your race day plan has been saved!');
    }

    sharePlan() {
        const { raceType, raceDate, location } = this.userData.raceDetails;
        const shareText = `Check out my race day plan for ${this.formatRaceType(raceType)} on ${new Date(raceDate).toLocaleDateString()} in ${location}! 🏃‍♂️`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Race Day Plan - RaceDayPack',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText + ' - ' + window.location.href)
                .then(() => alert('Plan link copied to clipboard!'))
                .catch(() => alert('Unable to share. Please copy the URL manually.'));
        }
    }

    formatRaceType(raceType) {
        const formats = {
            '5k': '5K Run',
            '10k': '10K Run',
            'half-marathon': 'Half Marathon',
            'marathon': 'Marathon',
            'cycling-road': 'Road Cycling',
            'cycling-mountain': 'Mountain Biking',
            'triathlon-sprint': 'Sprint Triathlon',
            'triathlon-olympic': 'Olympic Triathlon',
            'triathlon-ironman': 'Ironman Triathlon'
        };
        return formats[raceType] || raceType;
    }

    formatCondition(condition) {
        const formats = {
            'sunny': 'Sunny',
            'partly-cloudy': 'Partly Cloudy',
            'cloudy': 'Cloudy',
            'light-rain': 'Light Rain',
            'rain': 'Rain',
            'windy': 'Windy'
        };
        return formats[condition] || condition;
    }

    saveUserData() {
        localStorage.setItem('raceDayPackData', JSON.stringify(this.userData));
    }

    loadUserData() {
        const saved = localStorage.getItem('raceDayPackData');
        if (saved) {
            this.userData = { ...this.userData, ...JSON.parse(saved) };
        }
    }

    // Test method for debugging
    testDashboard() {
        console.log('Testing dashboard redirect...');
        this.currentUser = { uid: 'test', email: 'test@test.com', displayName: 'Test User' };
        this.showPage('dashboard-page');
        this.loadUserProfile();
        console.log('Dashboard test complete');
    }

    // Dashboard methods
    async viewPlan(planId) {
        console.log('Viewing plan:', planId);
        this.currentPlanId = planId;
        // Load the plan and show recommendations page
        const plan = this.savedPlans.find(p => p.id === planId);
        if (plan) {
            this.userData = { ...this.userData, ...plan };
            this.showPage('recommendations-page');
        }
    }

    async deletePlan(planId) {
        if (!confirm('Are you sure you want to delete this race plan?')) return;
        
        try {
            if (typeof dbService !== 'undefined') {
                await dbService.deleteRacePlan(planId);
                toast.success('Plan Deleted', 'Race plan has been deleted successfully');
                // Reload saved plans
                await this.loadSavedPlans();
            }
        } catch (error) {
            console.error('Error deleting plan:', error);
            toast.error('Delete Failed', 'Failed to delete the race plan');
        }
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Add active class to selected tab and pane
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabPane = document.getElementById(`${tabName}-tab`);
        
        if (tabBtn) tabBtn.classList.add('active');
        if (tabPane) tabPane.classList.add('active');
    }

    // Authentication methods
    async handleSignIn() {
        console.log('=== HandleSignIn called ===');
        if (typeof dbService === 'undefined') {
            toast.error('Service Error', 'Authentication service not available');
            return;
        }

        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        console.log('Sign in attempt:', { email, password: '***' });

        if (!email || !password) {
            toast.warning('Missing Information', 'Please enter both email and password');
            return;
        }

        try {
            console.log('Calling dbService.signIn...');
            const result = await dbService.signIn(email, password);
            console.log('SignIn result:', result);
            toast.success('Welcome Back!', 'Successfully signed in to your account');
            
            // Manual check for auth state change in case it's not automatic
            setTimeout(() => {
                console.log('Checking current user after signin:', this.currentUser);
                if (this.currentUser) {
                    console.log('User is signed in, manually redirecting to dashboard');
                    this.showPage('dashboard-page');
                }
            }, 1000);
        } catch (error) {
            console.error('Sign in error:', error);
            let errorMessage = 'Sign in failed';
            
            // Handle specific Firebase error codes
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error('Sign In Failed', errorMessage);
        }
    }

    async handleSignUp() {
        console.log('=== HandleSignUp called ===');
        if (typeof dbService === 'undefined') {
            toast.error('Service Error', 'Authentication service not available');
            return;
        }

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;

        console.log('Signup data:', { name, email, password: '***' });

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            toast.warning('Missing Information', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.warning('Password Mismatch', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.warning('Weak Password', 'Password must be at least 6 characters');
            return;
        }

        try {
            await dbService.signUp(email, password, name);
            toast.success('Account Created!', 'Welcome to RaceDayPack! Your account has been created successfully.');
            // handleAuthStateChange will be called automatically
        } catch (error) {
            console.error('Sign up error:', error);
            let errorMessage = 'Account creation failed';
            
            // Handle specific Firebase error codes
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error('Sign Up Failed', errorMessage);
        }
    }

    async handleGoogleSignIn() {
        if (typeof dbService === 'undefined') {
            toast.error('Service Error', 'Authentication service not available');
            return;
        }

        try {
            await dbService.signInWithGoogle();
            toast.success('Welcome!', 'Successfully signed in with Google');
            // handleAuthStateChange will be called automatically
        } catch (error) {
            console.error('Google sign in error:', error);
            let errorMessage = 'Google sign in failed';
            
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign in was cancelled';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Pop-up was blocked by browser';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error('Google Sign In Failed', errorMessage);
        }
    }

    switchAuthForm(formType) {
        console.log('Switching auth form to:', formType);
        console.log('Switching to: ' + formType);
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');

        console.log('Signin form found:', !!signinForm);
        console.log('Signup form found:', !!signupForm);

        if (formType === 'signup') {
            signinForm.classList.remove('active');
            signupForm.classList.add('active');
            console.log('Switched to signup form');
        } else {
            signupForm.classList.remove('active');
            signinForm.classList.add('active');
            console.log('Switched to signin form');
        }
    }
}

// Debug Firebase availability
window.addEventListener('load', function() {
    console.log('=== FIREBASE DEBUG ===');
    console.log('Firebase available:', typeof firebase !== 'undefined');
    console.log('Firebase auth:', typeof firebase?.auth !== 'undefined');
    console.log('Firebase firestore:', typeof firebase?.firestore !== 'undefined');
    console.log('dbService available:', typeof dbService !== 'undefined');
    console.log('=== END FIREBASE DEBUG ===');
});

// Initialize the app after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app');
    console.log('Available elements:', {
        signinForm: document.getElementById('signin'),
        signupForm: document.getElementById('signup'),
        authPage: document.getElementById('auth-page')
    });
    
    // Check if Firebase is ready
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded!');
        alert('Firebase not loaded! Check the script tags.');
        return;
    }
    
    if (typeof dbService === 'undefined') {
        console.error('dbService not available!');
        alert('dbService not available! Check firebase-config.js');
        return;
    }
    
    try {
        window.raceDayPack = new RaceDayPack();
        console.log('RaceDayPack created successfully');
        
        // Test if we can manually trigger form detection
        setTimeout(() => {
            console.log('Delayed form check:', {
                signinForm: document.getElementById('signin'),
                signupForm: document.getElementById('signup'),
                isAuthPageVisible: document.getElementById('auth-page').style.display !== 'none'
            });
        }, 1000);
        
    } catch (error) {
        console.error('Error creating RaceDayPack:', error);
        alert('Error creating RaceDayPack: ' + error.message);
        if (window.toastManager) {
            window.toastManager.show('Initialization Error', 'Failed to initialize the app. Please refresh the page.', 'error');
        }
    }
});