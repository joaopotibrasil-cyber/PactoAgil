import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase/astro';
import prisma from '@/lib/prisma';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const { data: { user }, error: authError } = await supabase(cookies).auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
    }

    const userId = user.id;

    // Buscar a empresa vinculada ao usuário usando Prisma
    const empresa = await prisma.empresa.findFirst({
      where: {
        usuarios: {
          some: {
            userId: userId
          }
        }
      },
      select: { id: true }
    });

    if (!empresa) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), { status: 404 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const negotiation = await prisma.negociacao.findUnique({
        where: { id, empresaId: empresa.id },
      });
      return new Response(JSON.stringify(negotiation), { status: 200 });
    }

    const negotiations = await prisma.negociacao.findMany({
      where: { empresaId: empresa.id },
      orderBy: { criadoEm: "desc" },
    });

    return new Response(JSON.stringify(negotiations), { status: 200 });
  } catch (error: any) {
    console.error("Erro ao buscar negociações:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { data: { user }, error: authError } = await supabase(cookies).auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
    }

    const userId = user.id;

    // Buscar a empresa vinculada ao usuário usando Prisma
    const empresa = await prisma.empresa.findFirst({
      where: {
        usuarios: {
          some: {
            userId: userId
          }
        }
      },
      select: { id: true }
    });

    if (!empresa) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), { status: 404 });
    }

    const body = await request.json();
    const { id, nomeEmpresa, titulo, cnpjAlvo, dataBase, status, instrumento, clausulas, minuta } = body;

    const data = {
      empresaId: empresa.id,
      nomeEmpresa: nomeEmpresa || "Empresa Alvo",
      titulo: titulo || "Nova Negociação",
      cnpjAlvo: cnpjAlvo || "",
      dataBase: dataBase ? new RegExp(/^\d{4}-\d{2}-\d{2}$/).test(dataBase) ? new Date(dataBase) : new Date() : new Date(),
      status: status || "RASCUNHO",
      instrumento: instrumento || "CCT",
      clausulas: clausulas || [],
      minuta: minuta || "",
    };

    if (id) {
      // Atualizar existente
      const updated = await prisma.negociacao.update({
        where: { id },
        data,
      });
      return new Response(JSON.stringify(updated), { status: 200 });
    } else {
      // Criar nova
      const created = await prisma.negociacao.create({
        data,
      });
      return new Response(JSON.stringify(created), { status: 201 });
    }
  } catch (error: any) {
    console.error("Erro ao salvar negociação:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const { data: { user }, error: authError } = await supabase(cookies).auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
    }

    const userId = user.id;

    // Buscar a empresa vinculada ao usuário usando Prisma
    const empresa = await prisma.empresa.findFirst({
      where: {
        usuarios: {
          some: {
            userId: userId
          }
        }
      },
      select: { id: true }
    });

    if (!empresa) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), { status: 404 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "ID não fornecido" }), { status: 400 });
    }

    try {
      await prisma.negociacao.delete({
        where: { id, empresaId: empresa.id },
      });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return new Response(JSON.stringify({ error: 'Negociação não encontrada' }), { status: 404 });
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Erro ao deletar negociação:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
