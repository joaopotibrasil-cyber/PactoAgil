/**
 * Template de email cinematográfico "Midnight Luxe" para ativação de conta.
 * Desenvolvido para o Pacto Ágil SaaS.
 * 
 * @param {string} userName Nome do usuário
 * @param {string} activationUrl Link para ativação
 */
export function getActivationEmailHtml(userName: string, activationUrl: string) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ative sua conta - Pacto Ágil</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=Playfair+Display:ital,wght@1,400&display=swap');
            
            body {
                margin: 0;
                padding: 0;
                background-color: #020C1E;
                font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #FFFFFF;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                padding: 60px 40px;
                background-color: #08152B;
                border-radius: 40px;
                border: 1px solid rgba(0, 242, 255, 0.1);
                box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
                text-align: center;
                background-image: radial-gradient(circle at top right, rgba(0, 242, 255, 0.05), transparent);
            }
            .logo {
                margin-bottom: 50px;
                display: block;
                width: 180px;
                margin-left: auto;
                margin-right: auto;
            }
            .brand-badge {
                display: inline-block;
                padding: 5px 12px;
                background: rgba(0, 242, 255, 0.1);
                border: 1px solid rgba(0, 242, 255, 0.2);
                border-radius: 100px;
                color: #00F2FF;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
                font-weight: 600;
                margin-bottom: 20px;
            }
            h1 {
                font-size: 36px;
                font-weight: 600;
                margin: 0 0 20px 0;
                letter-spacing: -0.02em;
                line-height: 1.1;
            }
            h1 i {
                font-family: 'Playfair Display', serif;
                font-style: italic;
                color: #00F2FF;
                font-weight: 400;
            }
            p {
                font-size: 16px;
                line-height: 1.6;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 40px;
            }
            .cta-button {
                display: inline-block;
                padding: 20px 45px;
                background-color: #00F2FF;
                color: #020C1E;
                text-decoration: none;
                border-radius: 100px;
                font-weight: 700;
                font-size: 16px;
                box-shadow: 0 15px 30px rgba(0, 242, 255, 0.3);
                transition: transform 0.3s ease;
            }
            .footer {
                margin-top: 60px;
                padding-top: 30px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                font-size: 11px;
                color: rgba(255, 255, 255, 0.3);
                text-transform: uppercase;
                letter-spacing: 3px;
                font-weight: 400;
            }
            .security-notice {
                margin-top: 20px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.2);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="https://antigravity.ia/pacto-agil-logo-white.png" alt="Pacto Ágil" class="logo">
            
            <div class="brand-badge">Autenticação Corporativa</div>
            
            <h1>O futuro da <br><i>negociação sindical</i> começa agora.</h1>
            
            <p>Olá, ${userName}. Seu portal para o <strong>Pacto Ágil</strong> está pronto. Para garantir a segurança jurídica da sua entidade e ativar seu acesso premium, clique no botão abaixo:</p>
            
            <a href="${activationUrl}" class="cta-button">Confirmar Meu Acesso</a>
            
            <div class="security-notice">
                Este link expira em 24 horas. Se você não solicitou este acesso, ignore este e-mail.
            </div>

            <div class="footer">
                © ${new Date().getFullYear()} Pacto Ágil — Workspace de Inteligência Sindical
            </div>
        </div>
    </body>
    </html>
  `;
}
