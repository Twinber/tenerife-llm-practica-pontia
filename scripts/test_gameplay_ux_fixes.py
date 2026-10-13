import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/home/twinber/.gemini/antigravity-cli/brain/e6405918-3600-4f05-97bf-cd0127944c72"

async def click_continue_if_visible(page):
    """Hace clic en el botón de continuar si está visible, completando o avanzando la frase."""
    btn = page.locator("#btn-dialogue-continue")
    if await btn.is_visible():
        await btn.click(force=True)
        await page.wait_for_timeout(250)

async def run_test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()
        page.on("console", lambda msg: print(f"[CONSOLE] {msg.text}"))

        print("[TEST] 1. Navegando a http://localhost:8080...")
        await page.goto("http://localhost:8080", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Iniciar diálogo con Paco haciendo clic en su sprite
        print("[TEST] Iniciando conversación con Paco el Pescador...")
        paco_actor = page.locator("#paco-actor")
        await paco_actor.click()
        await page.wait_for_selector(".dialogue-body", timeout=5000)

        # Autocompletar el saludo de Paco
        await click_continue_if_visible(page)
        dialogue_body = await page.locator(".dialogue-body").text_content()
        print(f"[TEST] Diálogo inicial completo: {dialogue_body}")
        assert "Paco" in dialogue_body or "Bienvenido" in dialogue_body

        # Avanzar el saludo para abrir el dock
        await click_continue_if_visible(page)
        await page.wait_for_timeout(500)

        # 2. El dock de diálogo debe estar visible con las opciones
        await page.wait_for_selector("#dock-dialogue:not(.hidden)", timeout=5000)
        print("[TEST] Dock de diálogo visible con opciones.")

        # 3. Elegir opción 2 (Lore de la zona)
        lore_btn = page.locator('[data-choice="lore"]')
        await lore_btn.click(force=True)
        print("[TEST] Opción Lore seleccionada. Verificando estado de relojito ⏳...")

        await page.wait_for_timeout(300)
        # Si Twinber está hablando la pregunta, completarla y avanzar
        cur_text = await page.locator(".dialogue-body").text_content()
        if "Twinber:" in cur_text:
            print(f"[TEST] Twinber preguntando: '{cur_text}'")
            await click_continue_if_visible(page) # autocompleta
            await click_continue_if_visible(page) # avanza a la respuesta

        # Ahora el diálogo debe mostrar la espera del NPC con relojito
        waiting_dialogue = await page.locator(".dialogue-body").text_content()
        waiting_btn = await page.locator("#btn-dialogue-continue").text_content()
        print(f"[TEST] Diálogo en espera: '{waiting_dialogue}' | Botón: '{waiting_btn}'")

        # Tomar captura del relojito pensando
        clock_screenshot = os.path.join(ARTIFACT_DIR, "pw_clock_thinking.png")
        await page.screenshot(path=clock_screenshot)
        print(f"[TEST] Captura de relojito guardada en: {clock_screenshot}")

        # Comprobar que mientras espera, el botón o el diálogo contiene ⏳ o PENSANDO
        assert "⏳" in waiting_dialogue or "⏳" in waiting_btn or "PENSANDO" in waiting_btn

        # Verificar que durante la espera el dock de opciones sigue oculto / bloqueado (.dialogue-speaking)
        dock_classes = await page.locator("#dock-dialogue").get_attribute("class") or ""
        print(f"[TEST] Clases del dock durante la espera: '{dock_classes}'")
        assert "dialogue-speaking" in dock_classes or "hidden" in dock_classes

        # Esperar a que el backend devuelva la respuesta de lore (máximo 25s)
        await page.wait_for_function(
            "() => !document.querySelector('.dialogue-continue-btn.waiting') && !document.querySelector('.dialogue-body').textContent.includes('⏳')",
            timeout=25000
        )
        await click_continue_if_visible(page) # autocompleta teletipo de respuesta
        delivered_text = await page.locator(".dialogue-body").text_content()
        print(f"[TEST] Respuesta de lore recibida del backend: '{delivered_text[:90]}...'")

        # Avanzar el diálogo de lore para volver al dock
        await click_continue_if_visible(page)
        await page.wait_for_timeout(500)

        # 4. Probar opción 1 (Sellado de Pasaporte)
        await page.wait_for_selector('[data-choice="passport"]', timeout=5000)
        passport_btn = page.locator('[data-choice="passport"]')
        await passport_btn.click(force=True)
        print("[TEST] Opción Pasaporte seleccionada.")

        await page.wait_for_timeout(300)
        cur_text = await page.locator(".dialogue-body").text_content()
        if "Twinber:" in cur_text:
            await click_continue_if_visible(page)
            await click_continue_if_visible(page)

        # Esperar a que el backend selle el pasaporte
        await page.wait_for_function(
            "() => !document.querySelector('.dialogue-continue-btn.waiting') && !document.querySelector('.dialogue-body').textContent.includes('⏳')",
            timeout=25000
        )
        await click_continue_if_visible(page)
        passport_response = await page.locator(".dialogue-body").text_content()
        print(f"[TEST] Respuesta de pasaporte recibida: '{passport_response[:90]}...'")

        # Avanzar diálogo de pasaporte
        await click_continue_if_visible(page)
        await page.wait_for_timeout(500)

        # Verificar insignia de pasaporte en la barra lateral
        passport_badge = await page.locator("#sidebar-passport-badge").text_content()
        print(f"[TEST] Badge de pasaporte en HUD: '{passport_badge}'")
        assert "1/10" in passport_badge, f"Esperado 1/10, pero se obtuvo {passport_badge}"

        # 5. Salir del diálogo
        exit_btn = page.locator('[data-choice="exit"]')
        if await exit_btn.is_visible():
            await exit_btn.click(force=True)
            await page.wait_for_timeout(500)
            while await page.locator("#btn-dialogue-continue").is_visible():
                await click_continue_if_visible(page)

        # 6. Probar viaje a La Orotava y transición suave sin ghosting
        print("[TEST] Probando viaje a La Orotava con animación de fade to black...")
        # Abrir el modal del mapa desde la ranura de inventario
        await page.locator('[data-item="Mapa de Tenerife"]').click(force=True)
        await page.wait_for_selector("#island-map-modal:not(.hidden)", timeout=3000)

        # Clic en La Orotava en el mapa
        orotava_pin = page.locator('[data-location-id="la_orotava"]')
        pin_class = await orotava_pin.get_attribute("class")
        print(f"[TEST] Pin La Orotava classes: '{pin_class}'")
        banner = await page.locator("#map-banner-text").text_content()
        print(f"[TEST] Banner inicial mapa: '{banner}'")

        await orotava_pin.dispatch_event('click')
        await page.wait_for_timeout(500)
        banner_after = await page.locator("#map-banner-text").text_content()
        print(f"[TEST] Banner tras click pin: '{banner_after}'")

        # Esperar a que termine la animación de viaje Indiana Jones y el modal se oculte
        await page.wait_for_function("() => document.getElementById('island-map-modal')?.classList.contains('hidden')", timeout=8000)
        # Esperar a que la cortinilla de fade to black termine de desvanecerse
        await page.wait_for_function("() => !document.getElementById('scene-fade-overlay')?.classList.contains('active')", timeout=5000)
        await page.wait_for_timeout(500)

        hud_title = await page.locator(".hud-title").text_content()
        print(f"[TEST] HUD tras viaje: {hud_title}")
        assert "OROTAVA" in hud_title.upper(), f"Esperado 'LA OROTAVA', pero se obtuvo {hud_title}"

        # Verificar que el background es el de La Orotava
        bg_src = await page.locator(".scene-background").get_attribute("src")
        print(f"[TEST] Fondo de escena tras viaje: {bg_src}")
        assert "orotava" in bg_src.lower()

        # Captura de pantalla de La Orotava
        orotava_screenshot = os.path.join(ARTIFACT_DIR, "pw_orotava_transition.png")
        await page.screenshot(path=orotava_screenshot)
        print(f"[TEST] Captura de La Orotava guardada en: {orotava_screenshot}")

        await browser.close()
        print("[TEST] ¡Todos los tests completados con éxito! ✅")

if __name__ == "__main__":
    asyncio.run(run_test())
