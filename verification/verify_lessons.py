
from playwright.sync_api import sync_playwright

def verify_lessons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Load app
        page.goto("http://localhost:8080/index.html")

        # Mock user to access lessons (if needed, though basics might be open)
        page.evaluate("""() => {
            const user = { id: 'test', name: 'TestUser', completedLessons: [] };
            localStorage.setItem('tarot_user', JSON.stringify(user));
        }""")
        page.reload()
        page.wait_for_timeout(1000)

        # 2. Navigate to Education (Eszközök -> Tanulás)
        # Assuming there is a menu item. Based on previous memory, it might be in the burger menu.
        # Let's try direct navigation or clicking menu.
        # "Eszközök" group in menu.

        # Open menu
        if page.is_visible("header button:has(svg)"):
             page.click("header button:has(svg)")
             page.wait_for_timeout(500)

        # Click "Tanulás"
        if page.is_visible("text=Tanulás"):
            page.click("text=Tanulás")
            page.wait_for_timeout(1000)

            # 3. Check for new categories/lessons
            # We look for titles we added, e.g. "A Színek Beszéde" or "Az Udvari Kártyák"
            content = page.content()

            found_count = 0
            lessons_to_check = [
                "A Tarot Eredete",
                "A Bolond Útja",
                "Az Udvari Kártyák",
                "Az Idő Mérése",
                "A Színek Beszéde"
            ]

            for title in lessons_to_check:
                if title in content:
                    print(f"SUCCESS: Found lesson '{title}'")
                    found_count += 1
                else:
                    print(f"WARNING: Lesson '{title}' not found on page.")

            page.screenshot(path="verification/lessons_page.png")

            if found_count >= 3:
                print("VERIFICATION PASSED: New lessons are visible.")
            else:
                print("VERIFICATION FAILED: Could not find enough new lessons.")

        else:
            print("FAILURE: Could not find 'Tanulás' menu item.")

        browser.close()

if __name__ == "__main__":
    verify_lessons()
