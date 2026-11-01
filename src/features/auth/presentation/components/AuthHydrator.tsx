'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/src/store/hooks';
import { setUser } from '../store/auth.slice';
import { AuthViewModelMapper } from '../viewmodels/auth.viewmodel';
import type { AuthUser } from '../actions/auth.actions';

export function AuthHydrator({ user }: { user: AuthUser | null }) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setUser(user ? AuthViewModelMapper.toViewModel(user) : null));
    }, [dispatch, user]);

    return null;
}
