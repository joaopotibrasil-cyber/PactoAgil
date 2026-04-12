import { z } from 'zod';

/**
 * Schemas de validação centralizados
 * Evita duplicação de schemas Zod em múltiplos arquivos
 */

// ===================== AUTH =====================
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  companyName: z.string().min(2, 'Nome da empresa é obrigatório'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
});

// ===================== PLANOS =====================
export const planKeySchema = z.enum([
  'DESCOBERTA',
  'MOVIMENTO',
  'DIRECAO',
  'LIDERANCA',
]);

export type PlanKey = z.infer<typeof planKeySchema>;

// ===================== EMPRESAS =====================
export const companySearchSchema = z
  .string()
  .min(2, 'Mínimo 2 caracteres')
  .max(100, 'Máximo 100 caracteres')
  .regex(/^[\p{L}\p{N}\s\-\.]+$/u, 'Caracteres inválidos');

export const cnpjSchema = z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);

// ===================== AI / NEGOCIAÇÕES =====================
export const aiGenerateSchema = z.object({
  scenario: z.string().min(1, 'Cenário é obrigatório'),
  categories: z.array(z.string()).optional(),
  fields: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        value: z.string(),
        status: z.string(),
        clause: z.string(),
        category: z.string().optional(),
      })
    )
    .optional(),
  documentContent: z.string().optional(),
});

export const aiAnalyzeSchema = z.object({
  documentContent: z.string().min(1, 'Conteúdo do documento é obrigatório'),
  scenario: z.string().optional(),
});

const clausulaSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  status: z.string(),
  clause: z.string(),
  category: z.string().optional(),
});

export const negotiationSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  nomeEmpresa: z.string().optional(),
  cnpjAlvo: z.string().optional(),
  dataBase: z.string().datetime().optional(),
  status: z.enum(['RASCUNHO', 'EM_ANALISE', 'FINALIZADO']).default('RASCUNHO'),
  instrumento: z.enum(['ACT', 'CCT']).default('ACT'),
  clausulas: z.array(clausulaSchema).default([]),
  minuta: z.string().default(''),
});

// ===================== CHECKOUT =====================
export const checkoutSchema = z.object({
  planKey: planKeySchema,
});

// ===================== UTILS =====================
/**
 * Sanitiza input de busca para prevenir injeção
 */
export function sanitizeSearchInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .substring(0, 100); // Limita a 100 caracteres
}

/**
 * Valida e sanitiza CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;

  // Elimina CNPJs invalidos conhecidos
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Validação dos dígitos verificadores
  let tamanho = cleaned.length - 2;
  let numeros = cleaned.substring(0, tamanho);
  const digitos = cleaned.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cleaned.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

/**
 * Formata CNPJ para exibição
 */
export function formatCNPJ(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{3})(\d)/, '.$1.$2/$3')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
}

/**
 * Formata CPF para exibição
 */
export function formatCPF(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .substring(0, 14);
}

/**
 * Formata Telefone (Fixo e Celular)
 */
export function formatPhone(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 10) {
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14);
  }
  return cleanValue
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
}

/**
 * Formatar Nome para Title Case (Maiúscula a cada palavra)
 */
export function formatTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length > 2) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

/**
 * Limpar e forçar formatação de e-mail (remove espaços, tudo minúsculo)
 */
export function formatEmail(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

/**
 * Limpar e forçar formatação de Senha (remove espaços)
 */
export function formatPasswordSafe(value: string): string {
  return value.replace(/\s+/g, '');
}

/**
 * Formatar Nome de Empresa (Maiúsculas)
 */
export function formatCompanyName(value: string): string {
  return value.toUpperCase();
}
