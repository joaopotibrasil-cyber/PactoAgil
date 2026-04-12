/**
 * Lista de e-mails permitidos para o modo de bypass em ambiente de desenvolvimento.
 * Em produção, esta lista é vazia por segurança.
 */
export const BYPASS_EMAILS = process.env.NODE_ENV === 'development'
  ? (process.env.AUTH_BYPASS_EMAILS?.split(',').filter(Boolean) || [])
  : [];

export const AUTH_COOKIES = {
  BYPASS_EMAIL: 'pacto-bypass-email'
};
