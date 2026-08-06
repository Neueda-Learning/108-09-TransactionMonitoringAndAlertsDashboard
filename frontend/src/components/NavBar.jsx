import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '⬡' },
  { to: '/transactions', label: 'Transactions', icon: '⇄' },
  { to: '/alerts', label: 'Alerts', icon: '◉' },
  { to: '/rules', label: 'Rules', icon: '⚙' }
];

export default function NavBar({ alertsNeedAttention = false }) {
  return (
    <header className="topbar">
      <div className="topbar-inner container">
        <div className="brand">
          <div className="brand-icon">⬡</div>
          <span>TxMonitor</span>
        </div>
        <nav className="nav-links" aria-label="Main Navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  'nav-link',
                  isActive ? 'nav-link-active' : '',
                  link.to === '/alerts' && alertsNeedAttention ? 'nav-link-alert-attention' : ''
                ]
                  .filter(Boolean)
                  .join(' ')
              }
              end={link.to === '/'}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

