
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    print("Navigating to app...")
    page.goto("http://localhost:8000")

    # Login
    try:
        page.wait_for_selector("text=Vendég Bejelentkezés", timeout=5000)
        page.click("text=Vendég Bejelentkezés")
        print("Clicked Guest Login")
    except:
        print("Login screen skipped or different.")

    # Wait for Dashboard
    try:
        page.wait_for_selector("text=Üdvözöllek", timeout=10000) # Assuming "Üdvözöllek" in dashboard
        print("Dashboard loaded.")
    except:
        print("Dashboard wait timeout. Taking screenshot.")
        page.screenshot(path="verification/debug_dashboard.png")

    # 1. Check Deck Builder Price Input
    print("Checking Deck Builder...")
    # Navigate: Beállítások -> Pakli Műhely
    try:
        # Assuming menu is visible or hamburger. Desktop view usually has sidebar/topbar.
        # Look for "Beállítások" (Settings)
        # If menu is collapsed (mobile), might need to open it. But viewport is 1280.

        # Try to find "Beállítások"
        page.click("text=Beállítások", timeout=3000)
        page.wait_for_timeout(1000)

        # Look for "Pakli Műhely"
        page.click("text=Pakli Műhely")
        page.wait_for_timeout(1000)

        # Check input
        if page.get_by_text("Ár (Pont)").is_visible():
            print("Deck Builder Price Input verified.")
            page.screenshot(path="verification/deck_builder_price.png")
        else:
            print("Deck Builder Price Input NOT found.")
            page.screenshot(path="verification/deck_builder_fail.png")

        # Go back to home/dashboard
        page.click("text=Vissza") # or navigate home
        page.wait_for_timeout(500)
        page.click("text=Főoldal") # Assuming Home button or similar
        page.wait_for_timeout(500)

    except Exception as e:
        print(f"Could not verify Deck Builder: {e}")
        page.screenshot(path="verification/debug_settings.png")

    # 2. Check Spread Builder Price Input
    print("Checking Spread Builder...")
    # Navigate: Kártyavetés -> Tervező (or similar)
    try:
        # If "Kártyavetés" is a menu item
        page.click("text=Kártyavetés", timeout=3000)
        page.wait_for_timeout(500)

        # Look for "Tervező"
        page.click("text=Tervező")
        page.wait_for_timeout(1000)

        # Check input
        if page.get_by_text("Ár (Pont)").is_visible():
            print("Spread Builder Price Input verified.")
            page.screenshot(path="verification/spread_builder_price.png")
        else:
             # Try checking if it's "Eladási Ár" (Lesson builder used that, Spread used "Ár (Pont)")
            print("Spread Builder Price Input NOT found.")
            page.screenshot(path="verification/spread_builder_fail.png")

    except Exception as e:
        print(f"Could not verify Spread Builder: {e}")
        page.screenshot(path="verification/debug_spread.png")

    # 3. Marketplace
    print("Checking Marketplace...")
    try:
        # It might be hidden if not enabled.
        if page.get_by_text("Piactér").is_visible():
            page.click("text=Piactér")
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/marketplace_view.png")
            print("Marketplace screenshot taken.")
        else:
            print("Marketplace button not visible (Feature toggle?).")
    except:
        pass

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
