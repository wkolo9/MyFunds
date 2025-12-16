# Plan implementacji widoku Portfolio (Dashboard)

## 1. Przegląd
Widok "Portfolio" jest centralnym punktem aplikacji (Dashboard), prezentującym stan majątkowy użytkownika. Umożliwia przeglądanie łącznej wartości portfela, analizę dywersyfikacji sektorowej na wykresie oraz zarządzanie listą aktywów (dodawanie, edycja, usuwanie). Kluczową funkcją jest obsługa wielowalutowości (USD/PLN) z dynamicznym przeliczaniem wartości oraz elastyczne przypisywanie sektorów (wybór istniejącego lub tworzenie nowego w locie).

**Stylistyka:** Aplikacja projektowana jest w podejściu **Dark Mode First**. Wszystkie komponenty i wykresy muszą być zoptymalizowane pod kątem wyświetlania na ciemnym tle.

## 2. Routing widoku
*   **Ścieżka:** `/` lub `/portfolio`
*   **Konfiguracja:** Strona powinna być zabezpieczona (dostępna tylko dla zalogowanych użytkowników). Zalecane przekierowanie z `/` na `/portfolio` w pliku `src/pages/index.astro`.

## 3. Struktura komponentów
Hierarchia plików w katalogu `src/components/portfolio`:

*   `PortfolioDashboard.tsx` (Główny kontener logiczny)
    *   `components/SummaryCard.tsx` (Podsumowanie wartości i wybór waluty)
    *   `components/SectorAllocationChart.tsx` (Wykres kołowy)
    *   `components/AssetTable.tsx` (Tabela aktywów)
        *   `components/AssetActions.tsx` (Menu akcji w wierszu tabeli)
    *   `components/AddAssetDialog.tsx` (Modal dodawania)
        *   `components/SectorSelect.tsx` (Wybór lub tworzenie sektora)
    *   `components/EditAssetDialog.tsx` (Modal edycji)
    *   `components/DeleteAssetAlert.tsx` (Potwierdzenie usunięcia)

## 4. Szczegóły komponentów

### `PortfolioDashboard`
*   **Opis:** Smart component zarządzający stanem widoku. Orkiestruje pobieranie danych i przekazuje je do komponentów prezentacyjnych.
*   **Główne elementy:** Układ Grid (CSS Grid) rozmieszczający karty podsumowania, wykresu i tabeli.
*   **Obsługiwane interakcje:** Inicjalizacja pobierania danych, obsługa zmiany waluty, zarządzanie widocznością modali.
*   **Typy:** `PortfolioListDTO`, `PortfolioSummaryDTO`.
*   **Propsy:** Brak (komponent najwyższego poziomu w widoku).

### `SummaryCard`
*   **Opis:** Wyświetla całkowitą wartość portfela i pozwala na zmianę waluty globalnej widoku.
*   **Główne elementy:** `Card`, sformatowana kwota, `ToggleGroup` lub `Tabs` do wyboru waluty (USD/PLN).
*   **Obsługiwane interakcje:** Kliknięcie w przełącznik waluty.
*   **Propsy:**
    *   `totalValue: number`
    *   `currency: Currency`
    *   `onCurrencyChange: (currency: Currency) => void`
    *   `isLoading: boolean`

### `SectorAllocationChart`
*   **Opis:** Wizualizuje rozkład portfela według sektorów.
*   **Główne elementy:** `ResponsiveContainer`, `PieChart`, `Pie` (donut), `Tooltip`, `Legend` (biblioteka `recharts`).
*   **Interakcje i Wygląd:**
    *   **Tooltip:** Po najechaniu kursorem na segment wykresu musi pojawić się dymek zawierający **nazwę sektora** oraz jego **udział procentowy** w portfelu.
    *   **Legenda:** Wykres musi posiadać czytelną legendę identyfikującą sektory kolorami.
    *   **Styl:** Kolory wykresu muszą być dostosowane do trybu **Dark Mode**.
*   **Propsy:**
    *   `data: SectorBreakdownDTO[]`
    *   `currency: Currency`

### `AssetTable`
*   **Opis:** Tabela wyświetlająca szczegóły aktywów. Używa `@tanstack/react-table`.
*   **Kolumny:**
    *   Ticker (Symbol)
    *   Sector (Badge z nazwą sektora)
    *   Quantity (Liczba, wyrównanie do prawej)
    *   Price (Cena jednostkowa w wybranej walucie)
    *   Value (Wartość całkowita w wybranej walucie)
    *   Actions (Dropdown: Edytuj, Usuń)
*   **Propsy:**
    *   `assets: PortfolioAssetDTO[]`
    *   `currency: Currency`
    *   `onEdit: (asset: PortfolioAssetDTO) => void`
    *   `onDelete: (asset: PortfolioAssetDTO) => void`

### `SectorSelect`
*   **Opis:** Hybrydowy komponent formularza. Pozwala wybrać sektor z listy LUB utworzyć nowy.
*   **Działanie:**
    *   Domyślnie `Select` (shadcn/ui) z listą sektorów pobraną z API.
    *   Ostatnia opcja w liście: `+ Utwórz nowy sektor`.
    *   Po wybraniu opcji tworzenia, komponent zmienia się w `Input` tekstowy z przyciskiem "Anuluj" (powrót do listy).
*   **Propsy:**
    *   `value: string | null` (ID wybranego sektora lub null dla "Inne")
    *   `onChange: (value: string | null) => void`
    *   `onNewSector: (name: string) => Promise<string>` (Callback tworzący sektor i zwracający jego ID)

### `AddAssetDialog` / `EditAssetDialog`
*   **Opis:** Modale z formularzem opartym na `react-hook-form` i `zod`.
*   **Pola:**
    *   Ticker (Input)
    *   Quantity (Input type="number")
    *   Sector (`SectorSelect`)
*   **Walidacja:**
    *   Ticker: wymagany, 1-10 znaków.
    *   Quantity: liczba dodatnia.
    *   Sector: opcjonalny.

## 5. Typy

Wykorzystanie typów zdefiniowanych w `src/types.ts`:

*   **Modele Danych:** `PortfolioAssetDTO`, `PortfolioSummaryDTO`, `SectorBreakdownDTO`, `SectorDTO`.
*   **Enumy:** `Currency` ('USD' | 'PLN').
*   **Komendy:** `CreatePortfolioAssetCommand`, `UpdatePortfolioAssetCommand`.

Nowe typy pomocnicze (lokalne):
*   `AssetFormData`: Typ dla `react-hook-form` (zawiera pola formularza przed wysłaniem).

## 6. Zarządzanie stanem

Logika biznesowa wydzielona do custom hooka `usePortfolio` (`src/components/portfolio/hooks/usePortfolio.ts`).

*   **Stan:**
    *   `assets`: Lista aktywów.
    *   `summary`: Dane podsumowania (wartość, sektory).
    *   `currency`: Aktualnie wybrana waluta (domyślnie 'USD' lub z preferencji użytkownika).
    *   `isLoading`: Flaga ładowania.
    *   `isRefreshing`: Flaga odświeżania (np. przy zmianie waluty).
*   **Akcje:**
    *   `refresh()`: Pobranie danych.
    *   `setCurrency(c)`: Zmiana waluty i przeładowanie danych.
    *   `addAsset(data)`: Wywołanie API i odświeżenie.
    *   `editAsset(id, data)`: Wywołanie API i odświeżenie.
    *   `removeAsset(id)`: Wywołanie API i odświeżenie.

## 7. Integracja API

Należy utworzyć klienta `src/lib/api/portfolio.client.ts`.

*   `GET /api/portfolio?currency={currency}` -> `PortfolioListDTO`
*   `GET /api/portfolio/summary?currency={currency}` -> `PortfolioSummaryDTO`
*   `POST /api/portfolio` -> `PortfolioAssetDTO`
*   `PATCH /api/portfolio/{id}` -> `PortfolioAssetDTO`
*   `DELETE /api/portfolio/{id}` -> `void`

Pomocniczo (w `src/lib/api/sector.client.ts`):
*   `GET /api/sectors` -> `SectorsListDTO`
*   `POST /api/sectors` -> `SectorDTO`

## 8. Interakcje użytkownika

1.  **Zmiana waluty:** Użytkownik klika "PLN" na karcie podsumowania. Aplikacja pokazuje stan ładowania (np. szkielety lub spinner) i pobiera przeliczone wartości z backendu.
2.  **Dodawanie aktywa (standardowe):** Użytkownik otwiera modal, wpisuje "AAPL", ilość "10", wybiera sektor "Technologia", zatwierdza.
3.  **Dodawanie aktywa (nowy sektor):**
    *   Użytkownik otwiera modal.
    *   W liście sektorów wybiera "Utwórz nowy...".
    *   Wpisuje nazwę "AI".
    *   Wypełnia resztę pól i zatwierdza.
    *   **Flow pod spodem:** Frontend najpierw wysyła żądanie utworzenia sektora "AI", otrzymuje jego ID, a następnie wysyła żądanie utworzenia aktywa z nowym `sector_id`.

## 9. Warunki i walidacja

*   **Formularz:**
    *   **Ticker:** Automatyczna konwersja na wielkie litery.
    *   **Quantity:** Walidacja, czy wartość jest liczbą > 0.
    *   **Sector:** Jeśli wybrano tryb tworzenia, nazwa nie może być pusta.
*   **API:**
    *   Obsługa błędu `404` (Ticker not found) - wyświetlenie błędu w formularzu, że taki ticker nie istnieje.
    *   Obsługa błędu `409` (Conflict) - jeśli logika biznesowa zabrania duplikatów.

## 10. Obsługa błędów

*   **Błędy formularza:** Wyświetlane inline pod polami input (z `react-hook-form`).
*   **Błędy API (Toasty):** Użycie `sonner` do wyświetlania komunikatów o sukcesie ("Aktywo dodane") lub błędzie ("Nie udało się pobrać kursu walut").
*   **Błędy krytyczne:** Jeśli nie uda się pobrać listy portfela, wyświetlenie komunikatu w miejscu tabeli z przyciskiem "Spróbuj ponownie".

## 11. Kroki implementacji

1.  **Przygotowanie API Clienta:** Utworzenie `src/lib/api/portfolio.client.ts` oraz `src/lib/api/sector.client.ts` (jeśli nie istnieje).
2.  **Implementacja Hooka:** Stworzenie `usePortfolio` z logiką pobierania i mutacji danych.
3.  **Komponenty UI - Podstawy:** Implementacja `SummaryCard` i szkieletu `PortfolioDashboard`.
4.  **Tabela i Wykres:** Implementacja `AssetTable` (konfiguracja kolumn TanStack Table) i `SectorAllocationChart` (Recharts).
5.  **Zarządzanie Sektorami:** Implementacja komponentu `SectorSelect` z logiką tworzenia nowego wpisu.
6.  **Formularze CRUD:** Implementacja `AddAssetDialog` i `EditAssetDialog` z walidacją Zod.
7.  **Integracja:** Złożenie wszystkiego w `PortfolioDashboard`, podpięcie zmiany waluty i akcji formularzy.
8.  **Routing:** Utworzenie strony Astro `src/pages/portfolio/index.astro`.

