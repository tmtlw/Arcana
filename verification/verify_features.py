
from playwright.sync_api import sync_playwright, expect
import time

def verify_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use larger viewport to see menus
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:3000")

            # Wait for app to load
            print("Waiting for app load...")
            # Using partial text match for Guest Login
            page.wait_for_selector("button:has-text('Vendég Bejelentkezés')", timeout=10000)

            # Login as Guest
            print("Logging in...")
            page.click("button:has-text('Vendég Bejelentkezés')")

            # Wait for dashboard
            page.wait_for_selector("text=ARKÁNUM", timeout=10000)
            print("Dashboard loaded.")

            # 1. Verify Analysis View (Elemzés)
            print("Navigating to Analysis...")
            # Finding menu button - it is the hamburger menu on the right
            # In desktop view (1280px), the menu might be different or same.
            # Based on App.tsx, menu is always hamburger.
            # There are 2 buttons in header. 1st is Notification, 2nd is Hamburger.

            # Click hamburger menu (2nd button in header div)
            # The header is inside <header>, we can scope.
            page.locator("header button").nth(1).click()

            # Wait for menu animation
            time.sleep(1)

            # Click "Elemzés"
            print("Clicking Elemzés...")
            page.click("text=Elemzés")
            time.sleep(1)

            # Check for tabs
            print("Checking Analysis Tabs...")
            # Verify we are on Analysis view
            expect(page.get_by_text("Statisztika")).to_be_visible()
            expect(page.get_by_text("Számmisztika")).to_be_visible()
            expect(page.get_by_text("Lelki Iránytű")).to_be_visible()

            page.screenshot(path="verification/analysis_view.png")
            print("Analysis view verified.")

            # 2. Verify Marketplace
            print("Navigating to Marketplace...")
            page.locator("header button").nth(1).click() # Open menu again
            time.sleep(1)

            print("Clicking Piactér...")
            page.click("text=Piactér (Bolt)")
            time.sleep(1)

            # Check for title
            expect(page.get_by_text("Misztikus Piactér")).to_be_visible()
            # Check for items
            expect(page.get_by_text("Rider-Waite (Klasszikus)")).to_be_visible()

            # Check balance (User starts with 0 XP/Currency usually, but might have gained some if cloud loaded)
            # Just check if 'Egyenleg' is visible
            expect(page.get_by_text("Egyenleg")).to_be_visible()

            page.screenshot(path="verification/marketplace_view.png")
            print("Marketplace verified.")

            # 3. Verify Admin Dashboard (if possible)
            # Since guest user is not admin, we can't verify Admin Dashboard toggle directly.
            # But we can verify that Admin Pult button is NOT visible or check logic if we could mock admin.
            # For now, UI verification of new user features is sufficient.

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_retry.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_features()
