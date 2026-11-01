import { User } from '../../domain/entities/user';

export interface AuthUserViewModel {
    readonly id: number;
    readonly displayName: string;
    readonly email: string;
    readonly initials: string;
}

export class AuthViewModelMapper {
    static toViewModel(entity: User): AuthUserViewModel {
        return {
            id: entity.id,
            displayName: entity.name,
            email: entity.email,
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
