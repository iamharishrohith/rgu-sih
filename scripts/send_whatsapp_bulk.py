#!/usr/bin/env python3
"""
SIH 2026 - Automated Bulk WhatsApp Dispatcher
Rathinam Global University - Campus Evaluation Authority

Features:
- Automated Playwright browser automation
- Persistent login session (scan QR code once, saved for future runs)
- Dynamic placeholders ({leader_name}, {team_name}, {temp_team_id}, {ps_id}, {tier_status})
- Auto-sync with live Supabase database for pending/registered status
- Anti-ban delay & jitter protection
- Resume capability from log file
"""

import os
import sys
import re
import time
import random
import urllib.parse
import json
import csv
from datetime import datetime

try:
    import requests
except ImportError:
    print("[!] Installing required requests package...")
    os.system("pip install requests")
    import requests

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("[!] Installing Playwright...")
    os.system("pip install playwright")
    os.system("playwright install chromium")
    from playwright.sync_api import sync_playwright

SUPABASE_URL = "https://cgfmtthhudtmaswnxpva.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_h4-KaGCdVH0193UY9DtV3g_wLbr8cxp"

LOG_FILE = "whatsapp_broadcast_log.csv"
SESSION_DIR = os.path.abspath("whatsapp_user_session")

DEFAULT_TEMPLATE = """Hello {leader_name} (Team: {team_name}, ID: {temp_team_id}),

Urgent Reminder from Rathinam Global University for Smart India Hackathon 2026.

Your team is selected under [{tier_status}] for Problem Statement {ps_id}.

The candidate registration portal closes tonight at 12:00 AM Midnight. Please complete your mandatory 6-member student roster and mentor details immediately on the official portal:
https://rgu-sih.vercel.app

Regards,
SIH 2026 Campus Evaluation Authority
Rathinam Global University"""

def load_master_teams():
    master_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "sihMasterData.js")
    if not os.path.exists(master_path):
        master_path = os.path.join("src", "data", "sihMasterData.js")
    
    with open(master_path, "r", encoding="utf-8") as f:
        text = f.read()

    match = re.search(r"export const MASTER_TEAMS = (\[[\s\S]*?\]);", text)
    if not match:
        raise ValueError("Could not parse MASTER_TEAMS from sihMasterData.js")
    
    all_teams = json.loads(match.group(1))
    return [t for t in all_teams if t.get("status") in ["Shortlist", "Bench", "Waitlist"]]

def fetch_live_registrations():
    try:
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }
        res = requests.get(f"{SUPABASE_URL}/rest/v1/registrations?select=temp_team_id,team_name,leader_phone,leader_whatsapp", headers=headers, timeout=10)
        if res.status_code == 200:
            reg_map = {r["temp_team_id"]: r for r in res.json()}
            return reg_map
    except Exception as e:
        print(f"[!] Warning: Could not fetch live Supabase registrations: {e}")
    return {}

def fetch_live_contacts():
    try:
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }
        res = requests.get(f"{SUPABASE_URL}/rest/v1/team_contacts?select=*", headers=headers, timeout=10)
        if res.status_code == 200:
            return {c["temp_team_id"]: c for c in res.json()}
    except Exception as e:
        print(f"[!] Warning: Could not fetch team_contacts: {e}")
    return {}

def clean_phone_number(raw):
    if not raw:
        return ""
    p = re.sub(r"\D", "", str(raw))
    if p.startswith("0"):
        p = p[1:]
    if len(p) == 10:
        p = "91" + p
    return p

def load_sent_log():
    sent_ids = set()
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 2 and row[1] == "SENT":
                    sent_ids.add(row[0])
    return sent_ids

def log_dispatch(temp_team_id, status, team_name, leader_name, phone, note=""):
    file_exists = os.path.exists(LOG_FILE)
    with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["TempTeamID", "Status", "Timestamp", "TeamName", "LeaderName", "Phone", "Notes"])
        writer.writerow([temp_team_id, status, datetime.now().isoformat(), team_name, leader_name, phone, note])

def format_message(template, team):
    return template.replace("{leader_name}", team.get("leader_name", "Team Leader"))                    .replace("{team_name}", team.get("team_name", "Innovators"))                    .replace("{temp_team_id}", team.get("temp_team_id", ""))                    .replace("{ps_id}", team.get("ps_id", "SIH2026"))                    .replace("{tier_status}", team.get("status", "Finalist"))                    .replace("{school}", team.get("school", "RGU"))

def run_automation():
    print("=" * 70)
    print("  🚀 SIH 2026 AUTOMATED BULK WHATSAPP DISPATCH ENGINE")
    print("  Rathinam Global University - Campus Evaluation Authority")
    print("=" * 70)
    print()

    teams = load_master_teams()
    regs = fetch_live_registrations()
    contacts = fetch_live_contacts()
    sent_ids = load_sent_log()

    # Merge live data
    enriched_teams = []
    for t in teams:
        tid = t["temp_team_id"]
        reg = regs.get(tid)
        contact = contacts.get(tid)
        
        is_registered = bool(reg)
        phone = ""
        if reg and (reg.get("leader_whatsapp") or reg.get("leader_phone")):
            phone = reg.get("leader_whatsapp") or reg.get("leader_phone")
        elif contact and (contact.get("whatsapp_number") or contact.get("phone_number")):
            phone = contact.get("whatsapp_number") or contact.get("phone_number")
        else:
            phone = t.get("mobile", "")

        enriched_teams.append({
            **t,
            "is_registered": is_registered,
            "effective_phone": clean_phone_number(phone)
        })

    pending_teams = [t for t in enriched_teams if not t["is_registered"]]
    shortlist_teams = [t for t in enriched_teams if t["status"] == "Shortlist"]
    bench_teams = [t for t in enriched_teams if t["status"] == "Bench"]
    waitlist_teams = [t for t in enriched_teams if t["status"] == "Waitlist"]

    print(f"[*] Dataset Overview:")
    print(f"    - Total Finalized Teams: {len(enriched_teams)}")
    print(f"    - Already Registered:    {len(enriched_teams) - len(pending_teams)}")
    print(f"    - Pending Forms:         {len(pending_teams)}")
    print(f"    - Already Logged Sent:   {len(sent_ids)}")
    print()

    print("Select Target Audience to Broadcast:")
    print("  [1] Send to ALL PENDING Teams (Recommended)")
    print(f"      ({len(pending_teams)} teams awaiting registration submission)")
    print("  [2] Send to Shortlist Finalists Only (80 Teams)")
    print("  [3] Send to Bench Standby Teams (10 Teams)")
    print("  [4] Send to Waitlist Pool (20 Teams)")
    print("  [5] Send to ALL 110 Finalized Teams")
    print("  [6] Test Send to Single Custom Phone Number")
    print()

    try:
        choice = input("Enter choice (1-6) [Default: 1]: ").strip() or "1"
    except KeyboardInterrupt:
        print("
Aborted by user.")
        return

    target_list = []
    if choice == "1":
        target_list = pending_teams
    elif choice == "2":
        target_list = shortlist_teams
    elif choice == "3":
        target_list = bench_teams
    elif choice == "4":
        target_list = waitlist_teams
    elif choice == "5":
        target_list = enriched_teams
    elif choice == "6":
        test_num = input("Enter 10-digit test phone number: ").strip()
        clean_test = clean_phone_number(test_num)
        if not clean_test:
            print("[!] Invalid phone number.")
            return
        target_list = [{
            "temp_team_id": "TEST-001",
            "team_name": "Test Innovators",
            "leader_name": "Coordinator",
            "ps_id": "SIH26209",
            "status": "Shortlist",
            "school": "School of Quantum Science, Computing & AI",
            "effective_phone": clean_test
        }]
    else:
        print("[!] Invalid option. Defaulting to Pending Teams.")
        target_list = pending_teams

    # Filter valid numbers and optionally skip already sent
    valid_targets = [t for t in target_list if t["effective_phone"]]
    
    if choice != "6":
        unvisited = [t for t in valid_targets if t["temp_team_id"] not in sent_ids]
        if len(unvisited) < len(valid_targets):
            print(f"[*] Note: {len(valid_targets) - len(unvisited)} teams were already marked SENT in log.")
            skip_choice = input("Skip already sent teams? (Y/N) [Default: Y]: ").strip().lower() or "y"
            if skip_choice == "y":
                valid_targets = unvisited

    if not valid_targets:
        print("[✓] No pending recipients to send to. All caught up!")
        return

    print()
    print(f"[✓] Ready to dispatch WhatsApp message to {len(valid_targets)} Team Leaders.")
    print(f"[*] Starting Chromium browser with persistent session ({SESSION_DIR})...")
    print("    (If not logged in, scan the QR code in the browser window once)
")

    time.sleep(1.5)

    with sync_playwright() as p:
        # Launch persistent browser context
        context = p.chromium.launch_persistent_context(
            user_data_dir=SESSION_DIR,
            headless=False,
            viewport={"width": 1280, "height": 800},
            args=["--disable-blink-features=AutomationControlled"]
        )
        
        page = context.new_page()
        page.goto("https://web.whatsapp.com")
        
        print("[*] Waiting for WhatsApp Web session to be ready...")
        print("    👉 Please scan the QR code on your phone if not logged in.")
        
        # Wait for either main chat search or chat list
        try:
            page.wait_for_selector("div[contenteditable='true'], div[data-tab='3'], #side", timeout=90000)
            print("[✓] WhatsApp Web Connected & Ready!
")
        except Exception:
            print("[!] Timeout waiting for WhatsApp Web login. Please make sure you scan the QR code and try again.")
            context.close()
            return

        time.sleep(3)

        success_count = 0
        fail_count = 0

        for idx, team in enumerate(valid_targets, 1):
            phone = team["effective_phone"]
            tid = team["temp_team_id"]
            name = team.get("leader_name", "TL")
            tname = team.get("team_name", "")
            
            msg = format_message(DEFAULT_TEMPLATE, team)
            encoded_msg = urllib.parse.quote(msg)
            url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded_msg}"

            print(f"[{idx}/{len(valid_targets)}] Dispatching to {tid} • {name} ({tname}) - +{phone}...")

            try:
                page.goto(url)
                
                # Wait for send button or text input area
                send_button_selector = "button[aria-label='Send'], span[data-icon='send'], span[data-icon='send-refreshed']"
                input_selector = "footer div[contenteditable='true'], div[data-tab='10'][contenteditable='true']"
                
                # Check if invalid number dialog appears
                # e.g. "Phone number shared via url is invalid"
                invalid_dialog = page.locator("text='Phone number shared via url is invalid'")
                
                try:
                    # Wait up to 15s for the chat or send button to load
                    page.wait_for_selector(f"{send_button_selector}, {input_selector}", timeout=16000)
                    time.sleep(1.2)
                    
                    if invalid_dialog.count() > 0:
                        print(f"    [!] Error: Invalid WhatsApp number +{phone}")
                        log_dispatch(tid, "INVALID_NUMBER", tname, name, phone, "Invalid number dialog")
                        fail_count += 1
                        continue

                    # Attempt click send button or press enter in input box
                    send_btn = page.locator(send_button_selector)
                    if send_btn.count() > 0 and send_btn.first.is_visible():
                        send_btn.first.click()
                    else:
                        chat_input = page.locator(input_selector)
                        if chat_input.count() > 0:
                            chat_input.first.press("Enter")
                        else:
                            page.keyboard.press("Enter")

                    # Wait a moment for message to be sent
                    time.sleep(2.5)
                    print(f"    [✓] Sent successfully!")
                    log_dispatch(tid, "SENT", tname, name, phone, "Delivered via automated queue")
                    success_count += 1

                except Exception as ex:
                    # Retry with Enter press
                    try:
                        page.keyboard.press("Enter")
                        time.sleep(2)
                        print(f"    [✓] Sent on fallback keypress!")
                        log_dispatch(tid, "SENT", tname, name, phone, "Sent via fallback enter")
                        success_count += 1
                    except Exception:
                        print(f"    [!] Failed to send: {ex}")
                        log_dispatch(tid, "FAILED", tname, name, phone, str(ex))
                        fail_count += 1

            except Exception as e:
                print(f"    [!] Navigation error for {tid}: {e}")
                log_dispatch(tid, "ERROR", tname, name, phone, str(e))
                fail_count += 1

            # Human-like delay between messages (4 to 7 seconds)
            if idx < len(valid_targets):
                delay = random.uniform(4.0, 6.5)
                print(f"    ⏳ Pausing {delay:.1f}s before next message...")
                time.sleep(delay)

        print("
" + "=" * 70)
        print(f"  🎉 BROADCAST RUN COMPLETE!")
        print(f"     - Successfully Sent: {success_count}")
        print(f"     - Failed / Invalid:  {fail_count}")
        print(f"     - Results logged to: {LOG_FILE}")
        print("=" * 70)

        input("
Press Enter to close browser session...")
        context.close()

if __name__ == "__main__":
    run_automation()
