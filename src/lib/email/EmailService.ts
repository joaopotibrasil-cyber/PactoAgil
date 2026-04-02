import { Resend } from 'resend';
import { ActivationTemplate, WelcomeTemplate, MemberInviteTemplate } from './templates/EmailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Serviço Unificado de E-mail para Pacto Ágil
 * Gerencia templates e envios transacionais via Resend.
 */
export class EmailService {
  private static readonly FROM = 'Pacto Ágil <no-reply@pactoagil.com.br>';

  /**
   * Envia link de ativação para novos usuários premium
   */
  static async sendActivationEmail(email: string, nome: string, urlAtivacao: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: this.FROM,
        to: [email],
        subject: '👑 Ative sua vantagem estratégica no Pacto Ágil',
        react: ActivationTemplate({ nome, url: urlAtivacao }) as any,
      });

      if (error) {
        console.error('Erro ao enviar e-mail de ativação:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Erro interno no EmailService (Activation):', err);
      return { success: false, error: err };
    }
  }

  /**
   * Envia convite para membros da equipe
   */
  static async sendMemberInviteEmail(
    email: string, 
    nomeConvidado: string, 
    adminName: string, 
    companyName: string, 
    inviteUrl: string
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: this.FROM,
        to: [email],
        subject: `🤝 Convite: Junte-se à equipe da ${companyName} no Pacto Ágil`,
        react: MemberInviteTemplate({ 
          nomeConvidado, 
          nomeAdmin: adminName, 
          nomeEmpresa: companyName, 
          url: inviteUrl 
        }) as any,
      });

      if (error) {
        console.error('Erro ao enviar e-mail de convite:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Erro interno no EmailService (Invite):', err);
      return { success: false, error: err };
    }
  }

  /**
   * Envia e-mail de boas-vindas após confirmação
   */
  static async sendWelcomeEmail(email: string, nome: string, dashboardUrl: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: this.FROM,
        to: [email],
        subject: '🚀 Bem-vindo à revolução do Pacto Ágil',
        react: WelcomeTemplate({ nome, url: dashboardUrl }) as any,
      });

      if (error) {
        console.error('Erro ao enviar e-mail de boas-vindas:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Erro interno no EmailService (Welcome):', err);
      return { success: false, error: err };
    }
  }
}
