import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/home/twinber/.gemini/antigravity-cli/brain/e6405918-3600-4f05-97bf-cd0127944c72"

async def test_photos_counter():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        print("[TEST] 1. Abriendo http://localhost:8080...")
        await page.goto("http://localhost:8080", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # 1. Comprobar el badge del inventario lateral
        album_badge = page.locator("#sidebar-album-badge")
        badge_text = (await album_badge.text_content() or "").strip()
        print(f"[TEST] Badge del Álbum en la barra lateral: '{badge_text}'")
        assert "/37" in badge_text, f"El badge debería reflejar /37 pero refleja '{badge_text}'"
        assert "28" not in badge_text, f"El badge no debería reflejar 28: '{badge_text}'"

        # 2. Hacer una consulta de diálogo para verificar que el turno agéntico mantiene /37
        print("[TEST] 2. Interactuando con Paco para disparar sincronización de estado...")
        await page.evaluate("() => window.__twinber.actionDispatcher.talkToPaco()")
        await page.wait_for_timeout(400)

        btn_continue = page.locator("#btn-dialogue-continue")
        await btn_continue.click()
        await page.wait_for_timeout(300)
        if await btn_continue.is_visible():
            await btn_continue.click()
            await page.wait_for_timeout(400)

        badge_text_after = (await album_badge.text_content() or "").strip()
        print(f"[TEST] Badge tras interacción: '{badge_text_after}'")
        assert "/37" in badge_text_after, f"Tras interacción debe ser /37 pero es '{badge_text_after}'"

        # 3. Abrir el modal del Álbum de Fotos haciendo clic en el icono del álbum
        print("[TEST] 3. Abriendo modal del Álbum de Fotos...")
        slot_album = page.locator('.inventory-slot[data-item="Álbum de Fotos"]')
        await slot_album.click()
        await page.wait_for_timeout(400)

        album_counter = page.locator("#album-counter")
        modal_counter_text = (await album_counter.text_content() or "").strip()
        print(f"[TEST] Contador en cabecera del Álbum modal: '{modal_counter_text}'")
        assert "/37" in modal_counter_text, f"Cabecera del modal debe ser /37 pero es '{modal_counter_text}'"

        page_indicator = page.locator("#album-page-indicator")
        indicator_text = (await page_indicator.text_content() or "").strip()
        print(f"[TEST] Indicador de página del Álbum: '{indicator_text}'")
        assert "37" in indicator_text, f"Indicador debe tener 37: '{indicator_text}'"

        # Capturar screenshot del álbum abierto
        shot_path = os.path.join(ARTIFACT_DIR, "pw_photo_album_counter_37.png")
        await page.screenshot(path=shot_path)
        print(f"[TEST] 📸 Captura guardada en: {shot_path}")

        await browser.close()
        print("[TEST] 🎉 TEST CONTADOR DE IMÁGENES XX/37 COMPLETADO CON ÉXITO TOTAL!")

if __name__ == "__main__":
    asyncio.run(test_photos_counter())
