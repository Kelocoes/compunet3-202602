import type { AuthUser } from '../actions/auth.actions';

export interface AuthUserViewModel {
    readonly id: string;
    readonly displayName: string;
    readonly role: string;
    readonly permissions: string[];
    readonly initials: string;
}

export class AuthViewModelMapper {
    static toViewModel(user: AuthUser): AuthUserViewModel {
        return {
            id: user.id,
            displayName: user.name,
            role: user.role,
            permissions: user.permissions,
            initials: AuthViewModelMapper.buildInitials(user.name),
        };
    }

    private static buildInitials(name: string): string {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word.charAt(0).toUpperCase())
            .join('');
    }
}
