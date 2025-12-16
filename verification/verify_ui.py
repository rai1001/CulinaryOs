from playwright.sync_api import sync_playwright, expect
import time

def verify_production_ui(page):
    print("Navigating to Production...")
    # Use specific locator for the button to avoid matching the section header
    page.locator("button:has-text('Producción')").click()

    # Wait for view to load
    time.sleep(1)

    # Verify Empty State
    print("Verifying Empty State in Production...")
    # The text "Ningún evento seleccionado" should be visible when no event is selected
    # This acts as verification that we are in Production view and the EmptyState component works
    expect(page.locator("text=Ningún evento seleccionado")).to_be_visible(timeout=5000)
    print("SUCCESS: Production Empty State verified.")

def verify_events_ui(page):
    print("Navigating to Events...")
    page.locator("button:has-text('Eventos')").click()

    # Wait for view to load
    time.sleep(1)

    # Verify Elements
    print("Verifying Events UI...")
    expect(page.locator("text=Events Calendar")).to_be_visible()
    expect(page.locator("text=Importar Excel")).to_be_visible()

    # Verify Month Navigation is present (indirectly verifies component mounted)
    expect(page.locator(".lucide-chevron-left")).to_be_visible()
    print("SUCCESS: Events UI verified.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Loading app...")
            page.goto("http://localhost:5173/")

            # Wait for initial load
            page.wait_for_selector("text=ChefOS", timeout=10000)

            verify_production_ui(page)
            verify_events_ui(page)

            print("\nALL CHECKS PASSED")

        except Exception as e:
            print(f"\nFAILED: {e}")
            page.screenshot(path="verification/failed_verification.png")
            print("Screenshot saved to verification/failed_verification.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    main()
