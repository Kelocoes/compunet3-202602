import type { AuthUser } from '../actions/auth.action';

export interface AuthUserViewModel {
    readonly id: string;
    readonly displayName: string;
    readonly role: string;
    readonly permissions: string[];
    readonly initials: string;
}

export class AuthViewModelMapper {
    static toViewModel(entity: AuthUser): AuthUserViewModel {
        return {
            id: entity.id,
            displayName: entity.name,
            role: entity.role,
            permissions: entity.permissions,
            initials: AuthViewModelMapper.buildInitials(entity.name),
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
