'use server';

import { requirePermission } from '@/src/lib/dal';
import { routineContainer } from '../../di/routine.container';
import type { CreateRoutineParams } from '../../domain/repositories/routine.repository';
import { RoutineViewModelMapper, type RoutineItemViewModel } from '../viewmodels/routine.viewmodel';

export type RoutinesResult =
    | { ok: true; routines: RoutineItemViewModel[] }
    | { ok: false; message: string };

export type CreateRoutineResult =
    | { ok: true; routine: RoutineItemViewModel }
    | { ok: false; message: string };

export async function getRoutinesAction(): Promise<RoutinesResult> {
    await requirePermission('view_routines');

    try {
        const entities = await routineContainer.getRoutines.execute();
        return {
            ok: true,
            routines: entities.map((entity) => RoutineViewModelMapper.toViewModel(entity)),
        };
    } catch (err: unknown) {
        return { ok: false, message: 'Error al cargar rutinas' };
    }
}

export async function createRoutineAction(params: CreateRoutineParams): Promise<CreateRoutineResult> {
    await requirePermission('create_routines');

    try {
        const entity = await routineContainer.createRoutine.execute(params);
        return { ok: true, routine: RoutineViewModelMapper.toViewModel(entity) };
    } catch (err: unknown) {
        return { ok: false, message: 'No se pudo crear la rutina' };
    }
}
