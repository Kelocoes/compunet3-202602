import { requirePermission } from '@/src/lib/dal';
import { RoutinesView } from '@/src/features/routines/presentation/components/RoutinesView';

export default async function RoutinesPage() {
    await requirePermission('view_routines');

    return <RoutinesView />;
}
