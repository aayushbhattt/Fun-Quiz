# Image Quiz Application

A fun, image-based quiz web application built with Firebase.

## Features

- 🎯 Image-based quiz questions
- 👤 Unique ID + Display Name for participants
- 🔐 Simple admin access (admin@123)
- 📊 Real-time leaderboard
- 📱 Responsive design
- ✨ Beautiful animations

## Quick Start

1. **Enable Firebase Services** (see SETUP.md)

   - Firestore Database (test mode)
   - Firebase Storage (test mode)

2. **Run the app**

   ```bash
   python3 -m http.server 8000
   ```

   Open: http://localhost:8000

3. **Admin Access**

   - Unique ID: `admin@123`
   - Display Name: (any name)

4. **User Access**
   - Unique ID: (any text except admin@123)
   - Display Name: (your name)

## Files

- `index.html` - Landing page
- `quiz.html` - Quiz interface
- `results.html` - Results & leaderboard
- `admin-dashboard.html` - Admin panel
- `style.css` - All styles
- `firebase-config.js` - Firebase setup
- `script.js` - Landing page logic
- `quiz.js` - Quiz logic
- `results.js` - Results logic
- `admin.js` - Admin logic

## Scoring

- Correct answer = 10 points
- Wrong answer = 0 points
- No negative marking

## Tech Stack

- HTML5, CSS3, JavaScript (ES6 Modules)
- Firebase (Firestore + Storage)
- No frameworks, pure vanilla JS

For detailed setup instructions, see [SETUP.md](SETUP.md)
