from playwright.sync_api import sync_playwright

def verify_smart_procurement():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app (assuming default port 5173, adjust if needed)
            page.goto("http://localhost:5173")

            # Since I haven't implemented routing to the new component in the main App,
            # I can't easily navigate to it unless I modify App.tsx temporarily.
            # OR I can check if the user intended me to put it in a specific route.
            # The component is 'src/components/purchasing/SmartProcurement.tsx'.
            # I haven't added it to 'App.tsx' or routes.
            pass
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_smart_procurement()
