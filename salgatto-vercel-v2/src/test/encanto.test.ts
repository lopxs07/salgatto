import { describe, expect, it } from 'vitest';
import { total, dayKey, ranking, money } from '@/lib/encanto';
import type { Sale } from '@/lib/encanto.functions';
const sale = (name: string, price: number, quantity: number): Sale => ({ id: name, product_id: null, product_name: name, unit_price: price, quantity, created_at: '2026-11-13T02:30:00Z' });
describe('Regras da SALGATTO', () => {
  it('calcula coxinha a R$ 4,00', () => expect(total([sale('Coxinha', 400, 2)])).toBe(800));
  it('calcula mini hambúrguer a R$ 8,00', () => expect(total([sale('Mini hambúrguer', 800, 3)])).toBe(2400));
  it('calcula mini pizza a R$ 7,00', () => expect(total([sale('Mini pizza', 700, 2)])).toBe(1400));
  for (const flavor of ['Manga', 'Abacaxi', 'Goiaba', 'Maracujá']) {
    it(`calcula suco de ${flavor} a R$ 5,00`, () => expect(total([sale(`Suco de ${flavor}`, 500, 2)])).toBe(1000));
  }
  it('usa o dia local de Fortaleza', () => expect(dayKey('2026-11-13T02:30:00Z')).toBe('2026-11-12'));
  it('classifica cada sabor de suco separadamente', () => expect(ranking([sale('Suco de Manga',500,1),sale('Suco de Goiaba',500,3)])).toEqual([['Suco de Goiaba',3],['Suco de Manga',1]]));
  it('formata reais', () => expect(money(400).replace(/\s/g,' ')).toBe('R$ 4,00'));
});