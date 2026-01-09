
from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # 1. Visit the app
        print("Loading app...")
        page.goto("http://localhost:8000")

        # Wait for app to load
        page.wait_for_selector("text=Misztikus Tarot Napló")

        # 2. Mock Global Settings in localStorage or by injecting script?
        # Easier to just look for the Auth View first.
        # Default state: globalSettings is empty.
        # Check if Registration button exists (default is yes).

        print("Checking Auth View...")
        page.screenshot(path="auth_view_default.png")

        # 3. We cannot easily login as admin without seeding DB or mocking authentication.
        # But we can try to access the Custom Spread Builder directly?
        # It's likely protected or hidden.
        # However, based on the code, `CustomSpreadBuilder` is rendered inside `App.tsx` when `view === 'customSpread'`.
        # And `App.tsx` usually requires a user.
        # Guest login is available!

        print("Attempting Guest Login...")
        page.click("text=Vendég Bejelentkezés")

        # Wait for main dashboard
        page.wait_for_selector("text=Mai Húzás", timeout=10000)
        print("Logged in as Guest.")

        # 4. Navigate to Custom Spread Builder
        # Need to find the button/link. Usually in the navigation or dashboard.
        # Dashboard usually has Quick Actions.

        # Try to find "Egyéni Kirakás" or similar.
        # If not visible, we can try to force the view state via console?
        # React state is hard to touch.
        # Let's look for the button.

        # Based on previous context, `App.tsx` renders `Dashboard`.
        # Dashboard has buttons.
        try:
            page.click("text=Új Kirakás Tervezése", timeout=3000)
        except:
            print("Button not found directly, looking for menu...")
            # Maybe sidebar?
            # Let's take a screenshot of dashboard
            page.screenshot(path="dashboard_guest.png")

            # Try to click "Kirakások" then "Tervező" if it exists.
            # Or "Egyéni"

            # Attempt to click anything that looks like Custom Spread
            # "Tervező"
            try:
                 page.click("text=Tervező")
            except:
                 print("Could not find Tervező button.")

        # If we managed to get to builder:
        # The AI button only shows if `enableGeminiSpreadImport` is true.
        # Since we just started fresh, globalSettings is likely empty or fetched from empty DB.
        # Default empty object -> undefined -> false-ish.
        # So button might NOT be there.

        page.screenshot(path="builder_view.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
