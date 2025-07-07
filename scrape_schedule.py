from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import json
import time

DIVISION_URLS = {
    "FRBCAPL TEST": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=b345a437-3415-4765-b19a-b2f7014f2cfa",
    "Singles Test": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=9058a0cc-3231-4118-bd91-b305006fe578"
}

options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')

driver = webdriver.Chrome(options=options)

all_matches = []

for division_name, url in DIVISION_URLS.items():
    print(f"Scraping {division_name}...")
    driver.get(url)
    time.sleep(5)  # Wait for page to load

    soup = BeautifulSoup(driver.page_source, "html.parser")
    schedule_list = soup.find("div", id="schedule-list")
    if not schedule_list:
        print(f"Could not find schedule list for {division_name}")
        continue

    current_date = None
    for elem in schedule_list.children:
        if getattr(elem, 'name', None) == 'div':
            if 'schedule-date' in elem.get('class', []):
                current_date = elem.get_text(strip=True)
            elif 'schedule-team-block' in elem.get('class', []):
                teams = elem.find_all('span', class_='schedule-team')
                if len(teams) == 2:
                    player1 = teams[0].get_text(strip=True).replace('(H)', '').replace('(A)', '').strip()
                    player2 = teams[1].get_text(strip=True).replace('(H)', '').replace('(A)', '').strip()
                    location = elem.find('span', class_='schedule-location').get_text(strip=True)
                    all_matches.append({
                        "division": division_name,
                        "date": current_date,
                        "player1": player1,
                        "player2": player2,
                        "location": location
                    })

driver.quit()

REACT_PUBLIC_PATH = "./public/schedule.json" 

with open(REACT_PUBLIC_PATH, "w", encoding="utf-8") as f:
    json.dump(all_matches, f, indent=2)

print(f"Saved {len(all_matches)} matches to {REACT_PUBLIC_PATH}")
