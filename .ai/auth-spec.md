# Specyfikacja Architektury Modułu Autentykacji - MyFunds

## 1. Przegląd

Niniejszy dokument zawiera szczegółową specyfikację techniczną modułu autentykacji dla aplikacji MyFunds (MVP-1). Moduł obejmuje funkcjonalności rejestracji użytkownika (US-001), logowania (US-002), wylogowywania (US-003) oraz odzyskiwania hasła. Architektura opiera się na integracji Supabase Auth z frameworkiem Astro 5 w trybie SSR (`output: "server"`).

### 1.1. Zakres funkcjonalny

- Rejestracja nowego użytkownika (bez weryfikacji e-mail w MVP)
- Logowanie użytkownika z obsługą błędów
- Wylogowywanie użytkownika z zakończeniem sesji
- Odzyskiwanie hasła (reset password)
- Ochrona stron wymagających autoryzacji
- Zarządzanie sesją użytkownika

### 1.2. Założenia techniczne

| Element | Technologia |
|---------|-------------|
| Frontend | Astro 5 + React 19 |
| Stylowanie | Tailwind 4 + Shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth) |
| Routing | Astro SSR (file-based) |
| Walidacja | Zod |
| Sesja | Cookie-based (Supabase Auth) |

---

## 2. Architektura Interfejsu Użytkownika

### 2.1. Struktura stron i layoutów

Moduł autentykacji wprowadza rozdzielenie layoutów na dwie kategorie: strony publiczne (auth) i strony chronione (app).

#### 2.1.1. Nowe layouty

**`src/layouts/AuthLayout.astro`**
Layout dla stron autentykacji (logowanie, rejestracja, reset hasła). Cechy:
- Minimalistyczny design bez nawigacji aplikacji
- Wycentrowana karta formularza
- Logo MyFunds w nagłówku
- Link powrotny do strony głównej (dla niezalogowanych)
- Obsługa trybu ciemnego (dark mode)

**`src/layouts/Layout.astro` (modyfikacja)**
Rozszerzenie istniejącego layoutu o:
- Weryfikację sesji użytkownika server-side
- Przekierowanie do `/auth/login` dla niezalogowanych użytkowników
- Przekazanie danych użytkownika do `AppNavigation`
- Rozszerzenie `AppNavigation.astro` o przycisk wylogowania

#### 2.1.2. Nowe strony Astro

| Ścieżka | Plik | Opis | Layout |
|---------|------|------|--------|
| `/auth/login` | `src/pages/auth/login.astro` | Formularz logowania | AuthLayout |
| `/auth/register` | `src/pages/auth/register.astro` | Formularz rejestracji | AuthLayout |
| `/auth/forgot-password` | `src/pages/auth/forgot-password.astro` | Formularz resetowania hasła | AuthLayout |
| `/auth/reset-password` | `src/pages/auth/reset-password.astro` | Formularz ustawienia nowego hasła | AuthLayout |
| `/auth/callback` | `src/pages/auth/callback.astro` | Handler dla callbacków OAuth/reset password | - |

#### 2.1.3. Modyfikacja istniejących stron

**Strony wymagające ochrony:**
- `src/pages/index.astro` (Portfolio)
- `src/pages/portfolio.astro`
- `src/pages/watchlist.astro`
- `src/pages/profile.astro`

Każda chroniona strona zostanie zmodyfikowana o sprawdzenie sesji w sekcji frontmatter Astro:

```astro
---
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

if (!session) {
  return Astro.redirect('/auth/login');
}
---
```

### 2.2. Komponenty React dla formularzy autentykacji

#### 2.2.1. Nowe komponenty

**`src/components/auth/LoginForm.tsx`**
Formularz logowania z następującymi elementami:
- Pole e-mail (`Input` z Shadcn/ui)
- Pole hasło z przełącznikiem widoczności
- Przycisk "Sign in" (`Button`)
- Link "Don't have an account? Sign up"
- Link "Forgot password?"
- Obsługa stanu `isSubmitting` (blokada przycisku)
- Wyświetlanie błędów walidacji i błędów API

**`src/components/auth/RegisterForm.tsx`**
Formularz rejestracji z następującymi elementami:
- Pole e-mail
- Pole hasło z wskaźnikiem siły (tekst pomocniczy "min. 8 characters")
- Pole powtórz hasło
- Przycisk "Sign up"
- Link "Already have an account? Sign in"
- Walidacja zgodności haseł w czasie rzeczywistym
- Po pomyślnej rejestracji automatyczne logowanie i przekierowanie do dashboardu

**`src/components/auth/ForgotPasswordForm.tsx`**
Formularz resetowania hasła:
- Pole e-mail
- Przycisk "Send reset link"
- Komunikat potwierdzenia wysłania

**`src/components/auth/ResetPasswordForm.tsx`**
Formularz ustawienia nowego hasła:
- Pole nowe hasło
- Pole powtórz hasło
- Przycisk "Set new password"
- Walidacja zgodności haseł

**`src/components/auth/AuthCard.tsx`**
Komponent opakowujący dla formularzy autentykacji:
- Nagłówek z tytułem i opisem
- Slot na formularz
- Stylowanie zgodne z design systemem (Card z Shadcn/ui)

**`src/components/auth/UserMenu.tsx`**
Komponent menu użytkownika do integracji z nawigacją:
- Wyświetlanie e-maila użytkownika (skrócone)
- Dropdown z opcjami: "Profile", "Sign out"
- Obsługa wylogowania po stronie klienta

#### 2.2.2. Nowe komponenty UI (Shadcn/ui)

Dodanie brakujących komponentów z biblioteki Shadcn/ui:
- `src/components/ui/dropdown-menu.tsx` - dla UserMenu
- `src/components/ui/avatar.tsx` - dla wyświetlania avatara użytkownika (opcjonalne)
- `src/components/ui/separator.tsx` - dla rozdzielania sekcji w menu

### 2.3. Walidacja i komunikaty błędów

#### 2.3.1. Walidacja po stronie klienta (React)

| Pole | Reguły walidacji | Komunikat błędu |
|------|------------------|-----------------|
| E-mail | Format e-mail (regex), wymagane | "Please enter a valid email address" |
| Hasło | Min. 8 znaków, wymagane | "Password must be at least 8 characters" |
| Powtórz hasło | Musi być identyczne z hasłem | "Passwords do not match" |

Walidacja wykorzystuje bibliotekę Zod z integracją React Hook Form lub natywnym stanem formularza.

#### 2.3.2. Komunikaty błędów API

| Kod błędu Supabase | Komunikat użytkownika |
|--------------------|-----------------------|
| `invalid_credentials` | "Invalid email or password" |
| `user_already_exists` | "An account with this email already exists" |
| `weak_password` | "Password is too weak. Use at least 8 characters" |
| `rate_limit_exceeded` | "Too many attempts. Please try again later" |
| Nieznany błąd | "An unexpected error occurred. Please try again" |

Komunikaty wyświetlane za pomocą komponentu Toast (Sonner) dla błędów globalnych lub inline dla błędów pól formularza.

### 2.4. Scenariusze użytkownika

#### Scenariusz A: Rejestracja nowego użytkownika
1. Użytkownik wchodzi na stronę główną (`/`)
2. Middleware wykrywa brak sesji → przekierowanie do `/auth/login`
3. Użytkownik klika "Sign up" → przejście do `/auth/register`
4. Wypełnia formularz (e-mail, hasło, powtórz hasło)
5. Walidacja kliencka sprawdza zgodność haseł
6. Kliknięcie "Sign up" → wywołanie Supabase Auth `signUp`
7. Sukces → automatyczne logowanie i przekierowanie do `/` (Portfolio)

Uwaga: W MVP weryfikacja e-mail jest wyłączona. Użytkownik jest automatycznie zalogowany po rejestracji.

#### Scenariusz B: Logowanie użytkownika
1. Użytkownik wchodzi na `/auth/login`
2. Wypełnia formularz (e-mail, hasło)
3. Kliknięcie "Sign in" → wywołanie Supabase Auth `signInWithPassword`
4. Sukces → ustawienie sesji (cookie) → przekierowanie do `/` (Portfolio)
5. Błąd → wyświetlenie komunikatu błędu (Toast lub inline)

#### Scenariusz C: Wylogowanie użytkownika
1. Zalogowany użytkownik klika ikonę profilu w nawigacji
2. Z menu wybiera "Sign out"
3. Wywołanie Supabase Auth `signOut`
4. Usunięcie sesji (cookie) → przekierowanie do `/auth/login`

#### Scenariusz D: Odzyskiwanie hasła
1. Użytkownik na stronie logowania klika "Forgot password?"
2. Przejście do `/auth/forgot-password`
3. Wprowadza adres e-mail
4. Wywołanie Supabase Auth `resetPasswordForEmail`
5. Komunikat potwierdzenia wysłania linku
6. Użytkownik otrzymuje e-mail z linkiem resetującym
7. Kliknięcie linku → przejście do `/auth/reset-password` z tokenem
8. Użytkownik ustawia nowe hasło
9. Sukces → przekierowanie do `/auth/login` z komunikatem sukcesu

### 2.5. Modyfikacja nawigacji

**`src/components/AppNavigation.astro` (modyfikacja)**

Rozszerzenie istniejącej nawigacji o:
- Wyświetlanie komponentu `UserMenu` zamiast prostego linku do profilu
- Przekazanie danych sesji (e-mail użytkownika) do komponentu React
- Zachowanie responsywności i dostępności (ARIA)

```astro
---
import { UserMenu } from './auth/UserMenu.tsx';

interface Props {
  userEmail?: string;
}

const { userEmail } = Astro.props;
---

<!-- Istniejąca nawigacja -->
<nav>
  <!-- ... portfolio/watchlist links ... -->
  
  <!-- Nowy element: Menu użytkownika -->
  {userEmail && (
    <UserMenu client:load userEmail={userEmail} />
  )}
</nav>
```

---

## 3. Logika Backendowa

### 3.1. Struktura endpointów API

Autentykacja w Supabase jest obsługiwana głównie przez SDK klienckie. Jednak dla zachowania spójności architektury i możliwości rozszerzenia, definiujemy własne endpointy API proxy.

#### 3.1.1. Endpointy autentykacji

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/api/auth/register` | Rejestracja nowego użytkownika |
| POST | `/api/auth/login` | Logowanie użytkownika |
| POST | `/api/auth/logout` | Wylogowanie użytkownika |
| POST | `/api/auth/forgot-password` | Wysłanie linku resetującego |
| POST | `/api/auth/reset-password` | Ustawienie nowego hasła |
| GET | `/api/auth/session` | Pobranie aktualnej sesji |

**Struktura plików:**
```
src/pages/api/auth/
├── register.ts
├── login.ts
├── logout.ts
├── forgot-password.ts
├── reset-password.ts
└── session.ts
```

#### 3.1.2. Kontrakty API

**POST `/api/auth/register`**

Request:
```typescript
interface RegisterCommand {
  email: string;      // Format e-mail, wymagane
  password: string;   // Min. 8 znaków, wymagane
}
```

Response (201 Created):
```typescript
interface RegisterResponse {
  message: string;    // "Account created successfully"
  user_id: string;    // UUID nowego użytkownika
  access_token: string;
  refresh_token: string;
}
```

Błędy:
- `400 Bad Request` - Walidacja (niepoprawny format e-mail, słabe hasło)
- `409 Conflict` - E-mail już zarejestrowany

Uwaga: W MVP rejestracja automatycznie loguje użytkownika (zwraca tokeny sesji).

---

**POST `/api/auth/login`**

Request:
```typescript
interface LoginCommand {
  email: string;
  password: string;
}
```

Response (200 OK):
```typescript
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;       // Unix timestamp
  user: {
    id: string;
    email: string;
  };
}
```

Błędy:
- `400 Bad Request` - Brak wymaganych pól
- `401 Unauthorized` - Nieprawidłowe dane logowania

---

**POST `/api/auth/logout`**

Headers:
```
Authorization: Bearer {access_token}
```

Response (204 No Content)

Błędy:
- `401 Unauthorized` - Brak lub nieprawidłowy token

---

**POST `/api/auth/forgot-password`**

Request:
```typescript
interface ForgotPasswordCommand {
  email: string;
}
```

Response (200 OK):
```typescript
interface ForgotPasswordResponse {
  message: string;  // "Password reset link has been sent to your email"
}
```

Uwaga: Odpowiedź 200 zwracana jest zawsze (nawet gdy e-mail nie istnieje) w celu ochrony przed enumeracją użytkowników.

---

**POST `/api/auth/reset-password`**

Request:
```typescript
interface ResetPasswordCommand {
  password: string;  // Min. 8 znaków
}
```

Headers:
```
Authorization: Bearer {recovery_token}
```

Response (200 OK):
```typescript
interface ResetPasswordResponse {
  message: string;  // "Password has been changed successfully"
}
```

Błędy:
- `400 Bad Request` - Słabe hasło
- `401 Unauthorized` - Nieprawidłowy lub wygasły token

---

**GET `/api/auth/session`**

Response (200 OK):
```typescript
interface SessionResponse {
  user: {
    id: string;
    email: string;
  } | null;
  expires_at: number | null;
}
```

### 3.2. Schematy walidacji (Zod)

**`src/lib/validation/auth.validation.ts`**

```typescript
import { z } from 'zod';

// Wspólne schematy
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

// Schematy komend
export const registerCommandSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginCommandSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordCommandSchema = z.object({
  email: emailSchema,
});

export const resetPasswordCommandSchema = z.object({
  password: passwordSchema,
});

// Eksport typów
export type RegisterCommand = z.infer<typeof registerCommandSchema>;
export type LoginCommand = z.infer<typeof loginCommandSchema>;
export type ForgotPasswordCommand = z.infer<typeof forgotPasswordCommandSchema>;
export type ResetPasswordCommand = z.infer<typeof resetPasswordCommandSchema>;
```

### 3.3. Serwis autentykacji

**`src/lib/services/auth.service.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async register(email: string, password: string) {
    // W MVP weryfikacja e-mail jest wyłączona - użytkownik jest automatycznie zalogowany
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async sendPasswordResetEmail(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.SITE_URL}/auth/reset-password`,
    });
    
    if (error) throw error;
  }

  async updatePassword(password: string) {
    const { error } = await this.supabase.auth.updateUser({
      password,
    });
    
    if (error) throw error;
  }

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return session;
  }
}

export function createAuthService(supabase: SupabaseClient<Database>): AuthService {
  return new AuthService(supabase);
}
```

### 3.4. Rozszerzenie obsługi błędów

**`src/lib/utils/error.utils.ts` (rozszerzenie)**

Dodanie nowych kodów błędów związanych z autentykacją:

```typescript
export enum ErrorCode {
  // ... istniejące kody ...

  // Błędy autentykacji
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_RESET_TOKEN = 'INVALID_RESET_TOKEN',
  EXPIRED_RESET_TOKEN = 'EXPIRED_RESET_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
}
```

**Mapowanie błędów Supabase:**

```typescript
export function mapSupabaseAuthError(error: AuthError): { code: ErrorCode; message: string; status: number } {
  switch (error.message) {
    case 'User already registered':
      return { code: ErrorCode.EMAIL_ALREADY_EXISTS, message: 'An account with this email already exists', status: 409 };
    case 'Invalid login credentials':
      return { code: ErrorCode.INVALID_CREDENTIALS, message: 'Invalid email or password', status: 401 };
    case 'Password should be at least 6 characters':
      return { code: ErrorCode.WEAK_PASSWORD, message: 'Password must be at least 8 characters', status: 400 };
    // ... więcej mapowań
    default:
      return { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred', status: 500 };
  }
}
```

### 3.5. Modyfikacja middleware

**`src/middleware/index.ts` (rozszerzenie)**

Rozbudowa middleware o obsługę sesji autentykacji:

```typescript
import { defineMiddleware, sequence } from 'astro:middleware';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { Database } from '../db/database.types';

// Lista ścieżek publicznych (nie wymagających autoryzacji)
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
];

// Lista ścieżek API publicznych
const PUBLIC_API_PATHS = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/forgot-password',
];

const authMiddleware = defineMiddleware(async (context, next) => {
  // Tworzenie klienta Supabase z obsługą cookies (SSR)
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(context.request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Zapisanie klienta w locals
  context.locals.supabase = supabase;

  // Pobranie sesji
  const { data: { session } } = await supabase.auth.getSession();
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  const pathname = context.url.pathname;

  // Sprawdzenie czy ścieżka jest publiczna
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  const isPublicApiPath = PUBLIC_API_PATHS.some(path => pathname === path);
  const isApiPath = pathname.startsWith('/api/');

  // Przekierowanie zalogowanych użytkowników ze stron auth do dashboardu
  if (session && isPublicPath && !pathname.includes('callback')) {
    return context.redirect('/');
  }

  // Ochrona stron wymagających autoryzacji
  if (!session && !isPublicPath && !isPublicApiPath && !isApiPath) {
    return context.redirect('/auth/login');
  }

  // Ochrona endpointów API (zwrócenie 401 zamiast przekierowania)
  if (!session && isApiPath && !isPublicApiPath) {
    return new Response(JSON.stringify({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      }
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return next();
});

export const onRequest = sequence(authMiddleware);
```

### 3.6. Rozszerzenie typów `env.d.ts`

**`src/env.d.ts` (rozszerzenie)**

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from './db/database.types';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      session: Session | null;
      user: User | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SITE_URL: string;
  readonly OPENROUTER_API_KEY: string;
}
```

---

## 4. System Autentykacji

### 4.1. Integracja Supabase Auth z Astro SSR

#### 4.1.1. Konfiguracja klienta Supabase dla SSR

Do obsługi autentykacji w trybie SSR wymagana jest instalacja pakietu `@supabase/ssr`:

```bash
npm install @supabase/ssr
```

**`src/db/supabase.server.ts`**

Nowy plik z funkcją tworzenia klienta Supabase dla SSR (obsługa cookies):

```typescript
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from './database.types';

export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookies.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
```

#### 4.1.2. Klient dla React (browser)

**`src/db/supabase.browser.ts`**

Klient Supabase dla komponentów React działających w przeglądarce:

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return browserClient;
}
```

### 4.2. Zarządzanie sesją

#### 4.2.1. Przechowywanie sesji

Supabase Auth przechowuje tokeny w cookies HTTP-only, co zapewnia:
- Automatyczne odświeżanie tokenów
- Ochronę przed XSS (tokeny niedostępne z JavaScript)
- Spójność sesji między SSR a CSR

#### 4.2.2. Odświeżanie tokenów

Middleware automatycznie odświeża tokeny przy każdym żądaniu dzięki metodzie `getSession()`, która:
1. Sprawdza ważność access token
2. Jeśli wygasł, używa refresh token do pobrania nowego
3. Aktualizuje cookies z nowymi tokenami

#### 4.2.3. Obsługa wygasłej sesji

Gdy refresh token wygaśnie:
1. `getSession()` zwraca `null`
2. Middleware przekierowuje do `/auth/login`
3. Użytkownik musi się ponownie zalogować

### 4.3. Ochrona zasobów

#### 4.3.1. Ochrona stron Astro (SSR)

Weryfikacja sesji odbywa się w middleware przed renderowaniem strony:

```astro
---
// src/pages/portfolio.astro
// Sesja jest już zweryfikowana przez middleware
const { session, user } = Astro.locals;

// Użytkownik jest zawsze zalogowany w tym miejscu
---
```

#### 4.3.2. Ochrona endpointów API

Każdy chroniony endpoint API weryfikuje sesję:

```typescript
// src/pages/api/portfolio/index.ts
export const GET: APIRoute = async (context) => {
  const { session, user } = context.locals;
  
  if (!session || !user) {
    return createErrorResponseObject(
      ErrorCode.UNAUTHORIZED,
      'Authentication required',
      401
    );
  }
  
  // ... reszta logiki z user.id
};
```

#### 4.3.3. Row Level Security (RLS)

Dane użytkowników są chronione na poziomie bazy danych przez RLS. Polityki są już zdefiniowane w schemacie bazy danych i działają automatycznie gdy:
1. Klient Supabase jest utworzony z tokenem sesji
2. Token zawiera `user_id` który jest używany przez RLS

### 4.4. Weryfikacja e-mail (wyłączona w MVP)

W wersji MVP weryfikacja e-mail jest **wyłączona**. Użytkownik jest automatycznie zalogowany po rejestracji.

#### 4.4.1. Konfiguracja Supabase dla MVP

W ustawieniach projektu Supabase (Authentication > Settings):
1. Wyłączyć opcję "Enable email confirmations"
2. Ustawić URL przekierowania dla reset hasła: `{SITE_URL}/auth/callback`

#### 4.4.2. Callback dla reset hasła

Strona callback obsługuje tylko przepływ resetowania hasła:

```typescript
// src/pages/auth/callback.astro
---
const { searchParams } = Astro.url;
const code = searchParams.get('code');

if (code) {
  const { data, error } = await Astro.locals.supabase.auth.exchangeCodeForSession(code);
  
  if (!error) {
    // Przekierowanie do strony ustawiania nowego hasła
    return Astro.redirect('/auth/reset-password');
  }
}

return Astro.redirect('/auth/login?error=invalid_code');
---
```

### 4.5. Reset hasła

#### 4.5.1. Przepływ resetowania

1. Użytkownik żąda resetu → `/api/auth/forgot-password`
2. Supabase wysyła e-mail z linkiem
3. Link kieruje do `/auth/reset-password` z tokenem
4. Token jest wymieniany na sesję w callback
5. Użytkownik ustawia nowe hasło → `/api/auth/reset-password`

#### 4.5.2. Obsługa tokenu recovery

```typescript
// src/pages/auth/reset-password.astro
---
const { hash } = Astro.url;
// Token jest w hash URL, obsługiwany przez Supabase Auth UI
---
```

### 4.6. Usunięcie DEFAULT_USER_ID

Po implementacji modułu autentykacji należy:

1. Usunąć stałą `DEFAULT_USER_ID` z `src/config/constants.ts`
2. Zaktualizować wszystkie endpointy API aby używały `context.locals.user.id`
3. Usunąć komentarze TODO dotyczące autentykacji

**Przykład migracji endpointu:**

```typescript
// PRZED (tymczasowy kod deweloperski):
const userId = DEFAULT_USER_ID;

// PO (produkcyjna implementacja):
const { user } = context.locals;
if (!user) {
  return createErrorResponseObject(ErrorCode.UNAUTHORIZED, 'Authentication required', 401);
}
const userId = user.id;
```

---

## 5. Struktura plików

### 5.1. Nowe pliki do utworzenia

```
src/
├── components/
│   └── auth/
│       ├── AuthCard.tsx
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       ├── ForgotPasswordForm.tsx
│       ├── ResetPasswordForm.tsx
│       └── UserMenu.tsx
├── db/
│   ├── supabase.browser.ts     (nowy)
│   └── supabase.server.ts      (nowy)
├── layouts/
│   └── AuthLayout.astro        (nowy)
├── lib/
│   ├── services/
│   │   └── auth.service.ts     (nowy)
│   └── validation/
│       └── auth.validation.ts  (nowy)
└── pages/
    ├── auth/
    │   ├── login.astro
    │   ├── register.astro
    │   ├── forgot-password.astro
    │   ├── reset-password.astro
    │   └── callback.astro
    └── api/
        └── auth/
            ├── register.ts
            ├── login.ts
            ├── logout.ts
            ├── forgot-password.ts
            ├── reset-password.ts
            └── session.ts
```

### 5.2. Pliki do modyfikacji

| Plik | Zakres zmian |
|------|--------------|
| `src/middleware/index.ts` | Pełna przebudowa - obsługa sesji |
| `src/env.d.ts` | Rozszerzenie typów Locals |
| `src/layouts/Layout.astro` | Przekazanie danych użytkownika |
| `src/components/AppNavigation.astro` | Integracja UserMenu |
| `src/lib/utils/error.utils.ts` | Nowe kody błędów |
| `src/config/constants.ts` | Usunięcie DEFAULT_USER_ID |
| `src/pages/api/profile.ts` | Usunięcie DEFAULT_USER_ID |
| `src/pages/api/portfolio/*.ts` | Usunięcie DEFAULT_USER_ID |
| `src/pages/api/sectors/*.ts` | Usunięcie DEFAULT_USER_ID |
| `src/pages/api/watchlist/*.ts` | Usunięcie DEFAULT_USER_ID |

---

## 6. Zależności

### 6.1. Nowe pakiety npm

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.0"
  }
}
```

### 6.2. Zmienne środowiskowe

Wymagane zmienne środowiskowe (`.env`):

```env
# Supabase (publiczne - dostępne w przeglądarce)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase (prywatne - tylko serwer)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Aplikacja
SITE_URL=http://localhost:3000
```

---

## 7. Uwagi implementacyjne

### 7.1. Kolejność implementacji

1. **Faza 1: Infrastruktura**
   - Instalacja `@supabase/ssr`
   - Utworzenie klientów Supabase (server/browser)
   - Rozszerzenie middleware
   - Rozszerzenie typów

2. **Faza 2: Backend**
   - Serwis autentykacji
   - Schematy walidacji
   - Endpointy API auth

3. **Faza 3: Frontend**
   - AuthLayout
   - Komponenty formularzy
   - Strony autentykacji
   - UserMenu i integracja z nawigacją

4. **Faza 4: Migracja**
   - Usunięcie DEFAULT_USER_ID
   - Aktualizacja wszystkich endpointów
   - Testy integracyjne

### 7.2. Testy

Zalecane testy:
- Jednostkowe: walidacja schematów Zod
- Integracyjne: przepływy autentykacji (register → login → logout)
- E2E: pełne scenariusze użytkownika

### 7.3. Bezpieczeństwo

- Wszystkie tokeny przechowywane w HTTP-only cookies
- Ochrona CSRF przez SameSite cookies
- Rate limiting na endpointach auth (konfiguracja Supabase)
- Nie logować haseł ani tokenów
- Używać HTTPS w produkcji

---

## 8. Zgodność z istniejącą architekturą

Specyfikacja została opracowana z zachowaniem zgodności z:
- Istniejącą strukturą katalogów projektu
- Konwencjami nazewnictwa plików i komponentów
- Wzorcami serwisów i walidacji (Zod)
- Stylowaniem Shadcn/ui + Tailwind
- Trybem SSR Astro (`output: "server"`)
- Row Level Security (RLS) w Supabase
- Istniejącymi typami DTO i encji

Implementacja nie narusza działania istniejących funkcjonalności:
- Portfolio, Watchlist i Profile zachowują dotychczasowe API
- Jedyna zmiana to zastąpienie `DEFAULT_USER_ID` rzeczywistym `user.id` z sesji
- Wszystkie istniejące komponenty pozostają bez zmian

