// src/pages/menu/Menu.jsx
import {
  Archive,
  BarChartSquare02,
  CheckDone01,
  CurrencyDollarCircle,
  Grid03,
  HomeLine,
  LayoutAlt01,
  LineChartUp03,
  MessageChatCircle,
  NotificationBox,
  Package,
  PieChart03,
  Rows01,
  Settings01,
  Star01,
  User01,
  Users01,
  UsersPlus,
} from "@untitledui/icons";

// ---- Versiones mínimas de los componentes (inline) ----
function BadgeWithDot({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 12, background: '#e8fff3', border: '1px solid #b6f0cd',
      color: '#0a8a3a', padding: '2px 8px', borderRadius: 999
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0a8a3a' }} />
      {children}
    </span>
  );
}

function SidebarNavigationSimple({ items = [], footerItems = [], featureCard }) {
  return (
    <aside style={{
      width: 280, borderRight: '1px solid #eaeaea', padding: 12,
      boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, padding: '6px 8px' }}>Menu</div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it) => (
          <div key={it.label}>
            <div
              style={{
                fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center',
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer', userSelect: 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f7f7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {it.icon ? <it.icon size={18} /> : null}
              <a href={it.href} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                {it.label}
              </a>
              {typeof it.badge === 'number' && (
                <span style={{ fontSize: 12, background: '#eee', borderRadius: 999, padding: '2px 8px' }}>
                  {it.badge}
                </span>
              )}
            </div>

            {Array.isArray(it.items) && it.items.length > 0 && (
              <div style={{ marginLeft: 26, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {it.items.map((sub) => (
                  <div
                    key={sub.label}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {sub.icon ? <sub.icon size={16} /> : null}
                    <a href={sub.href} style={{ textDecoration: 'none', color: '#333', fontSize: 14, flex: 1 }}>
                      {sub.label}
                    </a>
                    {typeof sub.badge === 'number' && (
                      <span style={{ fontSize: 12, background: '#eee', borderRadius: 999, padding: '2px 6px' }}>
                        {sub.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {featureCard ? <div style={{ marginTop: 8 }}>{featureCard}</div> : null}

      <div style={{ marginTop: 'auto', borderTop: '1px solid #eaeaea', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {footerItems.map((f) => (
          <div
            key={f.label}
            style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 6 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {f.icon ? <f.icon size={16} /> : null}
            <a href={f.href} style={{ textDecoration: 'none', color: '#333', flex: 1 }}>
              {f.label}
            </a>
            {f.badge ? <span>{f.badge}</span> : null}
          </div>
        ))}
      </div>
    </aside>
  );
}

// ---- Tus items (sin TypeScript)
const navItemsSimple = [
  { label: "Home", href: "/", icon: HomeLine, items: [
      { label: "Overview", href: "/overview", icon: Grid03 },
      { label: "Products", href: "/products", icon: Package },
      { label: "Orders", href: "/orders", icon: CurrencyDollarCircle },
      { label: "Customers", href: "/customers", icon: Users01 },
  ]},
  { label: "Dashboard", href: "/dashboard", icon: BarChartSquare02, items: [
      { label: "Overview", href: "/dashboard/overview", icon: Grid03 },
      { label: "Notifications", href: "/dashboard/notifications", icon: NotificationBox, badge: 10 },
      { label: "Analytics", href: "/dashboard/analytics", icon: LineChartUp03 },
      { label: "Saved reports", href: "/dashboard/saved-reports", icon: Star01 },
  ]},
  { label: "Projects", href: "/projects", icon: Rows01, items: [
      { label: "View all", href: "/projects/all", icon: Rows01 },
      { label: "Personal", href: "/projects/personal", icon: User01 },
      { label: "Team", href: "/projects/team", icon: Users01 },
      { label: "Shared with me", href: "/projects/shared-with-me", icon: UsersPlus },
      { label: "Archive", href: "/projects/archive", icon: Archive },
  ]},
  { label: "Tasks", href: "/tasks", icon: CheckDone01, badge: 10 },
  { label: "Reporting", href: "/reporting", icon: PieChart03 },
  { label: "Users", href: "/users", icon: Users01 },
];

export default function SidebarNavigationSimpleDemo() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SidebarNavigationSimple
        items={navItemsSimple}
        footerItems={[
          { label: "Settings", href: "/settings", icon: Settings01 },
          { label: "Support", href: "/support", icon: MessageChatCircle, badge: <BadgeWithDot>Online</BadgeWithDot> },
          { label: "Open in browser", href: "https://www.untitledui.com/", icon: LayoutAlt01 },
        ]}
      />
      <main style={{ flex: 1, padding: 24 }}>
        <h1>Contenido</h1>
        <p>Tu página va aquí…</p>
      </main>
    </div>
  );
}
