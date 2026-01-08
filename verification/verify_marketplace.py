
import os
import time
from playwright.sync_api import sync_playwright, expect

def verify_marketplaces(page):
    # 1. Navigate to the app (assuming localhost:5173 based on npm run dev output)
    # The app takes a while to boot due to the custom loader mechanism
    page.goto("http://localhost:5173", timeout=60000)

    # Wait for the "boot" sequence (spinners etc)
    # The main page usually has a "Bejelentkezés" or "Vendég mód" button or directly dashboard
    # Let's wait for something stable.

    print("Waiting for app to load...")
    # Try to find a known element on the landing/dashboard.
    # Based on memory, there might be a "Vendégként folytatom" button if not logged in.

    try:
        # Wait for either dashboard or auth view
        page.wait_for_selector('text=Arkánum', timeout=30000)
    except:
        print("Timeout waiting for 'Arkánum' text. Dumping page content.")
        print(page.content())
        raise

    # If we are at Auth screen, click Guest mode if available, or just check if we can see the title
    # Actually, the Community/Marketplace might be accessible.

    # Let's try to find a way to the Marketplace.
    # Usually accessible via the Dashboard.
    # Assuming we land on a Dashboard or can navigate to it.

    # Take a screenshot of the initial state
    page.screenshot(path="verification/step1_loaded.png")

    # If there is a "Vendégként folytatom" button, click it.
    guest_btn = page.get_by_text("Vendégként folytatom")
    if guest_btn.count() > 0:
        guest_btn.click()
        time.sleep(2)

    # Look for "Közösség" or "Piactér" button
    # Based on file structure, there is a CommunityView.
    # We need to find the button that leads there.
    # Often icons or text in the dashboard.

    # Let's try to navigate via URL hash if the router supports it, but this is a custom PHP/React app, might not work.
    # We'll look for text "Közösség"

    print("Looking for Community/Marketplace link...")
    community_link = page.get_by_text("Közösség")
    if community_link.count() > 0:
        community_link.first.click()
    else:
        # Maybe it's an icon? Or "Kirakások"?
        # Let's try finding "Kirakások" directly if it's on the dashboard
        spreads_btn = page.get_by_text("Új Kirakások")
        if spreads_btn.count() > 0:
            spreads_btn.click()
        else:
             print("Could not find direct link. Screenshotting.")
             page.screenshot(path="verification/failed_to_find_link.png")
             # Force fail to check screenshot
             # expect(community_link).to_be_visible()

    time.sleep(2)

    # Assuming we are in Community View, looking for "Kirakások Piactere" button
    spread_market_btn = page.get_by_text("Kirakások")
    if spread_market_btn.count() > 0:
        spread_market_btn.first.click()

    time.sleep(2)

    # Now we should be in CommunitySpreadsView
    # Verify the title "Kirakások Piactere"
    expect(page.get_by_text("Kirakások Piactere")).to_be_visible()

    # Verify we see the new spreads (e.g., "Kapcsolati Tükör")
    # This proves the Spread list update worked
    expect(page.get_by_text("Kapcsolati Tükör")).to_be_visible()

    # Verify Rating System is visible (Stars)
    # The component renders stars as buttons with "★"
    stars = page.locator("button:has-text('★')")
    expect(stars.first).to_be_visible()

    # Verify Comment Section button is visible (chat icon)
    comment_btn = page.locator("button:has-text('💬')")
    expect(comment_btn.first).to_be_visible()

    # Click to expand comments
    comment_btn.first.click()
    time.sleep(1)

    # Verify Comment Section expanded
    expect(page.get_by_text("Hozzászólások")).to_be_visible()
    expect(page.get_by_placeholder("Írj egy hozzászólást...")).to_be_visible()

    # Take final screenshot
    page.screenshot(path="verification/marketplace_verified.png")
    print("Verification successful!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_marketplaces(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()
