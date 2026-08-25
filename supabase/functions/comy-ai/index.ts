// Supabase Edge Function — Comy IA (Phase 10)
//
// Reçoit un message utilisateur, appelle Claude avec 7 outils de lecture
// spécialisés (jamais toute la base de données), persiste la conversation.
// Le client Supabase utilisé ici porte le JWT de l'utilisateur appelant :
// toutes les requêtes de données passent donc par la RLS existante, comme le
// reste de l'app — aucune clé service_role, aucune élévation de privilège.
//
// Aucun outil d'écriture n'existe : la règle de sécurité de la section 28
// (jamais de modification sans confirmation) est garantie par construction.

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  conversationId?: string;
  companyId: string;
  shopId: string;
  message: string;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function periodRange(period: string): { from: string; to: string } {
  const now = new Date();
  if (period === 'yesterday') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return { from: toIsoDate(d), to: toIsoDate(d) };
  }
  if (period === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { from: toIsoDate(start), to: toIsoDate(now) };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toIsoDate(start), to: toIsoDate(now) };
  }
  const iso = toIsoDate(now);
  return { from: iso, to: iso };
}

const tools: Anthropic.Tool[] = [
  {
    name: 'get_daily_sales',
    description: "Chiffre d'affaires, bénéfice et nombre de ventes pour une date donnée (défaut : aujourd'hui).",
    input_schema: {
      type: 'object',
      properties: { date: { type: 'string', description: 'Date au format AAAA-MM-JJ (défaut : aujourd\'hui)' } },
    },
  },
  {
    name: 'get_best_selling_products',
    description: 'Produits les plus vendus (quantité, chiffre d\'affaires, marge) sur une période.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['today', 'yesterday', 'week', 'month'] },
        limit: { type: 'integer', description: 'Nombre de produits à retourner (défaut 5)' },
      },
      required: ['period'],
    },
  },
  {
    name: 'get_low_stock_products',
    description: 'Produits en stock faible ou en rupture pour la boutique active.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_customer_debts',
    description: 'Liste des clients qui doivent de l\'argent (dette non soldée), triée par montant décroissant.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_supplier_debts',
    description: 'Liste des fournisseurs à qui l\'entreprise doit de l\'argent, triée par montant décroissant.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_financial_summary',
    description: 'Résumé financier (CA, bénéfice brut, dépenses, bénéfice net, ventes, panier moyen) pour une période.',
    input_schema: {
      type: 'object',
      properties: { period: { type: 'string', enum: ['today', 'yesterday', 'week', 'month'] } },
      required: ['period'],
    },
  },
  {
    name: 'compare_periods',
    description: 'Compare le résumé financier de deux périodes (ex. cette semaine vs semaine dernière).',
    input_schema: {
      type: 'object',
      properties: {
        period_a: { type: 'string', enum: ['today', 'yesterday', 'week', 'month'] },
        period_b: { type: 'string', enum: ['today', 'yesterday', 'week', 'month'] },
      },
      required: ['period_a', 'period_b'],
    },
  },
];

async function executeTool(
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  shopId: string,
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'get_daily_sales': {
      const date = (input.date as string) || toIsoDate(new Date());
      const { data, error } = await supabase
        .rpc('report_sales_summary', { p_company_id: companyId, p_shop_id: shopId, p_start: date, p_end: date })
        .single();
      if (error) throw error;
      return data;
    }
    case 'get_best_selling_products': {
      const range = periodRange((input.period as string) || 'today');
      const { data, error } = await supabase.rpc('report_product_sales', {
        p_company_id: companyId,
        p_shop_id: shopId,
        p_start: range.from,
        p_end: range.to,
      });
      if (error) throw error;
      const limit = (input.limit as number) || 5;
      return [...(data ?? [])].sort((a: any, b: any) => b.quantity_sold - a.quantity_sold).slice(0, limit);
    }
    case 'get_low_stock_products': {
      const [productsResult, stockResult] = await Promise.all([
        supabase.from('products').select('id, name, stock_min').eq('company_id', companyId),
        supabase.from('stock_levels').select('product_id, quantity').eq('company_id', companyId).eq('shop_id', shopId),
      ]);
      if (productsResult.error) throw productsResult.error;
      if (stockResult.error) throw stockResult.error;
      const quantityByProduct = new Map((stockResult.data ?? []).map((row: any) => [row.product_id, row.quantity]));
      return (productsResult.data ?? [])
        .map((product: any) => {
          const quantity = quantityByProduct.get(product.id) ?? 0;
          const status = quantity <= 0 ? 'rupture' : quantity <= product.stock_min ? 'faible' : 'disponible';
          return { name: product.name, quantity, stock_min: product.stock_min, status };
        })
        .filter((row: any) => row.status !== 'disponible');
    }
    case 'get_customer_debts': {
      const { data, error } = await supabase.rpc('report_customer_debts', { p_company_id: companyId });
      if (error) throw error;
      return data;
    }
    case 'get_supplier_debts': {
      const { data, error } = await supabase.rpc('report_supplier_debts', { p_company_id: companyId });
      if (error) throw error;
      return data;
    }
    case 'get_financial_summary': {
      const range = periodRange((input.period as string) || 'today');
      const { data, error } = await supabase
        .rpc('report_sales_summary', { p_company_id: companyId, p_shop_id: shopId, p_start: range.from, p_end: range.to })
        .single();
      if (error) throw error;
      return data;
    }
    case 'compare_periods': {
      const rangeA = periodRange((input.period_a as string) || 'today');
      const rangeB = periodRange((input.period_b as string) || 'yesterday');
      const [a, b] = await Promise.all([
        supabase
          .rpc('report_sales_summary', { p_company_id: companyId, p_shop_id: shopId, p_start: rangeA.from, p_end: rangeA.to })
          .single(),
        supabase
          .rpc('report_sales_summary', { p_company_id: companyId, p_shop_id: shopId, p_start: rangeB.from, p_end: rangeB.to })
          .single(),
      ]);
      if (a.error) throw a.error;
      if (b.error) throw b.error;
      return { period_a: a.data, period_b: b.data };
    }
    default:
      throw new Error(`Outil inconnu : ${name}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Session invalide.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestBody = await req.json();
    const { companyId, shopId, message } = body;
    if (!companyId || !shopId || !message) {
      return new Response(JSON.stringify({ error: 'Requête invalide.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Contrôle de quota avant tout appel à Claude (chaque message coûte de l'argent en API
    // Anthropic) — voir subscription_usage (Phase 12), qui agrège les messages de toute
    // l'entreprise sur la période associée à sa formule (jour ou mois).
    const { data: usage, error: usageError } = await supabase
      .rpc('subscription_usage', { p_company_id: companyId })
      .single();
    if (usageError) throw usageError;
    const usageRow = usage as { plan: string; ai_used: number; ai_max: number; ai_period: 'day' | 'month' };
    if (usageRow.ai_used >= usageRow.ai_max) {
      return new Response(
        JSON.stringify({
          error: 'quota_exceeded',
          message:
            usageRow.ai_period === 'day'
              ? "Quota de messages Comy IA atteint pour aujourd'hui. Passez à une formule supérieure pour continuer."
              : 'Quota de messages Comy IA atteint pour ce mois. Passez à une formule supérieure pour continuer.',
          plan: usageRow.plan,
          aiMax: usageRow.ai_max,
          aiPeriod: usageRow.ai_period,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let conversationId = body.conversationId;
    if (!conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .insert({ company_id: companyId, shop_id: shopId, title: message.slice(0, 60) })
        .select('id')
        .single();
      if (convError) throw convError;
      conversationId = conversation.id as string;
    }

    const { error: insertUserMsgError } = await supabase
      .from('ai_messages')
      .insert({ conversation_id: conversationId, role: 'user', content: message });
    if (insertUserMsgError) throw insertUserMsgError;

    const { data: historyRows, error: historyError } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);
    if (historyError) throw historyError;

    const { data: company } = await supabase.from('companies').select('currency, name').eq('id', companyId).single();

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    const systemPrompt = `Tu es Comy IA, l'assistant financier et commercial intégré à l'application Comy_stock, pour la boutique en cours de l'entreprise "${company?.name ?? ''}" (devise : ${company?.currency ?? 'XOF'}).
Tu réponds UNIQUEMENT aux questions sur les données de cette entreprise et de cette boutique — tes outils sont déjà limités à ce périmètre par le système, tu n'as accès à rien d'autre.
Réponds toujours en français, de façon concise (quelques phrases), concrète et orientée action. Utilise les outils disponibles pour obtenir des chiffres réels avant de répondre — ne devine jamais un chiffre.
Tu ne peux STRICTEMENT rien modifier, supprimer ou créer : tu n'as accès qu'à des outils de lecture. Si on te demande d'effectuer une action (changer un prix, supprimer une vente, passer une commande...), explique que ce n'est pas encore possible depuis le chat et invite à le faire depuis les écrans correspondants de l'application.`;

    const messages: Anthropic.MessageParam[] = (historyRows ?? []).map((row) => ({
      role: row.role as 'user' | 'assistant',
      content: row.content as string,
    }));

    let finalText = '';
    for (let iteration = 0; iteration < 6; iteration++) {
      const response = await anthropic.messages.create({
        model: 'claude-opus-5',
        max_tokens: 2048,
        system: systemPrompt,
        tools,
        messages,
      });

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUseBlocks.length === 0) {
        const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
        finalText = textBlock?.text ?? '';
        break;
      }

      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        try {
          const result = await executeTool(
            supabase,
            companyId,
            shopId,
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) });
        } catch (toolError) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Erreur : ${toolError instanceof Error ? toolError.message : String(toolError)}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: 'user', content: toolResults });
    }

    if (!finalText) {
      finalText = "Désolé, je n'ai pas pu terminer cette analyse. Reformulez votre question ?";
    }

    const { error: insertAssistantMsgError } = await supabase
      .from('ai_messages')
      .insert({ conversation_id: conversationId, role: 'assistant', content: finalText });
    if (insertAssistantMsgError) throw insertAssistantMsgError;

    const { data: finalMessages, error: finalMessagesError } = await supabase
      .from('ai_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (finalMessagesError) throw finalMessagesError;

    return new Response(JSON.stringify({ conversationId, messages: finalMessages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
