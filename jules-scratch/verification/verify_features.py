
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://127.0.0.1:8080/")
        page.wait_for_load_state('networkidle')

        # Test drag and drop
        page.click('button:has-text("L-Gauche")')
        time.sleep(2) # Wait for piece to be added
        page.mouse.down(250, 250)
        page.mouse.move(350, 350)
        page.mouse.up(350, 350)
        page.screenshot(path="jules-scratch/verification/drag_and_drop.png")

        # Test camera button
        page.click('button:has-text("Capturer les Mesures")')
        time.sleep(2) # Wait for modal to open
        page.screenshot(path="jules-scratch/verification/camera_modal.png")

        browser.close()

run()
