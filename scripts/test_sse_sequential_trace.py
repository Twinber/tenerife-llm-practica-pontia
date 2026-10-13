import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/home/twinber/.gemini/antigravity-cli/brain/e6405918-3600-4f05-97bf-cd0127944c72"

async def run_test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        print("[TEST] 1. Cargando http://localhost:8080...")
        await page.goto("http://localhost:8080", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Iniciar diálogo con Paco directamente
        print("[TEST] 2. Iniciando conversación con Paco el Pescador...")
        await page.evaluate("() => window.__twinber.actionDispatcher.talkToPaco()")
        await page.wait_for_timeout(600)

        # Saltar saludo inicial (1º clic completa el tipeo, 2º clic avanza y cierra la frase de saludo)
        btn_continue = page.locator("#btn-dialogue-continue")
        await btn_continue.click()
        await page.wait_for_timeout(300)
        if await btn_continue.is_visible():
            await btn_continue.click()
            await page.wait_for_timeout(500)

        # Esperar a que el dock de diálogo esté listo y visible
        print("[TEST] 2b. Esperando que las opciones de diálogo estén visibles...")
        await page.wait_for_function("() => !window.__twinber.actionDispatcher.isDialogueSpeaking")

        btn_lore = page.locator('button[data-choice="lore"]')
        await btn_lore.wait_for(state="visible", timeout=5000)
        print("[TEST] 3. Pulsando opción '2. ¿Qué me puedes contar de esta zona?'...")
        await btn_lore.click()

        # Esperar a que comiencen a llegar pasos SSE en tiempo real
        print("[TEST] 4. Esperando recepción secuencial de eventos SSE...")
        step_line = page.locator(".agent-log-step-line")
        await step_line.first.wait_for(state="visible", timeout=10000)
        print("[TEST] ✅ Primer evento SSE recibido y renderizado en pantalla!")

        # Esperar un poco a que lleguen más pasos y tomar screenshot en vivo
        await page.wait_for_timeout(1200)
        count_mid = await step_line.count()
        print(f"[TEST] Pasos SSE recibidos hasta ahora: {count_mid}")

        mid_shot_path = os.path.join(ARTIFACT_DIR, "pw_sse_steps_mid.png")
        await page.screenshot(path=mid_shot_path)
        print(f"[TEST] 📸 Captura intermedia guardada: {mid_shot_path}")

        # Esperar a que termine todo el streaming y el botón pase a listo
        print("[TEST] 5. Esperando que finalice la generación narrativa...")
        for _ in range(40):
            await page.wait_for_timeout(500)
            btn_class = await btn_continue.get_attribute("class") or ""
            if "ready" in btn_class or "CONTINUAR" in (await btn_continue.text_content() or ""):
                print("[TEST] ✅ Respuesta completa generada y lista.")
                break

        total_steps = await step_line.count()
        print(f"[TEST] Total de pasos secuenciales registrados: {total_steps}")
        for i in range(total_steps):
            badge_txt = await step_line.nth(i).locator(".step-badge").text_content()
            content_txt = await step_line.nth(i).locator(".step-content").text_content()
            print(f"  - Paso #{i+1}: {badge_txt} -> {content_txt}")

        final_body = await page.locator(".dialogue-body").text_content()
        print(f"[TEST] Narrativa final recibida: '{final_body[:120]}...'")

        final_shot_path = os.path.join(ARTIFACT_DIR, "pw_sse_steps_final.png")
        await page.screenshot(path=final_shot_path)
        print(f"[TEST] 📸 Captura final guardada: {final_shot_path}")

        # Abrir el primer detalle JSON para verificar interactividad
        first_details = page.locator(".step-details-toggle summary").first
        if await first_details.count() > 0:
            await first_details.click()
            await page.wait_for_timeout(300)
            details_shot_path = os.path.join(ARTIFACT_DIR, "pw_sse_details_open.png")
            await page.screenshot(path=details_shot_path)
            print(f"[TEST] 📸 Captura con detalles RAG desplegados guardada: {details_shot_path}")

        await browser.close()
        print("[TEST] 🎉 TEST COMPLETADO CON ÉXITO!")

if __name__ == "__main__":
    asyncio.run(run_test())
