
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto("http://127.0.0.1:8085/")
            await page.get_by_role("button", name="L-Gauche").click()
            await page.screenshot(path="l-shape-fix.png")
        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

asyncio.run(main())
