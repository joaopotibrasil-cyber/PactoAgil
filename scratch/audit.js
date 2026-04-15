const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  console.log('--- Iniciando Auditoria (Porta 4322) ---');
  
  try {
    await page.goto('http://localhost:4322/login');
    await page.fill('input[type="email"]', 'renato@starwars1.com.br');
    await page.fill('input[type="password"]', 'renato1234');
    await page.click('button[type="submit"]');
    
    console.log('Aguardando redirecionamento...');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('Login OK!');
    
    const routes = [
      '/dashboard',
      '/dashboard/gerador',
      '/dashboard/negociacoes',
      '/dashboard/calendario',
      '/dashboard/configuracoes',
      '/dashboard/members'
    ];
    
    for (const route of routes) {
      console.log(`\nVerificando: ${route}`);
      await page.goto(`http://localhost:4322${route}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // pequeno respiro
      
      const title = await page.title();
      console.log(`Página: ${title}`);
      
      const hasError = await page.evaluate(() => {
        return document.body.innerText.includes('Prisma') || 
               document.body.innerText.includes('Error') ||
               document.body.innerText.includes('Failed');
      });
      
      if (hasError) {
        console.log(`[!] Alerta de ERRO detectado no conteúdo da página: ${route}`);
      } else {
        console.log(`[OK] Página ${route} carregada aparentemente sem erros críticos.`);
      }
    }
  } catch (error) {
    console.error('Erro durante a auditoria:', error.message);
  } finally {
    console.log('\n--- Logs do Console ---');
    logs.forEach(l => console.log(l));
    await browser.close();
  }
})();
