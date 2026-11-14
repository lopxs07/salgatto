import { createFileRoute } from '@tanstack/react-router';
import { checkSession } from '@/lib/encanto.functions';
import { Admin } from '@/components/admin';
export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: 'Salgatto | Painel administrativo' }, { name: 'description', content: 'Gestão de salgados, bebidas, vendas e relatórios da Salgatto.' }, { property: 'og:title', content: 'Salgatto — Administração' }, { property: 'og:description', content: 'Painel privado para gestão da Salgatto.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex,nofollow' }] }),
  loader: () => checkSession(),
  component: AdminRoute,
});
function AdminRoute() { return <Admin initialSession={Route.useLoaderData()}/>; }