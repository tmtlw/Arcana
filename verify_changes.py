from playwright.sync_api import sync_playwright, expect

def test_features(page):
    # 1. Login (Guest)
    page.goto("http://localhost:8081")
    page.wait_for_selector("text=Vendég Bejelentkezés")
    page.click("text=Vendég Bejelentkezés")

    # Wait for dashboard
    page.wait_for_selector("text=Üdvözöllek", timeout=10000)

    # 2. Navigate to "Elemzés" (Analysis)
    page.click("button >> text=Elemzés") # Menu item id='analysis' label='Elemzés'

    # Check tabs
    expect(page.locator("text=Statisztika")).to_be_visible()
    expect(page.locator("text=Számmisztika")).to_be_visible()
    expect(page.locator("text=Lelki Iránytű")).to_be_visible()
    expect(page.locator("text=Havi Összesítő")).to_be_visible()

    # 3. Click "Lelki Iránytű" tab
    page.click("text=Lelki Iránytű")

    # Verify Soul Compass content (Element bars, Zodiacs)
    expect(page.locator("text=Elemi Egyensúly")).to_be_visible()
    expect(page.locator("text=Kozmikus Identitás")).to_be_visible()

    # Take screenshot of Soul Compass
    page.screenshot(path="/home/jules/verification/soul_compass.png")

    # 4. Navigate to "Piactér (Bolt)" - This is in "Közösség" menu group but exposed in main menu dropdown
    # We need to open the menu first? No, the mega menu is only on mobile or behind hamburger?
    # The header has a hamburger button.
    # Let's try finding the menu toggle.
    # The menu structure is hidden by default in App.tsx (isMenuOpen state).

    # Open Menu
    page.click("header button >> nth=1") # Assuming second button in header is menu (first is Notification center)
    # Actually, let's look at icons. Close icon vs Menu icon.
    # Button with SVG inside.

    # Let's find button that opens menu.
    # Locator: header button that toggles menu.
    page.locator("header button").last.click()

    # Click "Piactér (Bolt)"
    page.click("text=Piactér (Bolt)")

    # Verify Marketplace
    expect(page.locator("text=Misztikus Piactér")).to_be_visible()
    expect(page.locator("text=Hátterek")).to_be_visible()
    expect(page.locator("text=Hátlapok")).to_be_visible()

    # Take screenshot of Marketplace
    page.screenshot(path="/home/jules/verification/marketplace.png")

    # 5. Navigate to Admin (Mock Admin if possible, or just skip if we can't easily become admin)
    # The guest user is NOT admin.
    # We can try to modify localStorage to make user admin?
    # page.evaluate("localStorage.setItem('tarot_user', JSON.stringify({...JSON.parse(localStorage.getItem('tarot_user')), isAdmin: true}))")
    # page.reload()

    # Let's try injecting admin status
    user_json = page.evaluate("localStorage.getItem('tarot_current_user')")
    if user_json:
        print("User found in storage")
        page.evaluate("""
            const u = JSON.parse(localStorage.getItem('tarot_current_user'));
            u.isAdmin = true;
            localStorage.setItem('tarot_current_user', JSON.stringify(u));
        """)
        page.reload()

        # Open Menu again
        page.locator("header button").last.click()

        # Check for Admin Pult
        if page.is_visible("text=Admin Pult"):
            page.click("text=Admin Pult")

            # Check Marketplace Tab in Admin
            expect(page.locator("text=Piactér Kezelő")).to_be_visible()
            page.click("text=Piactér Kezelő")
            expect(page.locator("text=+ Új Elem")).to_be_visible()

            page.screenshot(path="/home/jules/verification/admin_marketplace.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_features(page)
        except Exception as e:
            print(e)
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
