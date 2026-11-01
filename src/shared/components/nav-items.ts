export interface NavItem {
    label: string;
    href: string;
}

export const NAV_ITEMS: NavItem[] = [
    { label: 'Rutinas', href: '/routines' },
    { label: 'Ejercicios', href: '/exercises' },
    { label: 'Progreso', href: '/progress' },
];
