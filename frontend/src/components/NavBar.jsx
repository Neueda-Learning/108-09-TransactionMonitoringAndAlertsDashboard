import { useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/rules', label: 'Rules' }
];

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

function isRouteActive(pathname, route) {
  if (route === '/') {
    return pathname === '/';
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

export default function NavBar() {
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileNavTitleId = useId();
  const menuButtonRef = useRef(null);
  const mobilePanelRef = useRef(null);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setIsMobileViewport(false);
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);

    const handleViewportChange = (event) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) {
        setIsMobileMenuOpen(false);
      }
    };

    setIsMobileViewport(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleViewportChange);
    } else {
      mediaQuery.addListener(handleViewportChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleViewportChange);
      } else {
        mediaQuery.removeListener(handleViewportChange);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 6);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusableSelectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const focusables = mobilePanelRef.current?.querySelectorAll(focusableSelectors);
    focusables?.[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const panelFocusable = mobilePanelRef.current?.querySelectorAll(focusableSelectors);
      if (!panelFocusable || panelFocusable.length === 0) {
        return;
      }

      const first = panelFocusable[0];
      const last = panelFocusable[panelFocusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileMenuOpen]);

  const topbarClassName = isScrolled ? 'topbar topbar-scrolled' : 'topbar';

  const navLinkClassName = (route) =>
    isRouteActive(pathname, route) ? 'nav-link nav-link-active' : 'nav-link';

  return (
    <header className={topbarClassName}>
      <div className="topbar-inner container">
        <div className="brand">Transaction Monitoring</div>
        <div className="topbar-controls">
          <nav className="nav-links nav-links-desktop" aria-label="Main Navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={navLinkClassName(link.to)}
                end={link.to === '/'}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            ref={menuButtonRef}
            type="button"
            className="btn btn-ghost btn-small nav-toggle"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-haspopup="dialog"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-panel"
            onClick={() => setIsMobileMenuOpen((previousState) => !previousState)}
            hidden={!isMobileViewport}
          >
            <span aria-hidden="true">&#9776;</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`mobile-nav-backdrop${isMobileMenuOpen ? ' is-open' : ''}`}
        aria-label="Close navigation menu"
        onClick={() => {
          setIsMobileMenuOpen(false);
          requestAnimationFrame(() => menuButtonRef.current?.focus());
        }}
        hidden={!isMobileMenuOpen}
      />

      <aside
        id="mobile-navigation-panel"
        ref={mobilePanelRef}
        className={`mobile-nav-panel${isMobileMenuOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMobileMenuOpen}
        aria-labelledby={mobileNavTitleId}
      >
        <div className="mobile-nav-header">
          <strong id={mobileNavTitleId} className="mobile-nav-title">Menu</strong>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            aria-label="Close navigation menu"
            onClick={() => {
              setIsMobileMenuOpen(false);
              requestAnimationFrame(() => menuButtonRef.current?.focus());
            }}
          >
            Close
          </button>
        </div>

        <nav className="mobile-nav-links" aria-label="Mobile Main Navigation">
          {links.map((link) => (
            <NavLink
              key={`mobile-${link.to}`}
              to={link.to}
              className={isRouteActive(pathname, link.to) ? 'mobile-nav-link nav-link-active' : 'mobile-nav-link'}
              end={link.to === '/'}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </header>
  );
}
