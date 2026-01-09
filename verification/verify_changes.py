
from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()

        # 1. Load the app
        print("Navigating to app...")
        page.goto("http://localhost:8080/index.html")

        # Increase timeout for loading
        page.wait_for_selector("text=ARKÁNUM", timeout=10000)

        # Mock user and settings in localStorage to enable features and login
        print("Injecting local storage state...")
        page.evaluate("""() => {
            const user = {
                id: 'test_user',
                name: 'Test Látnok',
                isAdmin: true,
                folders: ['TesztMappa'],
                themePreference: 'mystic',
                level: 5
            };
            const settings = {
                enableGeminiSpreadImport: true,
                geminiApiKey: 'mock_key'
            };
            const reading = {
                id: 'test_reading',
                userId: 'test_user',
                date: new Date().toISOString(),
                spreadId: 'celtic_cross',
                cards: [
                    { positionId: 1, cardId: 'c01', isReversed: false },
                    { positionId: 2, cardId: 'c02', isReversed: true }
                ],
                question: 'Teszt kérdés?',
                notes: 'Ez egy teszt jegyzet.',
                mood: 'calm',
                isPublic: false
            };

            localStorage.setItem('tarot_user', JSON.stringify(user));
            localStorage.setItem('tarot_settings', JSON.stringify(settings));
            localStorage.setItem('tarot_readings', JSON.stringify([reading]));
        }""")

        page.reload()
        # Wait for menu button to be visible (or desktop menu)
        page.wait_for_selector("text=ARKÁNUM", timeout=10000)

        # 2. Check Custom Spread Builder (AI Feature)
        print("Checking Custom Spread Builder AI button...")

        # Open Menu if needed (Mobile/Desktop logic might vary)
        # Assuming desktop view based on viewport, but button 'text=Eszközök' might be inside the hamburger menu if screen is small?
        # App.tsx shows menuGroups are inside the mega menu which is hidden by default unless menu is open.

        # Open Menu
        if page.is_visible("svg >> nth=0"): # Menu icon logic might be tricky, try button
             menu_btns = page.query_selector_all("button")
             # The hamburger button has Menu icon
             # Let's try to click the hamburger button if the menu is not visible.
             # In App.tsx: onClick={() => setIsMenuOpen(!isMenuOpen)}

             # But wait, desktop menu might be different?
             # "mega menu" style is used.
             # It seems the menu is ALWAYS hidden behind the hamburger button in this App.tsx design:
             # <button onClick={() => setIsMenuOpen(!isMenuOpen)} ...>

        # Click the hamburger menu (it has an SVG icon, hard to target by text)
        # It is in the header, right side.
        # Let's target the button that contains the menu icon.
        page.click("header button:has(svg)")
        page.wait_for_timeout(500)

        # Now menu should be open
        page.click("text=Kirakás Tervező") # Navigate
        page.wait_for_timeout(1000)

        # Verify "Kirakás Importálása Képről (AI)" is visible
        if page.is_visible("text=Kirakás Importálása Képről (AI)"):
            print("SUCCESS: AI Spread Import button is visible.")
        else:
            print("FAILURE: AI Spread Import button is NOT visible.")

        page.screenshot(path="verification/spread_builder.png")

        # 3. Check Community View (Saved Info)
        print("Checking Community View...")
        page.click("header button:has(svg)")  # Open Menu
        page.wait_for_timeout(500)
        page.click("text=Faliújság")
        page.wait_for_timeout(2000)

        # 4. Check Profile View (Private readings scope & Lock icon)
        print("Checking Profile View...")
        page.click("header button:has(svg)")  # Open Menu
        page.wait_for_timeout(500)
        page.click("text=Profil")
        page.wait_for_timeout(2000)

        # Check if 'Összes Húzás' is visible (changed from Publikus Húzások for owner)
        if page.is_visible("text=Összes Húzás"):
             print("SUCCESS: Profile header shows 'Összes Húzás'.")
        else:
             print("FAILURE: Profile header incorrect.")

        # Check for Private Lock icon on the reading card
        # The reading injected is private.
        # Lock icon is title="Privát" or text="🔒"
        if page.is_visible("text=🔒"):
             print("SUCCESS: Private lock icon visible.")

        page.screenshot(path="verification/profile_private_readings.png")

        # 5. Check Reading Edit in History
        print("Checking History/Reading Edit...")
        page.click("header button:has(svg)")  # Open Menu
        page.wait_for_timeout(500)
        page.click("text=Előzmények") # History
        page.wait_for_timeout(2000)

        # Find the reading and click 'Szerkesztés' (or the pencil icon area)
        if page.is_visible("text=Kattints ide, hogy leírd"):
            page.click("text=Kattints ide, hogy leírd")
            page.wait_for_timeout(500)

            # Check if Title/Question input is visible
            if page.is_visible("placeholder=Mi volt a kérdés?"):
                print("SUCCESS: Question edit input is visible.")
            else:
                print("FAILURE: Question edit input missing.")

            page.screenshot(path="verification/history_edit.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
