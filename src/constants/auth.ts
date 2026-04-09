/**
 * Lista de e-mails permitidos para o modo de bypass em ambiente de teste/produção.
 * IMPORTANTE: Remover ou limpar esta lista antes do lançamento oficial.
 */
export const BYPASS_EMAILS = [
  'contato@cursoecertificado.com.br',
  'renato@starwars1.com.br'
];

export const AUTH_COOKIES = {
  BYPASS_EMAIL: 'pacto-bypass-email'
};
