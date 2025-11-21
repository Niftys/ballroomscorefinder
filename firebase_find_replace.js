#!/usr/bin/env node

/**
 * Firebase Find and Replace Script
 * 
 * This script allows you to find and replace text strings across your Firebase database.
 * It supports dry-run mode, backup creation, and batch processing for large datasets.
 * 
 * Usage:
 *   node firebase_find_replace.js --collection people --field name --find "Old Name" --replace "New Name"
 *   node firebase_find_replace.js --collection people --field name --find "Old Name" --replace "New Name" --dry-run
 *   node firebase_find_replace.js --collection people --field name --find "Old Name" --replace "New Name" --backup
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Try to use the service account key file directly
const serviceAccountPath = './ballroom-score-finder-firebase-adminsdk-fbsvc-4ca5a75bde.json';

try {
  let credential;
  
  // Try to use the service account key file directly
  if (fs.existsSync(serviceAccountPath)) {
    console.log('Using service account key file:', serviceAccountPath);
    const serviceAccount = require(serviceAccountPath);
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Fall back to default credentials
    console.log('Using default credentials...');
    credential = admin.credential.applicationDefault();
  }
  
  admin.initializeApp({
    credential: credential,
    projectId: 'ballroom-score-finder'
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.log('Make sure you have:');
  console.log('1. The service account key file in the project root');
  console.log('2. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  process.exit(1);
}

const db = admin.firestore();

// Configuration
const BATCH_SIZE = 500; // Firestore batch write limit
const BACKUP_DIR = './firebase_backups';

// Command line argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    collection: null,
    field: null,
    find: null,
    replace: null,
    dryRun: false,
    backup: false,
    caseSensitive: false,
    exactMatch: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--collection':
      case '-c':
        config.collection = args[++i];
        break;
      case '--field':
      case '-f':
        config.field = args[++i];
        break;
      case '--find':
        config.find = args[++i];
        break;
      case '--replace':
        config.replace = args[++i] || '';
        break;
      case '--dry-run':
      case '-d':
        config.dryRun = true;
        break;
      case '--backup':
      case '-b':
        config.backup = true;
        break;
      case '--case-sensitive':
        config.caseSensitive = true;
        break;
      case '--exact-match':
        config.exactMatch = true;
        break;
      case '--help':
      case '-h':
        config.help = true;
        break;
    }
  }

  return config;
}

// Display help information
function showHelp() {
  console.log(`
Firebase Find and Replace Script

USAGE:
  node firebase_find_replace.js [OPTIONS]

OPTIONS:
  --collection, -c <name>     Collection name (required)
  --field, -f <name>          Field name to search in (required)
  --find <text>               Text to find (required)
  --replace <text>            Text to replace with (required, use "" to delete)
  --dry-run, -d               Preview changes without making them
  --backup, -b                Create backup before making changes
  --case-sensitive            Case-sensitive search
  --exact-match               Match exact text only (not substring)
  --help, -h                  Show this help message

EXAMPLES:
  # Dry run to see what would be changed
  node firebase_find_replace.js -c people -f name --find "John Smith" --replace "John Doe" --dry-run

  # Replace with backup
  node firebase_find_replace.js -c people -f name --find "John Smith" --replace "John Doe" --backup

  # Case-sensitive exact match
  node firebase_find_replace.js -c people -f name --find "john" --replace "John" --case-sensitive --exact-match

  # Replace substring in text
  node firebase_find_replace.js -c people -f name --find " & " --replace " and "

  # Delete text (replace with empty string)
  node firebase_find_replace.js -c people -f name --find " (deceased)" --replace ""

SAFETY FEATURES:
  - Always use --dry-run first to preview changes
  - Use --backup to create a backup before making changes
  - The script processes documents in batches for safety
  - All operations are logged for audit purposes
`);
}

// Create backup directory
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Create backup of collection
async function createBackup(collectionName) {
  console.log(`Creating backup of collection '${collectionName}'...`);
  
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `${collectionName}_backup_${timestamp}.json`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const backupData = {
      collection: collectionName,
      timestamp: new Date().toISOString(),
      documentCount: snapshot.docs.length,
      documents: snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`Backup created: ${backupFile}`);
    console.log(`Backup contains ${backupData.documentCount} documents`);
    return backupFile;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

// Find documents that match the search criteria
async function findMatchingDocuments(collectionName, fieldName, searchText, options) {
  console.log(`Searching for documents in collection '${collectionName}' where field '${fieldName}' contains '${searchText}'...`);
  
  const snapshot = await db.collection(collectionName).get();
  const matchingDocs = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fieldValue = data[fieldName];
    
    if (fieldValue && typeof fieldValue === 'string') {
      let matches = false;
      
      if (options.exactMatch) {
        if (options.caseSensitive) {
          matches = fieldValue === searchText;
        } else {
          matches = fieldValue.toLowerCase() === searchText.toLowerCase();
        }
      } else {
        if (options.caseSensitive) {
          matches = fieldValue.includes(searchText);
        } else {
          matches = fieldValue.toLowerCase().includes(searchText.toLowerCase());
        }
      }
      
      if (matches) {
        matchingDocs.push({
          id: doc.id,
          data: data,
          fieldValue: fieldValue
        });
      }
    }
  }
  
  console.log(`Found ${matchingDocs.length} matching documents`);
  return matchingDocs;
}

// Replace text in documents
async function replaceInDocuments(collectionName, fieldName, findText, replaceText, matchingDocs, options) {
  if (matchingDocs.length === 0) {
    console.log('No documents to update');
    return;
  }
  
  console.log(`Updating ${matchingDocs.length} documents...`);
  
  let updatedCount = 0;
  const batch = db.batch();
  let batchCount = 0;
  
  for (const doc of matchingDocs) {
    const currentValue = doc.fieldValue;
    let newValue;
    
    if (options.exactMatch) {
      if (options.caseSensitive) {
        newValue = currentValue === findText ? replaceText : currentValue;
      } else {
        newValue = currentValue.toLowerCase() === findText.toLowerCase() ? replaceText : currentValue;
      }
    } else {
      if (options.caseSensitive) {
        newValue = currentValue.replace(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceText);
      } else {
        newValue = currentValue.replace(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replaceText);
      }
    }
    
    if (newValue !== currentValue) {
      const docRef = db.collection(collectionName).doc(doc.id);
      batch.update(docRef, { [fieldName]: newValue });
      batchCount++;
      
      console.log(`  ${doc.id}: "${currentValue}" -> "${newValue}"`);
      
      if (batchCount >= BATCH_SIZE) {
        if (!options.dryRun) {
          await batch.commit();
        }
        console.log(`  Committed batch of ${batchCount} updates`);
        updatedCount += batchCount;
        batchCount = 0;
      }
    }
  }
  
  // Commit remaining updates
  if (batchCount > 0) {
    if (!options.dryRun) {
      await batch.commit();
    }
    console.log(`  Committed final batch of ${batchCount} updates`);
    updatedCount += batchCount;
  }
  
  console.log(`Total documents updated: ${updatedCount}`);
}

// Main function
async function main() {
  const config = parseArgs();
  
  if (config.help) {
    showHelp();
    return;
  }
  
  // Validate required parameters
  if (!config.collection || !config.field || !config.find || config.replace === undefined) {
    console.error('Error: Missing required parameters');
    console.log('Required: --collection, --field, --find, --replace');
    console.log('Note: --replace can be an empty string to delete text');
    console.log('Use --help for more information');
    process.exit(1);
  }
  
  console.log('Firebase Find and Replace Script');
  console.log('================================');
  console.log(`Collection: ${config.collection}`);
  console.log(`Field: ${config.field}`);
  console.log(`Find: "${config.find}"`);
  console.log(`Replace: "${config.replace}"`);
  console.log(`Dry Run: ${config.dryRun}`);
  console.log(`Backup: ${config.backup}`);
  console.log(`Case Sensitive: ${config.caseSensitive}`);
  console.log(`Exact Match: ${config.exactMatch}`);
  console.log('');
  
  try {
    // Create backup if requested
    if (config.backup && !config.dryRun) {
      await createBackup(config.collection);
    }
    
    // Find matching documents
    const matchingDocs = await findMatchingDocuments(
      config.collection,
      config.field,
      config.find,
      config
    );
    
    if (matchingDocs.length === 0) {
      console.log('No matching documents found');
      return;
    }
    
    // Show preview of changes
    console.log('\nPreview of changes:');
    console.log('===================');
    for (const doc of matchingDocs.slice(0, 10)) { // Show first 10
      console.log(`  ${doc.id}: "${doc.fieldValue}"`);
    }
    if (matchingDocs.length > 10) {
      console.log(`  ... and ${matchingDocs.length - 10} more`);
    }
    
    if (config.dryRun) {
      console.log('\nDRY RUN: No changes were made');
      console.log(`Would update ${matchingDocs.length} documents`);
      return;
    }
    
    // Confirm before proceeding
    console.log(`\nAbout to update ${matchingDocs.length} documents`);
    console.log('This action cannot be undone!');
    
    // In a real implementation, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically
    
    // Perform the replacement
    await replaceInDocuments(
      config.collection,
      config.field,
      config.find,
      config.replace,
      matchingDocs,
      config
    );
    
    console.log('\nOperation completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  findMatchingDocuments,
  replaceInDocuments,
  createBackup
};
