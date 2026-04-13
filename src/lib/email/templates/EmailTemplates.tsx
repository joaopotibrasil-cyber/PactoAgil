import * as React from 'react';

/**
 * Design System de E-mail "Midnight Luxe" (Azul/Cyan)
 * Cor Primária: #00F2FF (Cyan vibrante)
 * Fundo: #020C1E (Midnight Blue)
 * Tipografia: Outfit/System Sans
 */

interface TemplateProps {
  nome: string;
  url: string;
}

interface InviteProps {
  nomeConvidado: string;
  nomeAdmin: string;
  nomeEmpresa: string;
  url: string;
}

const styles = {
  body: {
    backgroundColor: '#020C1E',
    margin: 0,
    padding: '40px 0',
    fontFamily: 'system-ui, -apple-system, blinkmacsystemfont, "Segoe UI", roboto, helvetica, arial, sans-serif'
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#08152B',
    borderRadius: '40px',
    border: '1px solid rgba(0, 242, 255, 0.15)',
    overflow: 'hidden',
    boxShadow: '0 40px 100px rgba(0, 0, 0, 0.5)'
  },
  header: {
    padding: '50px 40px 0',
    textAlign: 'center' as const
  },
  logo: {
    width: '180px',
    height: 'auto',
    marginBottom: '30px'
  },
  badge: {
    display: 'inline-block',
    padding: '6px 14px',
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    border: '1px solid rgba(0, 242, 255, 0.2)',
    borderRadius: '100px',
    color: '#00F2FF',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    marginBottom: '25px'
  },
  content: {
    padding: '0 50px 50px',
    color: '#FFFFFF'
  },
  h1: {
    fontSize: '32px',
    fontWeight: '600',
    lineHeight: '1.2',
    margin: '0 0 25px',
    letterSpacing: '-0.02em',
    textAlign: 'center' as const
  },
  accent: {
    color: '#00F2FF',
    fontStyle: 'italic'
  },
  p: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 35px',
    textAlign: 'center' as const
  },
  ctaWrapper: {
    textAlign: 'center' as const,
    margin: '40px 0'
  },
  button: {
    display: 'inline-block',
    padding: '18px 40px',
    backgroundColor: '#00F2FF',
    color: '#020C1E',
    borderRadius: '100px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '16px',
    boxShadow: '0 10px 20px rgba(0, 242, 255, 0.2)'
  },
  securityNote: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center' as const,
    marginTop: '30px',
    padding: '0 20px'
  },
  footer: {
    padding: '30px 40px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'center' as const
  },
  footerText: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.2)',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    margin: 0
  }
};

export const ActivationTemplate: React.FC<TemplateProps> = ({ nome, url }) => {
  const logoUrl = `${import.meta.env.PUBLIC_APP_URL}/logo-pacto-agil-striking.png`;

  return (
    <html lang="pt-BR">
      <body style={styles.body}>
        <div style={styles.container}>
          <div style={styles.header}>
            <img src={logoUrl} alt="Pacto Ágil" style={styles.logo} />
            <div style={styles.badge}>Ativação Prioritária</div>
          </div>

          <div style={styles.content}>
            <h1 style={styles.h1}>
              Desperte sua <br />
              <span style={styles.accent}>vantagem corporativa.</span>
            </h1>

            <p style={styles.p}>
              Olá, <strong>{nome}</strong>. Seu acesso premium ao ecossistema do <strong>Pacto Ágil</strong> já está disponível. <br /><br />
              Dê as boas-vindas à nova era da eficiência estratégica.
            </p>

            <div style={styles.ctaWrapper}>
              <a href={url} style={styles.button}>Confirmar Minha Identidade</a>
            </div>

            <div style={styles.securityNote}>
              Link seguro e temporário. Se o botão não funcionar: <br />
              <span style={{ color: 'rgba(0, 242, 255, 0.5)', wordBreak: 'break-all' }}>{url}</span>
            </div>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>© {new Date().getFullYear()} PACTO ÁGIL — INTELIGÊNCIA SINDICAL</p>
          </div>
        </div>
      </body>
    </html>
  );
};

export const MemberInviteTemplate: React.FC<InviteProps> = ({ nomeConvidado, nomeAdmin, nomeEmpresa, url }) => {
  const logoUrl = `${import.meta.env.PUBLIC_APP_URL}/logo-pacto-agil-striking.png`;

  return (
    <html lang="pt-BR">
      <body style={styles.body}>
        <div style={styles.container}>
          <div style={styles.header}>
            <img src={logoUrl} alt="Pacto Ágil" style={styles.logo} />
            <div style={styles.badge}>Convite de Equipe</div>
          </div>

          <div style={styles.content}>
            <h1 style={styles.h1}>
              Sua equipe <br />
              <span style={styles.accent}>está chamando.</span>
            </h1>

            <p style={styles.p}>
              Olá, <strong>{nomeConvidado}</strong>. <br /><br />
              <strong>{nomeAdmin}</strong> convidou você para se juntar à infraestrutura estratégica da <strong>{nomeEmpresa}</strong> no Pacto Ágil.
            </p>

            <div style={styles.ctaWrapper}>
              <a href={url} style={styles.button}>Aceitar Convite</a>
            </div>

            <div style={styles.securityNote}>
              Este convite é pessoal e intransferível. Link de acesso: <br />
              <span style={{ color: 'rgba(0, 242, 255, 0.5)', wordBreak: 'break-all' }}>{url}</span>
            </div>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>© {new Date().getFullYear()} PACTO ÁGIL — ECOSSISTEMA B2B</p>
          </div>
        </div>
      </body>
    </html>
  );
};

export const WelcomeTemplate: React.FC<TemplateProps> = ({ nome, url }) => {
  const logoUrl = `${import.meta.env.PUBLIC_APP_URL}/logo-pacto-agil-striking.png`;

  return (
    <html lang="pt-BR">
      <body style={styles.body}>
        <div style={styles.container}>
          <div style={styles.header}>
            <img src={logoUrl} alt="Pacto Ágil" style={styles.logo} />
            <div style={styles.badge}>Boas-vindas B2B</div>
          </div>

          <div style={styles.content}>
            <h1 style={styles.h1}>
              Obrigado por se juntar <br />
              <span style={styles.accent}>à nossa revolução.</span>
            </h1>

            <p style={styles.p}>
              Seja bem-vindo(a), <strong>{nome}</strong>. <br /><br />
              Você agora tem acesso a ferramentas de elite para transformar negociações em resultados.
            </p>

            <div style={styles.ctaWrapper}>
              <a href={url} style={styles.button}>Ir Para o Dashboard</a>
            </div>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>© {new Date().getFullYear()} PACTO ÁGIL S.A.</p>
          </div>
        </div>
      </body>
    </html>
  );
};
