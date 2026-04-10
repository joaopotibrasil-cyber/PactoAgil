-- SQL para criar o bucket 'branding' e configurar permissões de acesso público
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Criar o bucket 'branding' se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas de segurança (RLS) para o bucket 'branding'

-- Permitir acesso público para leitura em todos os arquivos do bucket
CREATE POLICY "Acesso Público para Leitura"
ON storage.objects FOR SELECT
USING ( bucket_id = 'branding' );

-- Permitir que usuários autenticados façam upload de arquivos
CREATE POLICY "Upload para Usuários Autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'branding' );

-- Permitir que usuários autenticados atualizem seus próprios arquivos
CREATE POLICY "Atualização para Usuários Autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'branding' );

-- Permitir que usuários autenticados excluam seus próprios arquivos
CREATE POLICY "Exclusão para Usuários Autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'branding' );
