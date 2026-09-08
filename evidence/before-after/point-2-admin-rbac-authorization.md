# Before / After Evidence 02: Admin RBAC & Access Control Enforcement

---

## 1. Vulnerability Description
- **Threat/Vulnerability:** Broken Access Control / Privilege Escalation (OWASP Top 10 - A01)
- **Asset Affected:** Admin Dashboard (`/admin`) and Admin Overview API (`/api/admin/overview`)
- **Impact:** Regular students could access admin functionalities, view all system statistics, and manipulate user accounts by simply typing the direct URL or sending API requests directly.

---

## 2. Before Fix (Vulnerable Code)
```tsx
// VULNERABLE: Client-side UI hiding only. No server-side gatekeeping!
// src/components/Navbar.tsx
export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav>
      {/* Flaw: Only hides the button from the menu! */}
      {session?.user.role === 'ADMIN' && (
        <Link href="/admin">Admin Console</Link>
      )}
    </nav>
  );
}

// src/app/api/admin/overview/route.ts
export async function GET(req: Request) {
  // Flaw: No role verification in the API endpoint!
  const stats = await getSystemStats();
  return NextResponse.json(stats);
}
```

---

## 3. After Fix (Remediated Code)
```typescript
// SECURED: Multi-layer enforcement at Edge Proxy and Server Route Handlers

// 1. Edge Proxy Guard (`src/proxy.ts`)
export default async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden', message: 'Admin role required' }, { status: 403 });
    }
  }
}

// 2. Server Route Handler Guard (`src/app/api/admin/overview/route.ts`)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden', message: 'Admin privileges required' }, { status: 403 });
  }

  const stats = await getSystemStats();
  return NextResponse.json(stats);
}

// 3. Admin Page Component Guard (`src/app/admin/page.tsx`)
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    forbidden(); // Returns HTTP 403 Forbidden page
  }
  return <AdminDashboard session={session} />;
}
```

---

## 4. Verification & Result
- Direct HTTP requests to `/api/admin/overview` without `ADMIN` role return **HTTP 403 Forbidden**.
- Automated test `RBAC is enforced by proxy, admin API, page, menu, and seeded roles` **PASSED**.
- Student access to `/admin` results in Next.js `forbidden()` error boundary view.
