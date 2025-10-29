from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    time.sleep(15)
    page.goto("http://127.0.0.1:8080/")

    # Add a rectangle
    page.click("text=Rectangle")

    # Zoom in
    page.click("button:has-text('ZoomIn')")

    # Run optimization
    page.click("text=Lancer l'Optimisation")

    # Wait for the optimization to complete
    time.sleep(2)

    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
