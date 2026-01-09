
from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Loading app...")
        page.goto("http://localhost:8000")

        # Check loading
        page.screenshot(path="loading.png")

        # Wait for Auth View
        # It might take a while to load dependencies via bootloader
        try:
             page.wait_for_selector("text=Vendég Bejelentkezés", timeout=60000)
             print("Auth View loaded.")
        except:
             print("Timeout waiting for Auth View.")
             page.screenshot(path="timeout_error.png")
             return

        page.screenshot(path="auth_view.png")

        # Guest Login
        print("Clicking Guest Login...")
        page.click("text=Vendég Bejelentkezés")

        # Wait for dashboard
        # Might see "Mai Húzás" or similar
        try:
            page.wait_for_selector("text=Üdvözöllek", timeout=60000)
        except:
            # Fallback
            page.wait_for_selector(".glass-panel", timeout=60000)

        print("Dashboard loaded.")
        page.screenshot(path="dashboard.png")

        # Try to find "Tervező" button (Custom Spread)
        # It might be in the quick actions (circles/icons) or menu.
        # Assuming the text "Tervező" is visible.

        try:
            print("Looking for spread builder...")
            # If the user has "customSpread" in quick actions, it might be an icon.
            # Let's try to click anything that looks like it.
            # Or use a generic click on text.

            # If not found, we can force URL if routing was standard, but this is React SPA hash routing or state based.
            # Assuming state based.

            # Try finding "Egyéni"
            btn = page.get_by_text("Tervező").first
            if btn.is_visible():
                btn.click()
            else:
                # Try finding an icon?
                # Let's assume there is a button with title "Egyéni Kirakás" or similar
                page.click("text=Tervező")

            page.wait_for_selector("text=Kirakás Tervező", timeout=10000)
            print("Builder loaded.")
            page.screenshot(path="builder.png")

            # Check for AI Button
            if page.is_visible("text=Kirakás Importálása Képről"):
                print("SUCCESS: AI Import Button is visible.")
            else:
                print("FAILURE: AI Import Button NOT visible.")

        except Exception as e:
            print(f"Could not navigate to builder: {e}")
            page.screenshot(path="error_builder.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
