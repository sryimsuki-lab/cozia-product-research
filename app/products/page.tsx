import { getProducts } from '@/lib/database';
import { KanbanBoard } from '@/components/KanbanBoard';

export default async function ProductsPage() {
    const products = await getProducts();

    return <KanbanBoard products={products} />;
}
