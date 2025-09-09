// Firebase Configuration
// To set up your own Firebase project:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project called "RaceDayPack"
// 3. Enable Authentication (Email/Password and Google)
// 4. Enable Firestore Database
// 5. Replace the config below with your project's config

const firebaseConfig = {
    // Replace these with your Firebase project configuration
    apiKey: "your-api-key-here",
    authDomain: "racedaypack-demo.firebaseapp.com",
    projectId: "racedaypack-demo",
    storageBucket: "racedaypack-demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support offline persistence');
        }
    });

// Database helper functions
class DatabaseService {
    constructor() {
        this.currentUser = null;
        this.unsubscribeAuth = null;
        this.unsubscribeData = null;
    }

    // Initialize authentication listener
    initAuth(callback) {
        this.unsubscribeAuth = auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            callback(user);
        });
    }

    // Sign up with email and password
    async signUp(email, password, displayName) {
        try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName });
            
            // Create user profile document
            await this.createUserProfile(result.user);
            
            return result.user;
        } catch (error) {
            throw error;
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            throw error;
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            
            // Create user profile if it doesn't exist
            await this.createUserProfile(result.user);
            
            return result.user;
        } catch (error) {
            throw error;
        }
    }

    // Sign out
    async signOut() {
        try {
            if (this.unsubscribeData) {
                this.unsubscribeData();
            }
            await auth.signOut();
        } catch (error) {
            throw error;
        }
    }

    // Create user profile document
    async createUserProfile(user) {
        if (!user) return;
        
        const userRef = db.collection('users').doc(user.uid);
        const snapshot = await userRef.get();
        
        if (!snapshot.exists) {
            const { displayName, email } = user;
            const createdAt = new Date();
            
            try {
                await userRef.set({
                    displayName,
                    email,
                    createdAt,
                    experience: '',
                    preferredRaceTypes: [],
                    settings: {
                        units: 'imperial', // or 'metric'
                        notifications: true
                    }
                });
            } catch (error) {
                console.log('Error creating user profile:', error.message);
            }
        }
        
        return userRef;
    }

    // Get user profile
    async getUserProfile(userId = null) {
        const uid = userId || this.currentUser?.uid;
        if (!uid) return null;
        
        try {
            const userRef = db.collection('users').doc(uid);
            const snapshot = await userRef.get();
            
            if (snapshot.exists) {
                return { id: snapshot.id, ...snapshot.data() };
            }
        } catch (error) {
            console.log('Error getting user profile:', error.message);
        }
        
        return null;
    }

    // Update user profile
    async updateUserProfile(profileData) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        try {
            const userRef = db.collection('users').doc(this.currentUser.uid);
            await userRef.update({
                ...profileData,
                updatedAt: new Date()
            });
        } catch (error) {
            console.log('Error updating user profile:', error.message);
            throw error;
        }
    }

    // Save race plan
    async saveRacePlan(racePlanData) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        try {
            const racePlansRef = db.collection('users')
                .doc(this.currentUser.uid)
                .collection('racePlans');
                
            const racePlan = {
                ...racePlanData,
                userId: this.currentUser.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            if (racePlanData.id) {
                // Update existing race plan
                await racePlansRef.doc(racePlanData.id).update({
                    ...racePlan,
                    createdAt: racePlanData.createdAt // Preserve original creation date
                });
                return racePlanData.id;
            } else {
                // Create new race plan
                const docRef = await racePlansRef.add(racePlan);
                return docRef.id;
            }
        } catch (error) {
            console.log('Error saving race plan:', error.message);
            throw error;
        }
    }

    // Get all race plans for current user
    async getRacePlans() {
        if (!this.currentUser) return [];
        
        try {
            const racePlansRef = db.collection('users')
                .doc(this.currentUser.uid)
                .collection('racePlans')
                .orderBy('createdAt', 'desc');
                
            const snapshot = await racePlansRef.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.log('Error getting race plans:', error.message);
            return [];
        }
    }

    // Get specific race plan
    async getRacePlan(planId) {
        if (!this.currentUser) return null;
        
        try {
            const planRef = db.collection('users')
                .doc(this.currentUser.uid)
                .collection('racePlans')
                .doc(planId);
                
            const snapshot = await planRef.get();
            
            if (snapshot.exists) {
                return { id: snapshot.id, ...snapshot.data() };
            }
        } catch (error) {
            console.log('Error getting race plan:', error.message);
        }
        
        return null;
    }

    // Delete race plan
    async deleteRacePlan(planId) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        try {
            const planRef = db.collection('users')
                .doc(this.currentUser.uid)
                .collection('racePlans')
                .doc(planId);
                
            await planRef.delete();
        } catch (error) {
            console.log('Error deleting race plan:', error.message);
            throw error;
        }
    }

    // Listen to real-time updates for user's race plans
    subscribeToRacePlans(callback) {
        if (!this.currentUser) return null;
        
        const racePlansRef = db.collection('users')
            .doc(this.currentUser.uid)
            .collection('racePlans')
            .orderBy('createdAt', 'desc');
            
        this.unsubscribeData = racePlansRef.onSnapshot((snapshot) => {
            const racePlans = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(racePlans);
        });
        
        return this.unsubscribeData;
    }

    // Share race plan with others (make it public)
    async shareRacePlan(planId, isPublic = true) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        try {
            const planRef = db.collection('users')
                .doc(this.currentUser.uid)
                .collection('racePlans')
                .doc(planId);
                
            await planRef.update({
                isPublic,
                sharedAt: isPublic ? new Date() : null,
                updatedAt: new Date()
            });
            
            // If making public, also create a public reference
            if (isPublic) {
                const publicRef = db.collection('publicRacePlans').doc(planId);
                const planData = await this.getRacePlan(planId);
                
                await publicRef.set({
                    ...planData,
                    ownerName: this.currentUser.displayName || 'Anonymous',
                    ownerId: this.currentUser.uid
                });
            } else {
                // Remove from public collection
                await db.collection('publicRacePlans').doc(planId).delete();
            }
        } catch (error) {
            console.log('Error sharing race plan:', error.message);
            throw error;
        }
    }

    // Get public race plans for inspiration
    async getPublicRacePlans(limit = 20) {
        try {
            const publicRef = db.collection('publicRacePlans')
                .orderBy('sharedAt', 'desc')
                .limit(limit);
                
            const snapshot = await publicRef.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.log('Error getting public race plans:', error.message);
            return [];
        }
    }

    // Clean up listeners
    cleanup() {
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
        }
        if (this.unsubscribeData) {
            this.unsubscribeData();
        }
    }
}

// Create global database service instance
const dbService = new DatabaseService();