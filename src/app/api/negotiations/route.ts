import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const { data: { user } } = token 
      ? await supabase.auth.getUser(token) 
      : await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar a empresa vinculada ao usuário
    const { data: empresa } = await supabase
      .from("Empresa")
      .select("id")
      .eq("usuarioId", user.id)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
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
      return NextResponse.json(updated);
    } else {
      // Criar nova
      const created = await prisma.negociacao.create({
        data,
      });
      return NextResponse.json(created);
    }
  } catch (error: any) {
    console.error("Erro ao salvar negociação:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const { data: { user } } = token 
      ? await supabase.auth.getUser(token) 
      : await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: empresa } = await supabase
      .from("Empresa")
      .select("id")
      .eq("usuarioId", user.id)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const negotiation = await prisma.negociacao.findUnique({
        where: { id, empresaId: empresa.id },
      });
      return NextResponse.json(negotiation);
    }

    const negotiations = await prisma.negociacao.findMany({
      where: { empresaId: empresa.id },
      orderBy: { criadoEm: "desc" },
    });

    return NextResponse.json(negotiations);
  } catch (error: any) {
    console.error("Erro ao buscar negociações:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const { data: { user } } = token 
      ? await supabase.auth.getUser(token) 
      : await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: empresa } = await supabase
      .from("Empresa")
      .select("id")
      .eq("usuarioId", user.id)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // Deletar garantindo que pertence à empresa
    await prisma.negociacao.delete({
      where: { id, empresaId: empresa.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao deletar negociação:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
