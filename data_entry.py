import re
import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from urllib.parse import urlparse, parse_qs
import firebase_config
from firebase_config import initialize_firebase

# ----------------------------------------------------------------------------------
#                     Configurable Main URL and Competition Name
# ----------------------------------------------------------------------------------

MAIN_COMPETITION_URL = "https://ballroomcompexpress.com/results.php?cid=179"  # Enter main competition URL here
COMPETITION_NAME = "Dances with Owls 2025"  # Enter the competition name and year here

# ----------------------------------------------------------------------------------
#                      Extract CID from URL
# ----------------------------------------------------------------------------------
def extract_cid_from_url(url):
    query_params = parse_qs(urlparse(url).query)
    cid = query_params.get('cid', [None])[0]
    if cid:
        print(f"Extracted cid: {cid}")
    else:
        print("No 'cid' parameter found in the URL.")
    return cid

CID = extract_cid_from_url(MAIN_COMPETITION_URL)

# ----------------------------------------------------------------------------------
#                      Connecting to Firestore and Fetching Dataset
# ----------------------------------------------------------------------------------
def create_connection():
    """Initialize Firestore connection"""
    db = initialize_firebase()
    if db:
        print("Firestore connection successful")
    return db

def fetch_data_mappings(db):
    """Fetch mappings from Firestore collections"""
    mappings = {}
    
    # Fetch judges
    judges_ref = db.collection('judges')
    judges_docs = judges_ref.stream()
    mappings['judges'] = {doc.to_dict()['name']: doc.id for doc in judges_docs}
    
    # Fetch people (competitors)
    people_ref = db.collection('people')
    people_docs = people_ref.stream()
    mappings['people'] = {doc.to_dict()['name']: doc.id for doc in people_docs}
    
    # Fetch styles
    styles_ref = db.collection('styles')
    styles_docs = styles_ref.stream()
    mappings['styles'] = {doc.to_dict()['name']: doc.id for doc in styles_docs}
    
    return mappings

def get_or_create_competition_id(db, competition_name):
    """Get or create competition in Firestore"""
    comp_ref = db.collection('competitions')
    
    # Check if competition exists
    query = comp_ref.where('name', '==', competition_name).limit(1)
    docs = list(query.stream())
    
    if docs:
        comp_id = docs[0].id
        print(f"Competition '{competition_name}' found with comp_id = {comp_id}.")
    else:
        # Create new competition
        doc_ref = comp_ref.add({'name': competition_name})
        comp_id = doc_ref[1].id
        print(f"Competition '{competition_name}' added with new comp_id = {comp_id}.")
    
    return comp_id

def insert_missing_entries(db, missing_judges, missing_couples):
    """Insert missing judges and competitors into Firestore"""
    if missing_judges:
        judges_ref = db.collection('judges')
        for judge in missing_judges:
            judges_ref.add({'name': judge})
        print(f"Inserted missing judges: {', '.join(missing_judges)}")
    
    if missing_couples:
        people_ref = db.collection('people')
        for couple in missing_couples:
            people_ref.add({'name': couple})
        print(f"Inserted missing couples: {', '.join(missing_couples)}")

def insert_missing_style(db, style_name):
    """Insert missing style into Firestore"""
    styles_ref = db.collection('styles')
    doc_ref = styles_ref.add({'name': style_name})
    style_id = doc_ref[1].id
    print(f"Added missing style: '{style_name}' with ID {style_id}")
    return style_id

# ----------------------------------------------------------------------------------
#                        Event Data Collection
# ----------------------------------------------------------------------------------
def get_event_links():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    driver = webdriver.Chrome(options=options)
    driver.get(MAIN_COMPETITION_URL)
    event_links = [
        element.get_attribute("href")
        for element in driver.find_elements(By.CSS_SELECTOR, f"a[href*='results.php?cid={CID}&eid=']")
    ]
    print(f"Found {len(event_links)} event links.")
    driver.quit()
    return event_links

def process_all_events(db):
    comp_id = get_or_create_competition_id(db, COMPETITION_NAME)
    event_links = get_event_links()
    if not event_links:
        print("No event links found.")
        return
    for event_url in event_links:
        print(f"Processing event: {event_url}")
        process_data(db, event_url, comp_id)
    print("Completed processing all events.")

def process_data(db, url, comp_id):
    output_filename = firebase_config.OUTPUT_FILE
    style_name = scrape_table_to_excel(url, output_filename)
    if not style_name:
        print(f"Failed to scrape data from the webpage: {url}")
        return

    # Load Excel data and ignore the first column
    df = pd.read_excel(output_filename)
    df = df.iloc[:, 1:]  # Drop the first column

    competitor_column_index = 0  # Since the first column is dropped, competitor names are now in the first column

    # Fetch mappings for judges, people, and styles
    mappings = fetch_data_mappings(db)
    style_id = mappings['styles'].get(style_name)
    if style_id is None:
        style_id = insert_missing_style(db, style_name)
        mappings['styles'][style_name] = style_id  # Update mappings

    judge_id_map, people_id_map = mappings['judges'], mappings['people']

    # Identify judges and handle missing entries
    judge_ids = []
    missing_judges = []
    for judge_name in df.columns[2:]:  # Start from the third column after ignoring the first
        judge_id = judge_id_map.get(judge_name)
        if judge_id is None:
            missing_judges.append(judge_name)
        judge_ids.append(judge_id)

    # Process each row and add data to values_list
    values_list = []
    update_list = []
    missing_couples = []

    for _, row in df.iterrows():
        # Extract competitor name and overall_score
        competitor_name = row.iloc[competitor_column_index]
        overall_score = row.iloc[1]  # Second column is overall_score after dropping the first column

        # Print validation for each couple and their overall score
        print(f"Processing: Competitor = {competitor_name}, Overall Score = {overall_score}")

        # Map competitor to people_id
        people_id = people_id_map.get(competitor_name)
        if people_id is None:
            missing_couples.append(competitor_name)
            continue

        # Add overall_score to update list
        update_list.append((int(overall_score), people_id, style_id, comp_id))

        # Add judge-specific scores to values_list
        scores = row.iloc[2:].tolist()  # Remaining columns are judge scores
        for score, judge_id in zip(scores, judge_ids):
            if judge_id and pd.notna(score) and isinstance(score, (int, float)):
                values_list.append((int(score), people_id, judge_id, style_id, comp_id, int(overall_score)))

    # Insert missing judges and competitors
    if missing_judges or missing_couples:
        print("Adding missing entries to database...")
        insert_missing_entries(db, missing_judges, missing_couples)
        print("Missing entries added successfully.")

        # Refresh mappings after insertion
        mappings = fetch_data_mappings(db)
        judge_id_map, people_id_map = mappings['judges'], mappings['people']

        # Re-process missing couples with updated mappings
        for couple_name in missing_couples:
            people_id = people_id_map.get(couple_name)
            if people_id:
                for _, row in df.iterrows():
                    if row.iloc[competitor_column_index] == couple_name:
                        scores = row.iloc[2:].tolist()
                        overall_score = row.iloc[1]
                        print(f"Re-processing: Competitor = {couple_name}, Overall Score = {overall_score}")
                        for score, judge_id in zip(scores, judge_ids):
                            if judge_id and pd.notna(score) and isinstance(score, (int, float)):
                                values_list.append((int(score), people_id, judge_id, style_id, comp_id, int(overall_score)))
                        update_list.append((int(overall_score), people_id, style_id, comp_id))

    # Update overall scores in the database
    if update_list:
        print(f"Updating overall scores for {len(update_list)} entries...")
        update_overall_scores(db, update_list)
    print("Update of overall_score completed.")

    # Insert new scores into the database
    if values_list:
        print(f"Inserting {len(values_list)} new score entries...")
        insert_scores(db, values_list)
    print("Data entry completed for event.")

def scrape_table_to_excel(url, output_filename=firebase_config.OUTPUT_FILE):
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    driver = webdriver.Chrome(options=options)
    driver.get(url)

    try:
        # Extract style name from header (e.g., h1 tag)
        header_element = driver.find_element(By.CSS_SELECTOR, "h1")
        raw_style_name = header_element.text.replace("Results for", "").strip()

        # Step 1: Remove full label "/A1 (18+)"
        raw_style_name = re.sub(r"/A1\s*\(18\+\)", "", raw_style_name)

        # Step 2: Replace known exact matches first
        raw_style_name = raw_style_name.replace("Mixed Pro - Leader Judged", "Mixed Leads")
        raw_style_name = raw_style_name.replace("Leaders\\\' Solo Proficiency", "Mixed Leads")
        raw_style_name = raw_style_name.replace("Mixed Pro - Follower Judged", "Mixed Follows")
        raw_style_name = raw_style_name.replace("Followers\\\' Solo Proficiency", "Mixed Leads")
        raw_style_name = raw_style_name.replace("Intermediate/Advanced", "Open")
        raw_style_name = raw_style_name.replace("Country Western", "Country")
        raw_style_name = raw_style_name.replace("Social Dances", "Social")
        raw_style_name = raw_style_name.replace("Beginner", "Newcomer")
        raw_style_name = raw_style_name.replace("Two-Step", "Two Step")

        # Step 3: Remove unwanted standalone words like 'Amateur' and 'Collegiate'
        style_name = re.sub(r"\b(Amateur|Collegiate)\b", "", raw_style_name)

        # Step 4: Clean up any leftover spacing
        style_name = re.sub(r"\s*\(18-34\)", "", style_name).strip()  # optional: remove "(18-34)"
        style_name = re.sub(r"\s+", " ", style_name).strip()  # collapse multiple spaces

        print(f"Extracted and cleaned style: {style_name}")

        # Extract table data
        table = driver.find_element(By.XPATH, "//div[@id='results']//table")
        headers = [header.text for header in table.find_elements(By.TAG_NAME, "th")]
        rows = table.find_elements(By.TAG_NAME, "tr")
        data = [[cell.text for cell in row.find_elements(By.TAG_NAME, "td")] for row in rows]
        df = pd.DataFrame(data, columns=headers)
        df.to_excel(output_filename, index=False)
        print(f"Data saved to {output_filename}")
    except Exception as e:
        print("Error during scraping:", e)
        driver.quit()
        return None

    driver.quit()
    return style_name

def insert_scores(db, values_list):
    """Insert scores into Firestore"""
    if not values_list:
        return
    
    scores_ref = db.collection('scores')
    batch = db.batch()
    
    try:
        for score_data in values_list:
            score, people_id, judge_id, style_id, comp_id, overall_score = score_data
            
            # Create a unique document ID based on the combination of IDs
            doc_id = f"{people_id}_{judge_id}_{style_id}_{comp_id}"
            
            # Check if document already exists
            doc_ref = scores_ref.document(doc_id)
            doc = doc_ref.get()
            
            if doc.exists:
                # Update existing document
                doc_ref.update({
                    'overall_score': overall_score,
                    'score': score
                })
            else:
                # Create new document
                doc_ref.set({
                    'score': score,
                    'people_id': people_id,
                    'judge_id': judge_id,
                    'style_id': style_id,
                    'comp_id': comp_id,
                    'overall_score': overall_score
                })
        
        batch.commit()
        print(f"Inserted/Updated {len(values_list)} score entries.")
    except Exception as e:
        print(f"Error inserting scores: {e}")

def update_overall_scores(db, update_list):
    """Update overall scores in Firestore"""
    if not update_list:
        return
    
    scores_ref = db.collection('scores')
    
    try:
        for update_data in update_list:
            overall_score, people_id, style_id, comp_id = update_data
            
            # Query for documents matching the criteria
            query = scores_ref.where('people_id', '==', people_id)\
                             .where('style_id', '==', style_id)\
                             .where('comp_id', '==', comp_id)
            
            docs = query.stream()
            for doc in docs:
                doc.reference.update({'overall_score': overall_score})
        
        print(f"Updated overall_score for {len(update_list)} entries.")
    except Exception as e:
        print(f"Error updating scores: {e}")

# ----------------------------------------------------------------------------------
#                           Main Execution
# ----------------------------------------------------------------------------------
def main():
    db = create_connection()
    if db is None:
        print("Failed to connect to Firestore.")
        return
    process_all_events(db)

if __name__ == "__main__":
    main()
