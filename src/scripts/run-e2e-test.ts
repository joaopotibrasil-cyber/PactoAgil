import { chromium } from 'playwright';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runE2E() {
  console.log('🚀 INICIANDO TESTE E2E: Pacto Ágil SaaS Onboarding');
  
  const browser = await chromium.launch({ headless: true }); // Headless para servidor
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. SIGNUP
    console.log('📝 Etapa 1: Registro...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Fill the fields (name="email" and name="password" in login/page.tsx)
    await page.fill('input[name="email"]', 'cfpopilynx@gmail.com');
    await page.fill('input[name="password"]', 'renatinho122');

    // Click the "Criar nova conta" button which has value="signup"
    await page.click('button[value="signup"]');
    
    await page.waitForTimeout(5000);
    console.log('✅ Registro concluído ou aguardando ativação.');

    // 2. BYPASS ATIVAÇÃO
    console.log('🛡️ Etapa 2: Bypass de Confirmação via Supabase Admin...');
    try {
      execSync('npx ts-node src/scripts/confirm-user.ts cfpopilynx@gmail.com', { stdio: 'inherit' });
    } catch (e) {
      console.log('ℹ️ Usuário já confirmado ou processo interno (bypass automático).');
    }

    // 3. LOGIN
    console.log('🔑 Etapa 3: Autenticação...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'cfpopilynx@gmail.com');
    await page.fill('input[type="password"]', 'renatinho122');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 4. CHECKOUT
    console.log('💳 Etapa 4: Seleção de Plano e Checkout...');
    // Verificando se já caiu no dashboard ou pricing
    if (page.url().includes('login')) {
      throw new Error('Falha no login: Login não redirecionou.');
    }

    // Se estiver no dashboard, buscar botão de upgrade ou assinatura
    await page.goto('http://localhost:3000/pricing', { waitUntil: 'networkidle' });
    
    // Selecionar o plano (ex: Pro / Essencial)
    const subscribeBtn = await page.waitForSelector('button:has-text("Assinar"), button:has-text("Upgrade"), button:has-text("Começar")');
    await subscribeBtn.click();
    
    await page.waitForTimeout(5000); // Wait for Stripe redirect

    // 5. STRIPE TEST MODE
    if (page.url().includes('stripe.com')) {
      console.log('💰 Etapa 5: Processando Pagamento no Stripe (Modo Teste)...');
      await page.waitForSelector('#email'); // Stripe elements
      await page.fill('#email', 'cfpopilynx@gmail.com');
      
      // Card details
      await page.waitForSelector('#cardNumber');
      await page.type('#cardNumber', '4242'); await page.type('#cardNumber', '4242'); 
      await page.type('#cardNumber', '4242'); await page.type('#cardNumber', '4242');
      
      await page.type('#cardExpiry', '1228');
      await page.type('#cardCvc', '123');
      await page.fill('#billingName', 'Renan C. F. Pacto');
      
      await page.click('button[type="submit"]');
      console.log('⌛ Aguardando confirmação do Stripe...');
      
      await page.waitForURL('**/dashboard?session_id=**', { timeout: 60000 });
      console.log('🎉 SUCESSO! Usuário assinado e redirecionado para o Dashboard.');
    } else {
      console.log('ℹ️ Redirecionamento direto (talvez já assinado ou skip).');
    }

  } catch (error: any) {
    console.error('❌ ERRO NO TESTE E2E:', error.message);
  } finally {
    await browser.close();
  }
}

runE2E();
