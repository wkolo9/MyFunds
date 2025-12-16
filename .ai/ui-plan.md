# Architektura UI dla MyFunds (MVP-1)

## 1. Przegląd struktury UI

Interfejs użytkownika MyFunds zostanie zbudowany jako aplikacja typu SPA (Single Page Application) wewnątrz frameworka Astro (z wyłączonym SSR dla części interaktywnych - `client:only="react"`), wykorzystująca React 19 do zarządzania stanem i interakcjami.

Design system opiera się na **Shadcn/ui** (Tailwind CSS v4), z domyślnym trybem **Dark Mode**, co odpowiada standardom aplikacji finansowych. Architektura kładzie nacisk na czytelność danych, szybką reakcję na interakcje użytkownika (Optimistic UI tam, gdzie to możliwe) oraz elegancką obsługę błędów API (Graceful Degradation).

Główny układ opiera się na responsywnym kontenerze z nawigacją górną, która na urządzeniach mobilnych adaptuje się do formy "Segmented Control".

## 2. Lista widoków

### 2.1. Strona Logowania
*   **Ścieżka:** `/login`
*   **Główny cel:** Uwierzytelnienie użytkownika i przekierowanie do aplikacji.
*   **Kluczowe informacje:** Formularz logowania, Link do rejestracji.
*   **Kluczowe komponenty:**
    *   Karta Logowania (`Card`).
    *   Formularz (`Input`, `Label`, `Button`) z walidacją po stronie klienta.
    *   Obsługa błędów logowania (`Alert` / `Toast`).
*   **UX/Bezpieczeństwo:**
    *   Walidacja formatu e-mail w czasie rzeczywistym.
    *   Maskowanie hasła z opcją podglądu.
    *   Blokada przycisku podczas wysyłania żądania (stan `isSubmitting`).

### 2.2. Strona Rejestracji
*   **Ścieżka:** `/register`
*   **Główny cel:** Utworzenie nowego konta użytkownika.
*   **Kluczowe informacje:** Formularz rejestracji (E-mail, Hasło, Powtórz hasło).
*   **Kluczowe komponenty:**
    *   Karta Rejestracji.
    *   Wskaźnik siły hasła (opcjonalnie, tekst pomocniczy "min. 8 znaków").
*   **UX/Dostępność:**
    *   Jasne komunikaty o błędach (np. "Hasła nie są identyczne").
    *   Informacja o konieczności weryfikacji e-mail po sukcesie (ekran sukcesu lub przekierowanie z toatem).

### 2.3. Dashboard (Portfolio)
*   **Ścieżka:** `/` (lub `/portfolio`)
*   **Główny cel:** Prezentacja stanu majątkowego, alokacji sektorowej i zarządzanie listą aktywów.
*   **Kluczowe informacje:**
    *   Całkowita wartość portfela (Total Balance).
    *   Aktualny kurs wymiany USD/PLN.
    *   Wykres podziału na sektory.
    *   Szczegółowa lista posiadanych aktywów.
    *   Czas ostatniej aktualizacji danych.
*   **Kluczowe komponenty:**
    *   **Summary Card:** Duża cyfra wartości całkowitej + `CurrencyToggle` (USD/PLN).
    *   **Allocation Chart:** Wykres kołowy (Donut) biblioteki `Recharts` z interaktywną legendą.
    *   **Asset Table:** Tabela (`TanStack Table`) z kolumnami: Ticker, Ilość, Cena, Wartość, Sektor, Akcje (Edytuj/Usuń).
    *   **Add Fund Modal:** Dialog z walidacją tickera.
    *   **Empty State:** Widok zachęcający do dodania pierwszego aktywa, gdy portfel jest pusty.
*   **UX/Bezpieczeństwo:**
    *   Lazy loading danych historycznych dla wykresów.
    *   Szkielety ładowania (`Skeleton`) podczas pobierania danych.
    *   Tooltipy wyjaśniające obliczenia.
    *   Potwierdzenie usunięcia aktywa (`AlertDialog`).

### 2.4. Trading View (Watchlist)
*   **Ścieżka:** `/watchlist`
*   **Główny cel:** Monitorowanie kursów wybranych spółek na siatce wykresów.
*   **Kluczowe informacje:**
    *   Siatka wykresów świecowych (OHLC).
    *   Aktualna cena dla każdego waloru.
*   **Kluczowe komponenty:**
    *   **Chart Grid:** Kontener CSS Grid (4 kolumny desktop, 2 tablet, 1 mobile).
    *   **Sortable Item:** Kafelki obsługujące Drag & Drop (`dnd-kit`).
    *   **Candlestick Chart:** Komponent `Lightweight Charts` renderujący wykres.
    *   **Add Ticker Bar:** Pasek do szybkiego dodawania nowych wykresów.
*   **UX/Dostępność:**
    *   Płynne animacje przy zmianie kolejności (reorganizacja siatki).
    *   Obsługa klawiatury dla dostępności (nawigacja po siatce).
    *   Blokada dodawania powyżej 16 elementów (Toast warning).

### 2.5. Profil Użytkownika
*   **Ścieżka:** `/profile`
*   **Główny cel:** Zarządzanie ustawieniami konta i kategoriami (sektorami).
*   **Kluczowe informacje:**
    *   E-mail użytkownika (readonly).
    *   Tabela zarządzania sektorami.
*   **Kluczowe komponenty:**
    *   **User Info Card:** Podstawowe dane konta.
    *   **Sector Management Table:** Tabela z możliwością edycji nazwy sektora (inline edit) i usuwania.
    *   **Sector Add Input:** Proste pole do dodawania nowego sektora.
*   **UX/Bezpieczeństwo:**
    *   Ostrzeżenie przy usuwaniu sektora, że aktywa trafią do "Inne".
    *   Walidacja unikalności nazw sektorów.

## 3. Mapa podróży użytkownika (User Journey)

### Scenariusz A: Nowy użytkownik (Onboarding)
1.  **Wejście:** Użytkownik wchodzi na stronę główną -> Przekierowanie do `/login`.
2.  **Rejestracja:** Klika "Zarejestruj się" -> Wypełnia `/register` -> Sukces -> Przekierowanie do logowania.
3.  **Logowanie:** Loguje się -> Przekierowanie do `/portfolio`.
4.  **Empty State:** Widzi komunikat "Twój portfel jest pusty".
5.  **Dodanie Aktywa:**
    *   Klika "Add Fund".
    *   Modal: Wpisuje ticker "AAPL".
    *   System: Weryfikuje ticker w tle -> Wyświetla "Apple Inc." i zielony check.
    *   Użytkownik: Wpisuje ilość "10", wybiera sektor "Technologia" (tworzy nowy w locie).
    *   Zatwierdza.
6.  **Wynik:** Dashboard odświeża się, pokazuje wartość portfela i wykres alokacji (100% Technologia).

### Scenariusz B: Zarządzanie Watchlistą
1.  **Nawigacja:** Użytkownik przełącza się na zakładkę "Trading View".
2.  **Dodawanie:** Wpisuje "BTC-USD" w pasku dodawania -> Enter -> Nowy wykres pojawia się na końcu siatki.
3.  **Reorganizacja:** Chwyta nagłówek wykresu BTC i przeciąga go na pierwszą pozycję. Siatka przesuwa się.
4.  **Usuwanie:** Klika "X" na wykresie, który go nie interesuje. Wykres znika.

## 4. Układ i struktura nawigacji

### Global Layout (`MainLayout`)
Struktura wspólna dla wszystkich widoków po zalogowaniu:

1.  **Header (Pasek górny):**
    *   **Lewa strona:** Logo "MyFunds".
    *   **Środek (Nawigacja główna):**
        *   Desktop: Linki tekstowe "Portfolio" | "Trading View". Aktywny link wyróżniony kolorem/podkreśleniem.
        *   Mobile: Komponent `Segmented Control` (przełącznik) wyświetlany centralnie lub poniżej nagłówka, zapewniający łatwy dostęp kciukiem.
    *   **Prawa strona:**
        *   `CurrencyToggle` (opcjonalnie tutaj lub w Dashboardzie).
        *   `UserDropdown`: Ikona Avatara/Usera -> Menu: "Profil", "Wyloguj".

2.  **Main Content:**
    *   Kontener z maksymalną szerokością (np. `max-w-7xl`), wyśrodkowany, z paddingiem (`p-4` lub `p-6`).
    *   Obszar renderowania dynamicznych widoków (Outlet).

3.  **Toast Container:**
    *   Niewidoczny kontener dla powiadomień (Sonner/Toast), pozycjonowany w rogu ekranu (desktop) lub na górze/dole (mobile).

## 5. Kluczowe komponenty

### 5.1. `TickerCombobox` (Smart Input)
*   Komponent formularza łączący Input z Dropdownem.
*   **Działanie:** Debounce (500ms) na wejściu -> zapytanie do API (walidacja tickera) -> wyświetlenie nazwy spółki lub błędu.
*   **Cel:** Blokowanie formularza "Add Fund" do momentu wpisania poprawnego tickera.

### 5.2. `AllocationChart`
*   Wrapper na bibliotekę `Recharts` (PieChart).
*   Obsługuje responsywność (zmiana rozmiaru przy zmianie szerokości okna).
*   Zawiera logikę mapowania danych: `portfolioAssets` -> grupowanie po `sectorName` -> obliczanie %.
*   Customowy Tooltip przy hoverze.

### 5.3. `AssetTable`
*   Oparta na `TanStack Table` (headless UI).
*   Renderowana przy użyciu komponentów tabeli Shadcn (`Table`, `TableHeader`, `TableRow`...).
*   Obsługuje formatowanie liczb w zależności od waluty (USD/PLN) i typu aktywa (precyzja dla krypto vs akcje).
*   Zawiera kolumnę akcji z `DropdownMenu` (Edytuj, Usuń).

### 5.4. `SortableChartGrid`
*   Złożony komponent wykorzystujący `dnd-kit`.
*   Zarządza stanem kolejności ID wykresów.
*   Obsługuje strategię `rectSortingStrategy` dla siatki 2D.
*   Renderuje `ChartCard` jako elementy przeciągalne (Draggable).

### 5.5. `ChartCard`
*   Pojedynczy kafelek w siatce.
*   Nagłówek z Tickerem, Ceną i przyciskiem Usuń.
*   Body z wykresem `Lightweight Charts`.
*   Obsługa "uchwytu" do przeciągania (Drag Handle).
*   Stan ładowania (Skeleton) podczas pobierania danych historycznych.

### 5.6. `CurrencyToggle`
*   Przełącznik globalnego stanu waluty (Context).
*   Wymusza przeliczenie wszystkich wartości w aplikacji (Portfolio Total, Asset Value, Asset Price) przy użyciu zbuforowanego kursu wymiany.

