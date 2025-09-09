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
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        document.getElementById(pageId).classList.add('active');
        this.currentPage = pageId;
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
}

// Initialize the app
const raceDayPack = new RaceDayPack();