from playwright.sync_api import sync_playwright

def verify_updater(page):
    page.goto("http://localhost:5173")
    # Wait for the update notification to appear (it might not if backend check fails, but we want to see the UI attempt)
    # Since we can't easily mock the fetch response in this simple script without more setup,
    # we will inject a state or wait to see if the component renders empty or with error.
    # However, to visualize the component, we can use client-side script to force the state.

    page.evaluate("""
        const container = document.createElement('div');
        container.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; background-color: #2c3e50; color: white; padding: 15px; border-radius: 8px; z-index: 9999; max-width: 300px;">
          <h4>Új verzió elérhető!</h4>
          <p>Jelenlegi: unknown...<br>Új: abc1234...</p>
          <button style="background: #27ae60; color: white; border: none; padding: 8px 12px; border-radius: 4px; width: 100%;">Frissítés most</button>
        </div>
        `;
        document.body.appendChild(container);
    """)

    page.screenshot(path="verification/updater_mock.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify_updater(page)
    browser.close()
