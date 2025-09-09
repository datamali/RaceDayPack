# 🏃‍♂️ RaceDayPack

Your intelligent race day preparation assistant. Never wonder what to wear or pack again.

## Features

### 🎯 Smart Recommendations
- **Weather-based clothing suggestions** - Automatically fetches weather data and recommends appropriate gear
- **Race-type specific equipment** - Different recommendations for running, cycling, triathlons, and more
- **Experience-level customization** - Beginner-friendly guidance or advanced optimization tips

### 📋 Comprehensive Planning
- **Interactive packing checklists** - Organized by pre-race, during-race, and post-race needs
- **Visual outfit builder** - See your complete race day outfit before race day
- **Timeline planning** - Week-before, night-before, and race-morning task lists

### 👤 Personal Experience
- **User authentication** - Secure account creation with email/password or Google sign-in
- **Cloud data sync** - Save race plans to the cloud, access from anywhere
- **User profiles** - Save preferences and learn from past races
- **Quick start option** - Get recommendations in under 2 minutes
- **Detailed setup** - Comprehensive planning for optimal preparation

### 🔐 Account & Data Management
- **Firebase Authentication** - Secure user accounts with email verification
- **Cloud Database** - Real-time synchronization across devices
- **Offline Support** - Continue using the app without internet connection
- **Privacy Controls** - Share plans publicly or keep them private
- **Data Export** - Download your race plans and preferences

### 🌤️ Weather Integration
- Real-time weather forecasting for race locations
- Temperature-specific gear recommendations
- Condition-based adjustments (rain, wind, humidity)

## Quick Start

### New Users
1. **Create Account** - Sign up with email or Google for cloud sync
2. **Build Profile** - Set experience level and preferred race types
3. **Create Race Plan** - Enter race details and get personalized recommendations
4. **Save & Access** - Plans saved to cloud, accessible from any device

### Existing Users
1. **Sign In** - Access your saved plans and preferences
2. **Dashboard** - View all your race plans and community shared plans
3. **Quick Planning** - Create new plans based on previous races
4. **Race Day Ready** - Access your plan offline during race day

### Offline Mode
- Continue without account for local-only usage
- All features available except cloud sync and sharing
- Perfect for one-time use or privacy-conscious users

## User Journey

1. **Authentication**
   - Sign up/Sign in with email or Google
   - Option to continue offline without account
   - Secure, encrypted data storage

2. **Profile Setup**
   - Experience level (beginner, intermediate, advanced)
   - Preferred race types and personal preferences
   - Optional: measurement units and notification settings

3. **Race Planning**
   - Race type (5K, Marathon, Triathlon, etc.)
   - Date, time, and location with weather integration
   - Personalized gear and packing recommendations

4. **Plan Management**
   - Save unlimited race plans to your account
   - Edit, duplicate, or delete existing plans
   - Share plans with the community for others to use

5. **Race Day**
   - Access plans offline during race
   - Interactive checklists to track preparation
   - Timeline reminders for optimal preparation

## Supported Race Types

- 🏃‍♀️ **Running**: 5K, 10K, Half Marathon, Marathon
- 🚴‍♂️ **Cycling**: Road, Mountain, Time Trials
- 🏊‍♀️ **Triathlon**: Sprint, Olympic, Half Ironman, Ironman
- 🏊‍♂️ **Swimming**: Open water events
- And more coming soon!

## Technology

### Frontend
- **Vanilla HTML/CSS/JavaScript** - Fast loading and performance
- **Firebase SDK** - Authentication and real-time database
- **Mobile-first responsive design** - Works on all devices
- **CSS Grid and Flexbox** - Modern, flexible layouts
- **Offline-first architecture** - Continue working without internet

### Backend & Database
- **Firebase Authentication** - Secure user management with email/Google
- **Cloud Firestore** - Real-time NoSQL database with offline sync
- **Security Rules** - Protect user data with granular permissions
- **Offline Persistence** - Local caching for seamless offline experience

## Development

### Setup
```bash
# Clone the repository
git clone https://github.com/datamali/RaceDayPack.git
cd RaceDayPack

# Install development dependencies
npm install

# Set up Firebase (see FIREBASE_SETUP.md)
# 1. Create Firebase project
# 2. Enable Authentication and Firestore
# 3. Update firebase-config.js with your config
# 4. Deploy security rules

# Start development server
npm run dev
```

### Firebase Configuration
1. Follow the detailed guide in `FIREBASE_SETUP.md`
2. Update `firebase-config.js` with your Firebase project credentials
3. Deploy the Firestore security rules from `firestore.rules`
4. Test authentication and data persistence

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with live reload
- `npm run build` - Build for production
- `npm run lint` - Run code linting
- `npm test` - Run tests

### Project Structure
```
RaceDayPack/
├── index.html              # Main HTML with auth and dashboard
├── styles.css              # Complete styling system + auth styles
├── app.js                  # Enhanced app logic with Firebase integration
├── firebase-config.js      # Firebase configuration and database service
├── firestore.rules         # Database security rules
├── FIREBASE_SETUP.md       # Detailed Firebase setup instructions
├── package.json            # Project configuration
├── CLAUDE.md              # Development guidance for Claude Code
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Real weather API integration (OpenWeatherMap)
- [ ] Gear database with brand recommendations
- [ ] Social features and race crew coordination
- [ ] Training plan integration
- [ ] Race result tracking and analysis
- [ ] Mobile app (PWA conversion)
- [ ] Nutrition planning integration
- [ ] Race venue specific tips and logistics

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Weather data powered by OpenWeatherMap (planned)
- Icons and design inspired by modern sports applications
- Built with love for the racing community 🏁