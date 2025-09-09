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
        // Initialize Firebase authentication listener
        if (typeof dbService !== 'undefined') {
            dbService.initAuth((user) => {
                this.handleAuthStateChange(user);
            });
        }
        
        this.setupEventListeners();
        this.checkInitialAuth();
    }

    checkInitialAuth() {
        // Show auth page if user is not authenticated and not in offline mode
        if (!this.currentUser && !this.isOfflineMode) {
            this.showPage('auth-page');
        } else {
            this.loadUserData();
            this.showPage('landing-page');
        }
    }

    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            // User is signed in
            this.loadUserProfile();
            if (this.currentPage === 'auth-page') {
                this.showPage('dashboard-page');
            }
            this.loadSavedPlans();
        } else {
            // User is signed out
            this.currentUser = null;
            this.userData = {
                name: '',
                experience: '',
                preferredRaceTypes: [],
                raceDetails: {},
                recommendations: {}
            };
            this.savedPlans = [];
            if (!this.isOfflineMode && this.currentPage !== 'auth-page') {
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

    setupEventListeners() {
        // Authentication event listeners
        this.setupAuthEventListeners();
        
        // Dashboard event listeners
        this.setupDashboardEventListeners();
        
        // Original app event listeners
        this.setupOriginalEventListeners();
    }

    setupAuthEventListeners() {
        // Show/hide auth forms
        const showSignup = document.getElementById('show-signup');
        const showSignin = document.getElementById('show-signin');
        
        if (showSignup) {
            showSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthForm('signup');
            });
        }
        
        if (showSignin) {
            showSignin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthForm('signin');
            });
        }

        // Sign in form
        const signinForm = document.getElementById('signin');
        if (signinForm) {
            signinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignIn();
            });
        }

        // Sign up form
        const signupForm = document.getElementById('signup');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignUp();
            });
        }

        // Google sign in/up
        const googleSignin = document.getElementById('google-signin');
        const googleSignup = document.getElementById('google-signup');
        
        if (googleSignin) {
            googleSignin.addEventListener('click', () => this.handleGoogleAuth());
        }
        
        if (googleSignup) {
            googleSignup.addEventListener('click', () => this.handleGoogleAuth());
        }

        // Continue offline
        const continueOffline = document.getElementById('continue-offline');
        if (continueOffline) {
            continueOffline.addEventListener('click', () => {
                this.isOfflineMode = true;
                this.showPage('landing-page');
            });
        }

        // Sign out
        const signoutBtn = document.getElementById('signout-btn');
        if (signoutBtn) {
            signoutBtn.addEventListener('click', () => this.handleSignOut());
        }
    }

    setupDashboardEventListeners() {
        // Dashboard navigation
        const newRacePlan = document.getElementById('new-race-plan');
        const createFirstPlan = document.getElementById('create-first-plan');
        
        if (newRacePlan) {
            newRacePlan.addEventListener('click', () => {
                this.currentPlanId = null;
                this.showPage('onboarding-page');
            });
        }
        
        if (createFirstPlan) {
            createFirstPlan.addEventListener('click', () => {
                this.currentPlanId = null;
                this.showPage('onboarding-page');
            });
        }

        // Dashboard tabs
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchDashboardTab(tabName);
            });
        });

        // Profile forms
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }

        const preferencesForm = document.getElementById('preferences-form');
        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePreferences();
            });
        }
    }

    setupOriginalEventListeners() {
        // Landing page
        const quickStart = document.getElementById('quick-start');
        const detailedSetup = document.getElementById('detailed-setup');
        
        if (quickStart) {
            quickStart.addEventListener('click', () => {
                if (this.currentUser || this.isOfflineMode) {
                    this.showPage('race-setup-page');
                } else {
                    this.showPage('auth-page');
                }
            });
        }
        
        if (detailedSetup) {
            detailedSetup.addEventListener('click', () => {
                if (this.currentUser || this.isOfflineMode) {
                    this.showPage('onboarding-page');
                } else {
                    this.showPage('auth-page');
                }
            });
        }

        // Onboarding
        const onboardingNext = document.getElementById('onboarding-next');
        const onboardingBack = document.getElementById('onboarding-back');
        
        if (onboardingNext) {
            onboardingNext.addEventListener('click', () => {
                this.handleOnboardingNext();
            });
        }
        
        if (onboardingBack) {
            onboardingBack.addEventListener('click', () => {
                if (this.currentUser && !this.isOfflineMode) {
                    this.showPage('dashboard-page');
                } else {
                    this.showPage('landing-page');
                }
            });
        }

        // Race setup
        const setupBack = document.getElementById('setup-back');
        const generateRecommendations = document.getElementById('generate-recommendations');
        
        if (setupBack) {
            setupBack.addEventListener('click', () => {
                if (this.currentUser && !this.isOfflineMode) {
                    this.showPage('dashboard-page');
                } else {
                    this.showPage('onboarding-page');
                }
            });
        }
        
        if (generateRecommendations) {
            generateRecommendations.addEventListener('click', () => {
                this.generateRecommendations();
            });
        }

        // Recommendations
        const recommendationsBack = document.getElementById('recommendations-back');
        const savePlan = document.getElementById('save-plan');
        const sharePlan = document.getElementById('share-plan');
        
        if (recommendationsBack) {
            recommendationsBack.addEventListener('click', () => {
                this.showPage('race-setup-page');
            });
        }
        
        if (savePlan) {
            savePlan.addEventListener('click', () => {
                this.savePlan();
            });
        }
        
        if (sharePlan) {
            sharePlan.addEventListener('click', () => {
                this.sharePlan();
            });
        }

        // Race details form changes
        const raceLocation = document.getElementById('race-location');
        const raceDate = document.getElementById('race-date');
        
        if (raceLocation) {
            raceLocation.addEventListener('blur', () => {
                this.fetchWeatherData();
            });
        }
        
        if (raceDate) {
            raceDate.addEventListener('change', () => {
                this.fetchWeatherData();
            });
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
    }

    // Authentication Methods
    switchAuthForm(formType) {
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        
        if (formType === 'signup') {
            signinForm.classList.remove('active');
            signupForm.classList.add('active');
        } else {
            signupForm.classList.remove('active');
            signinForm.classList.add('active');
        }
    }

    async handleSignIn() {
        if (typeof dbService === 'undefined') {
            this.showError('Authentication service not available');
            return;
        }

        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            await dbService.signIn(email, password);
            // Auth state change will handle the UI update
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleSignUp() {
        if (typeof dbService === 'undefined') {
            this.showError('Authentication service not available');
            return;
        }

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;

        if (!name || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        try {
            await dbService.signUp(email, password, name);
            // Auth state change will handle the UI update
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleGoogleAuth() {
        if (typeof dbService === 'undefined') {
            this.showError('Authentication service not available');
            return;
        }

        try {
            await dbService.signInWithGoogle();
            // Auth state change will handle the UI update
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleSignOut() {
        if (typeof dbService === 'undefined') return;

        try {
            await dbService.signOut();
            this.isOfflineMode = false;
            // Auth state change will handle the UI update
        } catch (error) {
            this.showError(error.message);
        }
    }

    showError(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f56565;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // Dashboard Methods
    switchDashboardTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load tab-specific data
        if (tabName === 'public-plans') {
            this.loadPublicPlans();
        } else if (tabName === 'profile') {
            this.populateProfileForm();
        }
    }

    renderSavedPlans() {
        const plansGrid = document.getElementById('saved-plans');
        const emptyState = document.getElementById('empty-plans');
        
        if (!plansGrid) return;

        if (this.savedPlans.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        const plansHTML = this.savedPlans.map(plan => this.createPlanCard(plan)).join('');
        plansGrid.innerHTML = plansHTML;

        // Add event listeners to plan cards
        this.setupPlanCardEventListeners();
    }

    createPlanCard(plan) {
        const raceDate = new Date(plan.raceDetails?.raceDate || Date.now());
        const today = new Date();
        const isPast = raceDate < today;
        const isToday = raceDate.toDateString() === today.toDateString();
        
        let statusClass = 'upcoming';
        let statusText = 'Upcoming';
        
        if (isPast) {
            statusClass = 'past';
            statusText = 'Past';
        } else if (isToday) {
            statusClass = 'today';
            statusText = 'Today!';
        }

        return `
            <div class="plan-card" data-plan-id="${plan.id}">
                <div class="plan-card-header">
                    <div>
                        <div class="plan-title">${this.formatRaceType(plan.raceDetails?.raceType || 'Race Plan')}</div>
                        <div class="plan-meta">${raceDate.toLocaleDateString()}</div>
                    </div>
                    <div class="plan-actions">
                        <button class="plan-action-btn" data-action="edit" title="Edit">✏️</button>
                        <button class="plan-action-btn" data-action="duplicate" title="Duplicate">📋</button>
                        <button class="plan-action-btn" data-action="share" title="Share">📤</button>
                        <button class="plan-action-btn" data-action="delete" title="Delete">🗑️</button>
                    </div>
                </div>
                
                <div class="plan-details">
                    <div class="plan-detail">
                        <span class="plan-detail-label">Location:</span>
                        <span class="plan-detail-value">${plan.raceDetails?.location || 'Not specified'}</span>
                    </div>
                    <div class="plan-detail">
                        <span class="plan-detail-label">Weather:</span>
                        <span class="plan-detail-value">${plan.raceDetails?.temperature || 'N/A'}°F, ${this.formatCondition(plan.raceDetails?.conditions || 'sunny')}</span>
                    </div>
                </div>
                
                <div class="plan-status ${statusClass}">${statusText}</div>
            </div>
        `;
    }

    setupPlanCardEventListeners() {
        document.querySelectorAll('.plan-card').forEach(card => {
            const planId = card.dataset.planId;
            
            // Click to open plan
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('plan-action-btn')) {
                    this.openPlan(planId);
                }
            });

            // Action buttons
            card.querySelectorAll('.plan-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = e.target.dataset.action;
                    this.handlePlanAction(planId, action);
                });
            });
        });
    }

    async openPlan(planId) {
        try {
            const plan = await dbService.getRacePlan(planId);
            if (plan) {
                this.currentPlanId = planId;
                this.userData = {
                    ...this.userData,
                    raceDetails: plan.raceDetails,
                    recommendations: plan.recommendations
                };
                this.populateRecommendations();
                this.showPage('recommendations-page');
            }
        } catch (error) {
            this.showError('Error loading plan: ' + error.message);
        }
    }

    async handlePlanAction(planId, action) {
        switch (action) {
            case 'edit':
                this.openPlan(planId);
                break;
                
            case 'duplicate':
                try {
                    const plan = await dbService.getRacePlan(planId);
                    if (plan) {
                        delete plan.id;
                        plan.raceDetails.raceDate = '';
                        this.userData.raceDetails = plan.raceDetails;
                        this.showPage('race-setup-page');
                    }
                } catch (error) {
                    this.showError('Error duplicating plan: ' + error.message);
                }
                break;
                
            case 'share':
                try {
                    await dbService.shareRacePlan(planId, true);
                    this.showSuccess('Plan shared with community!');
                } catch (error) {
                    this.showError('Error sharing plan: ' + error.message);
                }
                break;
                
            case 'delete':
                if (confirm('Are you sure you want to delete this race plan?')) {
                    try {
                        await dbService.deleteRacePlan(planId);
                        this.loadSavedPlans();
                        this.showSuccess('Plan deleted successfully');
                    } catch (error) {
                        this.showError('Error deleting plan: ' + error.message);
                    }
                }
                break;
        }
    }

    async loadPublicPlans() {
        if (typeof dbService === 'undefined') return;

        try {
            const publicPlans = await dbService.getPublicRacePlans(12);
            const communityGrid = document.getElementById('community-plans');
            
            if (communityGrid) {
                if (publicPlans.length === 0) {
                    communityGrid.innerHTML = '<div class="empty-state"><h3>No public plans yet</h3><p>Be the first to share your race plan with the community!</p></div>';
                } else {
                    communityGrid.innerHTML = publicPlans.map(plan => this.createPublicPlanCard(plan)).join('');
                }
            }
        } catch (error) {
            console.log('Error loading public plans:', error);
        }
    }

    createPublicPlanCard(plan) {
        const raceDate = new Date(plan.raceDetails?.raceDate || Date.now());
        
        return `
            <div class="plan-card">
                <div class="plan-card-header">
                    <div>
                        <div class="plan-title">${this.formatRaceType(plan.raceDetails?.raceType || 'Race Plan')}</div>
                        <div class="plan-meta">by ${plan.ownerName} • ${raceDate.toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div class="plan-details">
                    <div class="plan-detail">
                        <span class="plan-detail-label">Location:</span>
                        <span class="plan-detail-value">${plan.raceDetails?.location || 'Not specified'}</span>
                    </div>
                    <div class="plan-detail">
                        <span class="plan-detail-label">Weather:</span>
                        <span class="plan-detail-value">${plan.raceDetails?.temperature || 'N/A'}°F</span>
                    </div>
                </div>
                
                <div class="plan-tags">
                    <span class="plan-tag">Community</span>
                </div>
            </div>
        `;
    }

    populateProfileForm() {
        if (!this.currentUser) return;

        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        
        if (profileName) profileName.value = this.userData.name || this.currentUser.displayName || '';
        if (profileEmail) profileEmail.value = this.currentUser.email || '';

        // Set experience level
        const experienceInputs = document.querySelectorAll('input[name="profile-experience"]');
        experienceInputs.forEach(input => {
            input.checked = input.value === this.userData.experience;
        });

        // Set preferred race types
        const raceTypeInputs = document.querySelectorAll('input[name="profile-race-types"]');
        raceTypeInputs.forEach(input => {
            input.checked = this.userData.preferredRaceTypes.includes(input.value);
        });
    }

    async updateProfile() {
        if (!this.currentUser || typeof dbService === 'undefined') return;

        const name = document.getElementById('profile-name').value;
        const experience = document.querySelector('input[name="profile-experience"]:checked')?.value;
        const preferredRaceTypes = Array.from(document.querySelectorAll('input[name="profile-race-types"]:checked')).map(input => input.value);

        try {
            await dbService.updateUserProfile({
                displayName: name,
                experience,
                preferredRaceTypes
            });

            // Update local data
            this.userData.name = name;
            this.userData.experience = experience;
            this.userData.preferredRaceTypes = preferredRaceTypes;

            // Update display name in header
            const displayNameEl = document.getElementById('user-display-name');
            if (displayNameEl) {
                displayNameEl.textContent = name || 'User';
            }

            this.showSuccess('Profile updated successfully!');
        } catch (error) {
            this.showError('Error updating profile: ' + error.message);
        }
    }

    async updatePreferences() {
        if (!this.currentUser || typeof dbService === 'undefined') return;

        const units = document.getElementById('units').value;
        const notifications = document.getElementById('notifications').checked;

        try {
            await dbService.updateUserProfile({
                settings: {
                    units,
                    notifications
                }
            });

            this.showSuccess('Preferences saved successfully!');
        } catch (error) {
            this.showError('Error saving preferences: ' + error.message);
        }
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Enhanced save plan method
    async savePlan() {
        if (!this.currentUser || typeof dbService === 'undefined') {
            // Fall back to local storage
            this.saveUserData();
            this.showSuccess('Your race day plan has been saved locally!');
            return;
        }

        const planData = {
            id: this.currentPlanId,
            raceDetails: this.userData.raceDetails,
            recommendations: this.userData.recommendations,
            userProfile: {
                experience: this.userData.experience,
                preferredRaceTypes: this.userData.preferredRaceTypes
            }
        };

        try {
            const planId = await dbService.saveRacePlan(planData);
            this.currentPlanId = planId;
            this.showSuccess('Your race day plan has been saved to the cloud!');
            
            // Refresh saved plans
            this.loadSavedPlans();
        } catch (error) {
            this.showError('Error saving plan: ' + error.message);
            // Fall back to local storage
            this.saveUserData();
        }
    }

    // Rest of the original methods remain the same but with enhanced functionality...
    // [The rest of the original app.js methods would go here with minimal changes]
    
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
            page.style.display = 'none';
        });
        
        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.style.display = 'block';
        }
        
        this.currentPage = pageId;
    }

    // Include all other original methods from the previous app.js file
    // ... (continuing with all the existing methods for race setup, recommendations, etc.)
}