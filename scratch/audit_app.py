import sys
import os
from playwright.sync_api import sync_playwright

def run_audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Criar contexto com cookies se necessário, mas vamos fazer o login real
        page = browser.new_page()
        
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        
        errors = []
        page.on("pageerror", lambda err: errors.append(f"[Page Error] {err}"))
        
        failed_requests = []
        page.on("requestfailed", lambda req: failed_requests.append(f"[Req Failed] {req.url}: {req.failure.error_text}"))
        
        print("### Iniciando Auditoria ###")
        
        # 1. Login
        print("Acessando login...")
        page.goto("http://localhost:4321/login")
        page.wait_for_load_state("networkidle")
        
        page.fill('input[type="email"]', "renato@starwars1.com.br")
        page.fill('input[type="password"]', "renato1234")
        page.click('button[type="submit"]')
        
        print("Aguardando redirecionamento para dashboard...")
        try:
            page.wait_for_url("**/dashboard", timeout=10000)
            print("Login bem-sucedido!")
        except Exception as e:
            print(f"Falha no login ou redirecionamento: {e}")
            # Se falhou, vamos ver o que tem na página
            page.screenshot(path="artifacts/login_failed.png")
            browser.close()
            return

        pages_to_visit = [
            "/dashboard",
            "/dashboard/gerador",
            "/dashboard/negociacoes",
            "/dashboard/calendario",
            "/dashboard/configuracoes",
            "/dashboard/members"
        ]

        for route in pages_to_visit:
            url = f"http://localhost:4321{route}"
            print(f"\nAuditando: {url}")
            try:
                page.goto(url)
                page.wait_for_load_state("networkidle")
                # Esperar um pouco mais para componentes React/Dynamic
                page.wait_for_timeout(2000)
                
                screenshot_path = f"artifacts/screen_{route.replace('/', '_')}.png"
                if not os.path.exists("artifacts"):
                    os.makedirs("artifacts")
                page.screenshot(path=screenshot_path)
                print(f"Screenshot salva: {screenshot_path}")
                
            except Exception as e:
                print(f"Erro ao acessar {url}: {e}")

        browser.close()
        
        print("\n### Resumo de Logs ###")
        for log in console_logs:
            if "error" in log.lower() or "failed" in log.lower():
                print(log)
        
        print("\n### Resumo de Erros de Página ###")
        for err in errors:
            print(err)
            
        print("\n### Resumo de Requisições Falhas ###")
        for req in failed_requests:
            print(req)

if __name__ == "__main__":
    run_audit()
