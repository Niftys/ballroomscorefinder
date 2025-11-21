# Firebase Migration Guide

This guide will help you complete the migration from AWS to Firebase for your Ballroom Scores application.

## Overview

The migration includes:
- **Backend**: Python script now uses Firestore instead of MySQL
- **API**: Firebase Cloud Functions replace AWS API Gateway/Lambda
- **Frontend**: React app updated to use Firebase Functions
- **Hosting**: Firebase Hosting for the React app
- **Database**: Firestore collections replace MySQL tables

## Firestore Schema

The following collections have been created to match your MySQL structure:

### Collections:
- `competitions` - Competition information
- `people` - Competitors/couples
- `judges` - Judge information
- `styles` - Dance styles
- `scores` - Individual scores with references to other collections

### Document Structure:
```javascript
// competitions/{id}
{
  name: "Austin Open 2025"
}

// people/{id}
{
  name: "John & Jane Doe"
}

// judges/{id}
{
  name: "Judge Smith"
}

// styles/{id}
{
  name: "Mixed Leads"
}

// scores/{people_id}_{judge_id}_{style_id}_{comp_id}
{
  score: 95,
  people_id: "person_id",
  judge_id: "judge_id", 
  style_id: "style_id",
  comp_id: "comp_id",
  overall_score: 1
}
```

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Firestore Database
4. Enable Cloud Functions
5. Enable Firebase Hosting

### 2. Service Account Setup (for Python script)

1. Go to Project Settings > Service Accounts
2. Generate a new private key
3. Download the JSON file
4. Place it in your project root
5. Update `env.example` with the path to your service account file

### 3. Environment Variables

#### For Python Script:
Create a `.env` file in the project root:
```bash
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/your/service-account-key.json
```

#### For React Frontend:
Create a `.env` file in the project root:
```bash
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 4. Install Dependencies

#### Python Dependencies:
```bash
pip install -r requirements.txt
```

#### Node.js Dependencies:
```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 5. Update Configuration Files

1. Update `functions/src/index.ts` - replace `your-project-id` with your actual Firebase project ID
2. Update all frontend files that reference `your-project-id` in the BASE_URL

### 6. Deploy Firebase Functions

```bash
# Build and deploy functions
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 7. Deploy Firebase Hosting

```bash
# Build React app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 8. Test the Migration

1. Run your Python script to populate Firestore:
   ```bash
   python data_entry.py
   ```

2. Test the React app locally:
   ```bash
   npm start
   ```

3. Test the deployed app at your Firebase Hosting URL

## API Endpoints

The following Firebase Functions have been created to replace your AWS API:

- `GET /api/fetchCompetitors?competitor={query}` - Search competitors
- `GET /api/fetchCompetitions` - Get all competitions
- `GET /api/fetchData?{filters}` - Search scores with filters
- `GET /api/fetchJudgeRatings?competitor_id={id}&style_id={id}&competition_id={id}` - Get judge ratings
- `GET /api/fetchJudges?judge={query}` - Search judges
- `GET /api/fetchStyles?style={query}` - Search styles
- `GET /api/fetchTotalPlacements?placement={number}` - Get leaderboard data
- `GET /api/fetchAnalytics?competitor={name}` - Get competitor analytics
- `GET /api/fetchAveragePlacements?competitor={name}` - Get average placements

## Security Rules

Firestore security rules have been set to allow read-only access to all collections. This is appropriate for your public application.

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure CORS is properly configured in your Firebase Functions
2. **Authentication Errors**: Ensure your service account key is properly configured
3. **Function Timeout**: Some queries might take longer - consider adding pagination
4. **Missing Data**: Ensure your Python script successfully populated Firestore

### Local Development:

For local development, you can use Firebase emulators:
```bash
firebase emulators:start
```

This will start local emulators for Firestore and Functions.

## Next Steps

1. Test all functionality thoroughly
2. Monitor Firebase usage and costs
3. Consider implementing caching for frequently accessed data
4. Set up monitoring and logging for production use

## Support

If you encounter any issues during the migration, check:
1. Firebase Console for error logs
2. Browser developer tools for frontend errors
3. Python script output for data import issues
