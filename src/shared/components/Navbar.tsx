import { NavLink } from './NavLink';
import { NAV_ITEMS } from './nav-items';

export function Navbar() {
    return (
        <nav
            aria-label="Secciones"
            className="hidden md:block bg-base-100 border-t border-base-300 px-4"
        >
            <ul className="menu menu-horizontal gap-1 px-0">
                {NAV_ITEMS.map((item) => (
                    <li key={item.href}>
                        <NavLink href={item.href}>{item.label}</NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
