<analiza_projektu>
1. **Kluczowe komponenty projektu:**
   - **System Autentykacji i Autoryzacji:** Oparty na Supabase Auth. Wykorzystuje Middleware Astro do ochrony tras oraz RLS (Row Level Security) na poziomie bazy danych. Obsługuje logowanie, rejestrację, resetowanie hasła i wylogowanie.
   - **Zarządzanie Profilem (ProfileService):** Przechowuje preferencje użytkownika, w tym kluczową funkcjonalność zmiany waluty (USD/PLN), która wpływa na przeliczenia w całym systemie.
   - **Zarządzanie Sektorami (SectorService):** CRUD dla kategorii aktywów. Zawiera logikę biznesową: limit 32 sektorów na użytkownika oraz unikalność nazw.
   - **Portfel Inwestycyjny (PortfolioService):** Zarządzanie aktywami (ticker, ilość, sektor). Kluczowy element to wyliczanie wartości portfela w czasie rzeczywistym oraz agregacja danych do wykresów kołowych (SectorAllocationChart).
   - **Watchlist (WatchlistService):** Siatka 4x4 do monitorowania kursów. Obsługuje przeciąganie i upuszczanie (dnd-kit) oraz integrację z wykresami świecowymi (Lightweight Charts).
   - **Usługa Danych Rynkowych (MarketDataService):** Integracja z zewnętrznymi API (Yahoo Finance, Frankfurter). Posiada mechanizm buforowania (In-memory cache) z czasem życia (TTL) 1h.

2. **Specyfika stosu technologicznego i wpływ na testowanie:**
   - **Astro (Hybrid Rendering):** Wymaga testowania zarówno po stronie serwera (API, Middleware), jak i klienta (komponenty React wyspowe).
   - **Supabase:** Strategia testowa musi uwzględniać weryfikację polityk RLS – błędy w tym obszarze mogą prowadzić do wycieku danych między użytkownikami.
   - **React & dnd-kit:** Interaktywne elementy (reordering listy) wymagają testów E2E, aby upewnić się, że stan UI synchronizuje się z bazą danych po przeciągnięciu karty.
   - **Zod (Validation):** Silne typowanie i walidacja po stronie API ułatwia testowanie kontraktów (API Testing).
   - **Financial Math:** Użycie stringów dla `quantity` sugeruje potrzebę precyzyjnych testów obliczeń zmiennoprzecinkowych, aby uniknąć błędów zaokrągleń w wartości portfela.

3. **Priorytety testowe:**
   - **Priorytet 1 (Krytyczny):** Bezpieczeństwo (RLS, Auth), poprawność obliczeń finansowych (przeliczanie walut), stabilność MarketDataService (fallback przy błędach API zewnętrznych).
   - **Priorytet 2 (Wysoki):** CRUD portfela i sektorów, walidacja tickerów (czy system przyjmuje tylko istniejące symbole).
   - **Priorytet 3 (Średni):** UI/UX (Drag&Drop, responsywność tabel, tryb Dark/Light).

4. **Potencjalne obszary ryzyka:**
   - **Zależności zewnętrzne:** Yahoo Finance i Frankfurter API mogą nakładać limity (rate limiting). Testy muszą sprawdzić zachowanie systemu przy błędzie 429 lub braku odpowiedzi (Mocking).
   - **Cache Invalidation:** Ponieważ cache jest w pamięci (Map), w środowisku rozproszonym (np. serverless) może dochodzić do niespójności. Należy przetestować zachowanie flagi `cached: true/false`.
   - **Usuwanie Sektorów:** Ryzyko powstania "osieroconych" aktywów. Kod przewiduje przypisanie do "Other", co musi zostać bezwzględnie przetestowane.
   - **UUID i RLS:** Każdy endpoint API opiera się na `userId` z kontekstu. Należy sprawdzić, czy próba manipulacji ID w parametrach URL zostanie zablokowana.
</analiza_projektu>

# Plan Testów Projektu MyFunds (MVP)

## 1. Wprowadzenie i cele testowania
Celem niniejszego planu jest zdefiniowanie strategii zapewnienia jakości dla aplikacji MyFunds MVP. Głównym fokusem jest zagwarantowanie bezpieczeństwa danych finansowych użytkowników, poprawności obliczeń wartości portfela oraz niezawodności integracji z rynkowymi danymi zewnętrznymi.

## 2. Zakres testów
### 2.1. Funkcjonalności objęte testami:
*   **Autentykacja:** Rejestracja, logowanie (Supabase Auth), ochrona tras (Middleware).
*   **Profil:** Zmiana waluty preferowanej (USD/PLN), automatyczne tworzenie profilu.
*   **Sektory:** CRUD sektorów, walidacja unikalności, limity (32 szt.), obsługa usuwania (re-asancja aktywów).
*   **Portfel:** Dodawanie/edycja/usuwanie aktywów, walidacja tickerów, obliczanie wartości całkowitej i udziału procentowego.
*   **Watchlist:** Dodawanie tickerów (max 16), zmiana pozycji (DND), wyświetlanie wykresów świecowych.
*   **Market Data:** Pobieranie cen, kursów walut, mechanizm cache’owania (TTL 1h).

### 2.2. Funkcjonalności wyłączone z testów:
*   Wydajność wykresów przy tysiącach punktów danych (poza zakresem MVP).
*   Integracja z rzeczywistymi giełdami (tylko symulacja poprzez Yahoo Finance API).

## 3. Typy testów
*   **Testy Jednostkowe (Unit Tests):** Weryfikacja logiki usług (`services`) i walidacji Zod.
*   **Testy Integracyjne (API Tests):** Testowanie endpointów `/api/*` przy użyciu zmockowanego Supabase.
*   **Testy E2E (End-to-End):** Weryfikacja kluczowych ścieżek użytkownika (np. "Od rejestracji do stworzenia portfela").
*   **Testy Bezpieczeństwa:** Weryfikacja Row Level Security (RLS) – upewnienie się, że Użytkownik A nie widzi danych Użytkownika B.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Moduł Portfela i Walut
| ID | Opis scenariusza | Oczekiwany rezultat |
| :--- | :--- | :--- |
| ST-01 | Dodanie aktywa z błędnym tickerem (np. "INVALID123") | System zwraca błąd walidacji (400) po sprawdzeniu w MarketService. |
| ST-02 | Zmiana waluty profilu z USD na PLN | Wszystkie wartości w tabeli portfela i summary zostają przeliczone wg aktualnego kursu. |
| ST-03 | Usunięcie sektora, do którego przypisane są aktywa | Aktywa nie zostają usunięte, ich `sector_id` staje się `null` (kategoria "Other"). |

### 4.2. Moduł Watchlist i Cache
| ID | Opis scenariusza | Oczekiwany rezultat |
| :--- | :--- | :--- |
| ST-04 | Przekroczenie limitu 16 elementów na watchlist | Próba dodania 17. tickera kończy się błędem 400 i komunikatem o limicie. |
| ST-05 | Reordering elementów na siatce 4x4 | Nowa kolejność (`grid_position`) jest trwale zapisywana w bazie; UI odświeża się poprawnie. |
| ST-06 | Ponowne zapytanie o tę samą cenę w ciągu <1h | Dane są zwracane z flagą `cached: true`, bez wywołania API Yahoo Finance. |

### 4.3. Bezpieczeństwo (RLS)
| ID | Opis scenariusza | Oczekiwany rezultat |
| :--- | :--- | :--- |
| ST-07 | Próba usunięcia sektora innego użytkownika przez ID w API | Serwer zwraca 404 lub 403 (RLS blokuje dostęp do wiersza). |

## 5. Środowisko testowe
*   **Lokalne:** Node.js 20+, Supabase CLI (Local Stack).
*   **Staging:** Vercel/Netlify (Preview Deploys) połączone z testową instancją Supabase.
*   **Baza danych:** Czyste dane startowe (seed) dla każdego cyklu testów automatycznych.

## 6. Narzędzia
*   **Vitest:** Testy jednostkowe i integracyjne (obecne w strukturze projektu).
*   **Playwright:** Testy E2E (zalecane do weryfikacji komponentów interaktywnych).
*   **Postman/Insomnia:** Testowanie manualne endpointów API.
*   **Supabase Dashboard:** Monitorowanie logów RLS i stanu bazy.

## 7. Harmonogram testów
*   **Testy jednostkowe:** Uruchamiane przy każdym `git push` (CI).
*   **Testy integracyjne:** Uruchamiane przed scaleniem do gałęzi `main`.
*   **Testy regresji:** Pełny cykl przed każdym wdrożeniem wersji produkcyjnej.

## 8. Kryteria akceptacji
*   100% testów krytycznych (Priorytet 1) przechodzi pomyślnie.
*   Brak błędów typu "Critical" i "High" w raporcie błędów.
*   Pokrycie kodu testami (Code Coverage) dla folderu `lib/services` na poziomie min. 80%.
*   Wykresy rynkowe ładują się w czasie poniżej 2 sekund przy stabilnym łączu.

## 9. Procedury raportowania błędów
Błędy należy zgłaszać w systemie śledzenia zadań (np. GitHub Issues) według szablonu:
1.  **Tytuł:** Zwięzły opis problemu.
2.  **Krok po kroku:** Jak wywołać błąd.
3.  **Oczekiwany rezultat:** Co powinno się stać.
4.  **Rzeczywisty rezultat:** Co się stało (zrzut ekranu / logi konsoli).
5.  **Środowisko:** Przeglądarka, system operacyjny, ID użytkownika (jeśli dotyczy).
6.  **Priorytet:** (Low/Medium/High/Critical).