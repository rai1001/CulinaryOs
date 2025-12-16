
import asyncio
from playwright.async_api import async_playwright, expect

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            print("Navigating to app...")
            await page.goto("http://localhost:5173")
            await page.wait_for_load_state("networkidle")

            # 1. Create Recipe
            print("Navigating to Recipes...")
            # Use strict locator for sidebar links
            await page.click('button:has-text("Recetas")')

            print("Clicking New Recipe...")
            await page.click("text=Nueva Receta")

            print("Waiting for modal...")
            await page.wait_for_selector("text=Añadir Receta")

            print("Creating Recipe...")
            # Target the first input inside the form.
            await page.locator('form input').first.fill("Tortilla Test")

            # Select Station
            await page.locator('form select').first.select_option("hot")

            await page.click("text=Guardar Receta")
            print("Recipe Created.")

            # 2. Create Menu (Via Data View)
            print("Navigating to Data View...")
            await page.click('button:has-text("Datos")')
            await page.wait_for_load_state("networkidle")

            print("Switching to Menus Tab...")
            await page.click('button:has-text("Menús")')

            print("Clicking Add New Menu...")
            await page.wait_for_selector("text=Añadir Nuevo")
            await page.click("text=Añadir Nuevo")

            print("Waiting for Menu Modal...")
            await page.wait_for_selector("text=Añadir Menú")

            print("Creating Menu...")
            # Fill Menu Form
            await page.locator('form input').first.fill("Menu Test")
            await page.locator('form input[type="number"]').first.fill("25")
            await page.locator('label:has-text("Tortilla Test") input[type="checkbox"]').check()
            await page.click("text=Guardar Menú")
            print("Menu Created.")

            # 3. Create Event
            print("Navigating to Production...")
            # Avoid clicking the section header "PRODUCCIÓN"
            await page.click('button:has-text("Producción")')

            print("Creating Event...")
            await page.wait_for_selector('input[placeholder="Nombre del Evento"]')
            await page.fill('input[placeholder="Nombre del Evento"]', "Boda Test")
            await page.fill('input[placeholder="PAX"]', "100")

            # Select Menu
            await page.wait_for_timeout(500)
            await page.select_option('select', label="Menu Test")

            await page.click("button:has-text('Crear Evento')")
            print("Event Created.")

            # 4. Production Kanban
            print("Selecting Event...")
            await page.wait_for_selector('div:has-text("Boda Test")')
            # Click the event card (it might be the only one, or top one)
            await page.click('div:has-text("Boda Test") >> text=Boda Test')

            print("Switching to Kanban Tab...")
            await page.click("text=Tablero Kanban")

            print("Generating Tasks...")
            await page.click("text=Generar Tareas del Menú")

            print("Verifying Tasks...")
            await expect(page.locator("text=Tortilla Test").first).to_be_visible()

            print("SUCCESS: Kanban flow verified.")
            await page.screenshot(path="kanban_success.png")

        except Exception as e:
            print(f"FAILED: {e}")
            await page.screenshot(path="kanban_failure.png")
            raise e

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
