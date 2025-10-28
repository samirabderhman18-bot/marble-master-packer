from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://127.0.0.1:8083/")

    # Click the "L-Gauche" button to add an L-shaped piece
    l_shape_button = page.get_by_role("button", name="L-Gauche")
    expect(l_shape_button).to_be_visible()
    l_shape_button.click()

    # The piece is added directly, so we don't need to fill a form and click "Ajouter".
    # The piece is now on the canvas.

    # Take a screenshot of the canvas
    page.screenshot(path="jules-scratch/verification/l-shape-fix.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
