export interface UserProps {
    readonly id: number;
    readonly name: string;
    readonly email: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User {
    readonly id: number;
    readonly name: string;
    readonly email: string;

    constructor(props: UserProps) {
        this.validate(props);
        this.id = props.id;
        this.name = props.name;
        this.email = props.email;
    }

    private validate(props: UserProps): void {
        if (!props.name || props.name.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres.');
        }

        if (props.name.trim().length > 100) {
            throw new Error('El nombre no puede exceder los 100 caracteres.');
        }

        if (!EMAIL_PATTERN.test(props.email)) {
            throw new Error('El correo electrónico no es válido.');
        }
    }

    get firstName(): string {
        return this.name.trim().split(/\s+/)[0];
    }
}
