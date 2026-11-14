import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

async function digest(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(v => v.toString(16).padStart(2, '0')).join('');
}
async function authorized() {
  const token = getCookie('salgatto_session');
  if (!token) throw new Error('Entre para acessar o painel.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data } = await supabaseAdmin.from('admin_sessions').select('expires_at').eq('token_hash', await digest(token)).single();
  if (!data || new Date(data.expires_at).getTime() <= Date.now()) throw new Error('Sessão expirada. Entre novamente.');
  return supabaseAdmin;
}
export const listProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const client = createClient(process.env['SUPABASE_URL']!, key, { auth: { persistSession: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith('sb_')) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers }); } } });
  const { data, error } = await client.from('products').select('id,name,category,price,image,available,position').order('position');
  if (error) throw new Error('Não foi possível carregar os produtos.');
  return data as Product[];
});
export type Product = { id: string; name: string; category: 'snacks' | 'drinks'; price: number; image: string | null; available: boolean; position: number };
export type Sale = { id: string; product_id: string | null; product_name: string; quantity: number; unit_price: number; created_at: string };
export const login = createServerFn({ method: 'POST' }).inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d)).handler(async ({ data }) => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { count } = await supabaseAdmin.from('admin_attempts').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());
  if ((count ?? 0) >= 30) throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
  await supabaseAdmin.from('admin_attempts').insert({});
  const password = process.env['SALGATTO_ADMIN_PASSWORD'];
  if (!password || await digest(data.password) !== await digest(password)) throw new Error('Senha incorreta.');
  const token = crypto.randomUUID() + crypto.randomUUID();
  const { error } = await supabaseAdmin.from('admin_sessions').insert({ token_hash: await digest(token), expires_at: new Date(Date.now() + 8 * 3600000).toISOString() });
  if (error) throw new Error('Não foi possível entrar.');
  setCookie('salgatto_session', token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 8 * 3600 });
  return true;
});
export const checkSession = createServerFn({ method: 'GET' }).handler(async () => { try { await authorized(); return true; } catch { return false; } });
export const logout = createServerFn({ method: 'POST' }).handler(async () => { const client = await authorized(); const token = getCookie('salgatto_session'); if (token) await client.from('admin_sessions').delete().eq('token_hash', await digest(token)); deleteCookie('salgatto_session', { path: '/' }); return true; });
const productSchema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(100), category: z.enum(['snacks', 'drinks']), price: z.number().int().positive().max(100000), image: z.string().max(1500000).nullable(), available: z.boolean(), position: z.number().int() });
export const saveProduct = createServerFn({ method: 'POST' }).inputValidator((d: unknown) => productSchema.parse(d)).handler(async ({ data }) => { const client = await authorized(); const { id, ...fields } = data; const result = id ? await client.from('products').update(fields).eq('id', id) : await client.from('products').insert(fields); if (result.error) throw new Error('Não foi possível salvar o produto.'); return true; });
export const removeProduct = createServerFn({ method: 'POST' }).inputValidator((d: unknown) => z.string().uuid().parse(d)).handler(async ({ data }) => { const client = await authorized(); const { error } = await client.from('products').delete().eq('id', data); if (error) throw new Error('Não foi possível excluir.'); return true; });
export const listSales = createServerFn({ method: 'GET' }).handler(async () => {
  const client = await authorized(); const rows: Sale[] = [];
  for (let from = 0; ; from += 1000) { const { data, error } = await client.from('sales').select('*').order('created_at', { ascending: false }).range(from, from + 999); if (error) throw new Error('Não foi possível carregar as vendas.'); rows.push(...data); if (data.length < 1000) break; }
  return rows;
});
export const recordSale = createServerFn({ method: 'POST' }).inputValidator((d: unknown) => z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(999) }).parse(d)).handler(async ({ data }) => {
  const client = await authorized();
  const { data: product } = await client.from('products').select('*').eq('id', data.productId).single(); if (!product?.available) throw new Error('Produto indisponível.');
  const { data: sale, error } = await client.from('sales').insert({ product_id: product.id, product_name: product.name, quantity: data.quantity, unit_price: product.price }).select().single();
  if (error) throw new Error('Não foi possível registrar a venda.'); return sale;
});
export const removeSale = createServerFn({ method: 'POST' }).inputValidator((d: unknown) => z.string().uuid().parse(d)).handler(async ({ data }) => { const client = await authorized(); const { error } = await client.from('sales').delete().eq('id', data); if (error) throw new Error('Não foi possível excluir a venda.'); return true; });