
import os
import shutil
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
INBOX_DIR = BASE_DIR / "99_Inbox"
FAMILY_DIR = BASE_DIR / "02_Family"

def scan_and_sort():
    print(f"🕵️  Scanning Inbox: {INBOX_DIR}...")
    
    if not INBOX_DIR.exists():
        print("Inbox directory missing.")
        return

    files = [f for f in INBOX_DIR.iterdir() if f.is_file() and not f.name.startswith('.')]
    
    if not files:
        print("Inbox is empty.")
        return

    # Get valid users
    users = [d.name for d in FAMILY_DIR.iterdir() if d.is_dir()]
    print(f"Found Users: {users}")

    for file_path in files:
        filename = file_path.name
        moved = False
        
        # Rule 1: Match User Name (Case Insensitive)
        for user in users:
            if user.lower() in filename.lower():
                target_dir = FAMILY_DIR / user / "Archives"
                target_dir.mkdir(exist_ok=True)
                
                destination = target_dir / filename
                shutil.move(str(file_path), str(destination))
                print(f"✅ Moved '{filename}' -> {user}/Archives/")
                moved = True
                break
        
        if not moved:
            print(f"⚠️  Could not identify owner for '{filename}'. Remained in Inbox.")

if __name__ == "__main__":
    scan_and_sort()
