
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_layout(page: Page):
    # 1. Open App
    page.goto("http://localhost:8000/index.html")

    # 2. Wait for loading
    page.wait_for_selector("text=Arkánum betöltése", state="detached", timeout=30000)

    # 3. Navigate to Library -> Open First Card
    # Try multiple strategies to find "Könyvtár"

    # Strategy A: Check if we are at Auth screen
    if page.get_by_text("Belépés Vendégként").is_visible():
        print("Logging in as guest...")
        page.get_by_text("Belépés Vendégként").click()

    # Strategy B: Wait for dashboard or nav
    print("Waiting for Könyvtár button...")
    try:
        page.get_by_text("Könyvtár").wait_for(state="visible", timeout=10000)
        page.get_by_text("Könyvtár").click()
    except:
        print("Could not find Könyvtár text, trying to find by href or icon if possible. Taking debug screenshot.")
        page.screenshot(path="/home/jules/verification/debug_home.png")
        raise Exception("Navigation failed")

    print("Navigated to Library.")

    # Click on the first card (Major 0 - The Fool)
    # Use a more generic selector if "A Kezdet" is not immediately visible or dynamic
    # Just click the first element that looks like a card in the grid
    # Assuming the grid has items.

    print("Clicking first card...")
    # Wait for cards to load
    page.wait_for_selector(".grid > div, .grid > button", timeout=5000)
    # Click the first card item. It might be an image or a div with text.
    # Let's try finding by text "0" which is usually the number for the Fool.
    try:
        page.get_by_text("A Kezdet").first.click()
    except:
         # Fallback: Click first child of the grid container
         # This is risky without exact class names, but let's try a visual selector
         page.locator(".grid").first.locator("div, button").first.click()

    print("Card opened.")

    # 4. Enable Edit Mode
    print("Enabling edit mode...")
    page.get_by_text("Szerkesztés").click()

    # 5. Scroll down to the relevant section
    print("Scrolling to sections...")
    # We expect Colors and History side by side.
    colors_header = page.get_by_text("Színek & Hangulat")
    colors_header.scroll_into_view_if_needed()

    # 6. Verify Icon Picker
    print("Opening Icon Picker...")
    # Find "+ Szimbólum" button and click it
    page.get_by_text("+ Szimbólum").click()

    # Verify "Válassz Ikon-t" modal appears
    print("Verifying Modal...")
    expect(page.get_by_text("Válassz Ikon-t")).to_be_visible()

    # Verify Categories (e.g., "Égitestek")
    print("Verifying Categories...")
    expect(page.get_by_text("Égitestek")).to_be_visible()

    # Take screenshot of the Modal + Layout
    page.screenshot(path="/home/jules/verification/layout_and_picker.png")

    # Close Picker
    print("Closing Picker...")
    page.get_by_text("✕").last.click()

    # Take screenshot of the Layout (Colors/History side by side)
    print("Taking final screenshot...")
    page.screenshot(path="/home/jules/verification/layout_main.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        try:
            verify_layout(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
