import { queryOptions } from '@tanstack/react-query';
import { listProducts, type Sale, type Product } from './encanto.functions';
const coxinha = { url: '/produtos/salgatto-coxinha.jpg' };
const hamburguer = { url: '/produtos/salgatto-hamburguer.jpg' };
const pizza = { url: '/produtos/salgatto-pizza.jpg' };
const manga = { url: '/produtos/salgatto-manga.jpg' };
const abacaxi = { url: '/produtos/salgatto-abacaxi.jpg' };
const goiaba = { url: '/produtos/salgatto-goiaba.jpg' };
const maracuja = { url: '/produtos/salgatto-maracuja.jpg' };
export const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const productsQuery = queryOptions({ queryKey: ['products'], queryFn: () => listProducts(), refetchInterval: 15000 });
const photos: Record<string, string> = { 'Coxinha': coxinha.url, 'Mini hambúrguer': hamburguer.url, 'Mini pizza': pizza.url, 'Suco de Manga': manga.url, 'Suco de Abacaxi': abacaxi.url, 'Suco de Goiaba': goiaba.url, 'Suco de Maracujá': maracuja.url };
export const productPhoto = (p: Product) => p.image === '' ? undefined : p.image ?? photos[p.name];
export const dayKey = (date: string | Date) => new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' });
export const total = (sales: Sale[]) => sales.reduce((sum, sale) => sum + sale.quantity * sale.unit_price, 0);
export const ranking = (sales: Sale[]) => Object.entries(sales.reduce<Record<string, number>>((items, sale) => { items[sale.product_name] = (items[sale.product_name] ?? 0) + sale.quantity; return items; }, {})).sort((a, b) => b[1] - a[1]);
export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha uma imagem.');
  const url = URL.createObjectURL(file);
  try { const image = new Image(); image.src = url; await image.decode(); const scale = Math.min(1, 900 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = image.width * scale; canvas.height = image.height * scale; const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Não foi possível preparar a foto.'); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', 0.75); } finally { URL.revokeObjectURL(url); }
}
export function exportCsv(sales: Sale[]) { const quote = (v: string) => '"' + v.replace(/"/g, '""') + '"'; const rows = [['Data', 'Produto', 'Quantidade', 'Valor unitário', 'Total'], ...sales.map(s => [new Date(s.created_at).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }), s.product_name, String(s.quantity), money(s.unit_price), money(s.quantity * s.unit_price)])]; const blob = new Blob(['\uFEFF' + rows.map(row => row.map(quote).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'vendas-salgatto.csv'; link.click(); URL.revokeObjectURL(url); }