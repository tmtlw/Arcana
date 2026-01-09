
from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Loading app...")
        page.goto("http://localhost:8000")

        try:
             page.wait_for_selector("text=Vendég Bejelentkezés", timeout=60000)
        except:
             print("Timeout waiting for Auth View.")
             return

        # Check Registration Button
        # The button text is "Regisztráció" or similar.
        # It's a button element.
        if page.locator("button", has_text="Regisztráció").is_visible():
             print("SUCCESS: Registration button is visible.")
        else:
             print("FAILURE: Registration button NOT visible.")

        print("Clicking Guest Login...")
        page.click("text=Vendég Bejelentkezés")

        try:
            page.wait_for_selector("text=Üdvözöllek", timeout=60000)
        except:
            page.wait_for_selector(".glass-panel", timeout=60000)

        print("Dashboard loaded.")

        try:
            print("Navigating to builder...")
            # Use force=True to overcome potential overlay/scroll issues
            # Using exact text to avoid ambiguity
            page.click("text=Tervező", force=True)

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
