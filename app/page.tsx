import { getDashboardStats } from '@/lib/database';
import { DashboardClient } from '@/components/DashboardClient';

export default async function Dashboard() {
    const stats = await getDashboardStats();

    return <DashboardClient stats={stats} />;
}
