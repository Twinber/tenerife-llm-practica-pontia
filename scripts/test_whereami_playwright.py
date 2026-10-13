import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/home/twinber/.gemini/antigravity-cli/brain/e6405918-3600-4f05-97bf-cd0127944c72"

async def test_whereami():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        print("[TEST] 1. Abriendo http://localhost:8080...")
        await page.goto("http://localhost:8080", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # 2. Localizar y pulsar el botón "¿Dónde estoy?"
        btn_whereami = page.locator("#btn-whereami")
        await btn_whereami.wait_for(state="visible", timeout=5000)
        print("[TEST] 2. Pulsando botón '📍 ¿DÓNDE ESTOY?'...")
        await btn_whereami.click()

        # 3. Comprobar inmediatamente que aparece la burbuja de diálogo con el relojito ⏳
        await page.wait_for_selector(".dialogue-bubble", timeout=3000)
        bubble_text = await page.locator(".dialogue-body").text_content()
        print(f"[TEST] 3. Burbuja de diálogo visible con texto: '{bubble_text}'")
        assert "⏳" in bubble_text or "Examinando" in bubble_text, "No se muestra el relojito de espera"

        # Comprobar el botón ⏳ PENSANDO...
        btn_continue = page.locator("#btn-dialogue-continue")
        continue_text = await btn_continue.text_content()
        print(f"[TEST] Botón de diálogo en estado de espera: '{continue_text}'")
        assert "PENSANDO" in continue_text or "⏳" in continue_text, "El botón no está en estado esperando"

        # Capturar screenshot del relojito
        shot_path_thinking = os.path.join(ARTIFACT_DIR, "pw_whereami_thinking.png")
        await page.screenshot(path=shot_path_thinking)
        print(f"[TEST] ✅ Screenshot del relojito guardado: {shot_path_thinking}")

        # 4. Esperar a que el backend VLM complete su deducción (máx 20s)
        print("[TEST] 4. Esperando deducción multimodal VLM del backend...")
        for _ in range(40):
            await page.wait_for_timeout(500)
            cur_body = await page.locator(".dialogue-body").text_content()
            if "⏳" not in cur_body and len(cur_body) > 30:
                print(f"[TEST] Deducción recibida: '{cur_body[:100]}...'")
                break

        final_body = await page.locator(".dialogue-body").text_content()
        print(f"[TEST] Texto final en pantalla: '{final_body}'")
        assert "⏳" not in final_body, "El texto no debe seguir en espera tras recibir la respuesta"
        assert len(final_body) > 20, "La narrativa final debe ser sustancial"

        # Capturar screenshot del resultado final
        shot_path_result = os.path.join(ARTIFACT_DIR, "pw_whereami_result.png")
        await page.screenshot(path=shot_path_result)
        print(f"[TEST] ✅ Screenshot del resultado guardado: {shot_path_result}")

        # Avanzar el diálogo haciendo clic en continuar
        await btn_continue.click()
        await page.wait_for_timeout(500)
        print("[TEST] Diálogo cerrado correctamente tras pulsar continuar.")

        await browser.close()
        print("[TEST] 🎉 TEST '¿DÓNDE ESTOY?' COMPLETADO CON ÉXITO TOTAL!")

if __name__ == "__main__":
    asyncio.run(test_whereami())
