# Firebase Find and Replace Script

A powerful utility for finding and replacing text strings across your Firebase Firestore database.

## Features

- 🔍 **Find and replace** text in any Firestore collection
- 🛡️ **Safety features**: dry-run mode, automatic backups
- ⚡ **Batch processing** for large datasets
- 🎯 **Flexible matching**: case-sensitive, exact match, or substring
- 📊 **Detailed logging** of all operations
- 🔄 **Rollback support** with automatic backups

## Setup

1. **Install dependencies:**
   ```bash
   npm install firebase-admin
   ```

2. **Set up Firebase credentials:**
   
   **Option A: Service Account Key File**
   ```bash
   # Download your service account key from Firebase Console
   # Place it in your project directory
   export GOOGLE_APPLICATION_CREDENTIALS="./your-service-account-key.json"
   ```
   
   **Option B: Environment Variable**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
   ```

3. **Make the script executable:**
   ```bash
   chmod +x firebase_find_replace.js
   ```

## Usage

### Basic Commands

```bash
# Show help
node firebase_find_replace.js --help

# Dry run (preview changes without making them)
node firebase_find_replace.js -c people -f name --find "Old Name" --replace "New Name" --dry-run

# Replace with backup
node firebase_find_replace.js -c people -f name --find "Old Name" --replace "New Name" --backup

# Case-sensitive exact match
node firebase_find_replace.js -c people -f name --find "john" --replace "John" --case-sensitive --exact-match
```

### Command Options

| Option | Short | Description |
|--------|-------|-------------|
| `--collection` | `-c` | Collection name (required) |
| `--field` | `-f` | Field name to search in (required) |
| `--find` | | Text to find (required) |
| `--replace` | | Text to replace with (required) |
| `--dry-run` | `-d` | Preview changes without making them |
| `--backup` | `-b` | Create backup before making changes |
| `--case-sensitive` | | Case-sensitive search |
| `--exact-match` | | Match exact text only (not substring) |
| `--help` | `-h` | Show help message |

## Examples

### 1. Fix Name Formatting
```bash
# Replace " & " with " and " in people names
node firebase_find_replace.js -c people -f name --find " & " --replace " and " --backup
```

### 2. Standardize Competition Names
```bash
# Fix competition name typos
node firebase_find_replace.js -c competitions -f name --find "Austin Open 2024" --replace "Austin Open 2025" --backup
```

### 3. Update Style Names
```bash
# Standardize style names
node firebase_find_replace.js -c styles -f name --find "Waltz" --replace "International Waltz" --exact-match --backup
```

### 4. Clean Up Judge Names
```bash
# Fix judge name formatting
node firebase_find_replace.js -c judges -f name --find "Dr. " --replace "Dr. " --case-sensitive --backup
```

## Safety Features

### 1. Dry Run Mode
Always test with `--dry-run` first:
```bash
node firebase_find_replace.js -c people -f name --find "Test" --replace "Updated" --dry-run
```

### 2. Automatic Backups
Create backups before making changes:
```bash
node firebase_find_replace.js -c people -f name --find "Old" --replace "New" --backup
```

Backups are saved to `./firebase_backups/` with timestamps.

### 3. Batch Processing
The script processes documents in batches of 500 to avoid timeouts and memory issues.

## Common Use Cases

### Data Cleanup
- Fix typos in names
- Standardize formatting
- Update outdated information
- Merge duplicate entries

### Migration Tasks
- Update field values
- Change data formats
- Rename collections
- Restructure data

### Maintenance
- Update competition years
- Fix judge titles
- Standardize style names
- Clean up formatting

## Troubleshooting

### Permission Errors
```bash
# Make sure your service account has the right permissions
# Check Firebase Console > IAM & Admin > Service Accounts
```

### Connection Issues
```bash
# Verify your credentials
export GOOGLE_APPLICATION_CREDENTIALS="./your-key.json"
node firebase_find_replace.js --help
```

### Large Datasets
The script automatically handles large datasets with batch processing. For very large collections (>10,000 documents), consider running during off-peak hours.

## Best Practices

1. **Always use `--dry-run` first** to preview changes
2. **Create backups** with `--backup` for important data
3. **Test on a small subset** before running on production
4. **Run during off-peak hours** for large datasets
5. **Monitor the logs** for any errors or issues

## Rollback

If you need to rollback changes:
1. Use the backup files in `./firebase_backups/`
2. Restore the data using Firebase Console or another script
3. The backup files contain the original data with timestamps

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify your Firebase credentials
3. Ensure you have the right permissions
4. Test with `--dry-run` first
