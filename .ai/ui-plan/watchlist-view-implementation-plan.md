# Plan implementacji widoku Watchlist (Trading View)

## 1. Przegląd

Widok Watchlist służy do monitorowania kursów wybranych spółek w formie siatki interaktywnych wykresów świecowych. Umożliwia użytkownikom dodawanie walorów do listy obserwowanych, usuwanie ich oraz zmianę ich kolejności za pomocą mechanizmu Drag & Drop.

## 2. Routing widoku

*   **Ścieżka:** `/watchlist`
*   **Dostęp:** Wymagane uwierzytelnienie (chroniona strona).

## 3. Struktura komponentów

```text
src/pages/watchlist.astro (Strona Astro)
└── WatchlistManager.tsx (Główny kontener React - Client only)
    ├── WatchlistHeader.tsx (Nagłówek i formularz dodawania)
    │   └── TickerSearch.tsx (Input/Combobox do wyszukiwania)
    └── WatchlistGrid.tsx (Kontener siatki z kontekstem DnD)
        └── SortableChartCard.tsx (Element sortowalny dnd-kit)
            └── ChartCard.tsx (Wizualna reprezentacja karty)
                ├── ChartHeader.tsx (Ticker, Cena, Przycisk usuwania)
                └── CandleChart.tsx (Wrapper na Lightweight Charts)
```

## 4. Szczegóły komponentów

### `WatchlistManager`
*   **Opis:** Główny komponent zarządzający stanem całej listy. Pobiera dane początkowe, obsługuje logikę biznesową (dodawanie, usuwanie, przesuwanie) i przekazuje stan do dzieci.
*   **Główne elementy:** `div` (kontener layoutu), `Toaster` (powiadomienia).
*   **Typy:** `WatchlistItemDTO[]`.
*   **Zarządzanie stanem:** Używa hooka `useWatchlist`.

### `WatchlistHeader`
*   **Opis:** Pasek narzędzi zawierający tytuł widoku oraz formularz dodawania nowej spółki.
*   **Propsy:**
    *   `onAddTicker: (ticker: string) => Promise<void>`
    *   `isAdding: boolean`
    *   `currentCount: number`
    *   `maxItems: number`

### `TickerSearch`
*   **Opis:** Komponent wejściowy (Input lub Combobox) pozwalający wpisać symbol spółki (np. "AAPL").
*   **Walidacja:** Sprawdza czy pole nie jest puste.
*   **Obsługiwane zdarzenia:** `onSubmit`.

### `WatchlistGrid`
*   **Opis:** Kontener implementujący `DndContext` i `SortableContext` z biblioteki `@dnd-kit`. Odpowiada za renderowanie siatki (CSS Grid) i obsługę zdarzeń przeciągania.
*   **Główne elementy:** `DndContext`, `SortableContext`, siatka CSS (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4`).
*   **Propsy:**
    *   `items: WatchlistItemDTO[]`
    *   `onReorder: (newOrder: string[]) => void`
    *   `onDelete: (id: string) => void`

### `SortableChartCard`
*   **Opis:** Wrapper używający hooka `useSortable` z `@dnd-kit` do nadania karcie właściwości przeciągania.
*   **Propsy:**
    *   `item: WatchlistItemDTO`
    *   `onDelete: (id: string) => void`

### `ChartCard`
*   **Opis:** Komponent prezentacyjny pojedynczego kafelka. Wyświetla nagłówek z ceną oraz wykres.
*   **Główne elementy:** `Card` (shadcn/ui), `Button` (usuwanie).
*   **Propsy:**
    *   `ticker: string`
    *   `price: number`
    *   `onDelete: () => void`
    *   `dragHandleProps`: propsy z dnd-kit do chwytania.

### `CandleChart`
*   **Opis:** Komponent renderujący wykres świecowy przy użyciu biblioteki **TradingView Lightweight Charts** (`lightweight-charts`). Musi obsługiwać responsywność i zmianę rozmiaru kontenera (`ResizeObserver`). Wyświetla dane w interwale dziennym (1D).
*   **Główne elementy:** `div` (kontener DOM dla instancji wykresu).
*   **Propsy:**
    *   `ticker: string`
    *   `data?: CandleData[]` (dane świecowe OHLC).
    *   `height: number`
    *   `colors?: { up: string, down: string }` (opcjonalna konfiguracja kolorów).
*   **Logika:** 
    *   Inicjalizacja instancji `createChart` przy montowaniu.
    *   Konfiguracja serii typu `CandlestickSeries`.
    *   Pobieranie historycznych danych dziennych (Daily OHLC) dla danego tickera.

## 5. Typy

Wykorzystujemy typy zdefiniowane w `src/types.ts` oraz dodajemy nowe specyficzne dla wykresów.

```typescript
// Istniejące w src/types.ts
import type { WatchlistItemDTO } from '@/types';

// Nowe typy (do zdefiniowania w komponencie lub types.ts jeśli używane szerzej)
export interface CandleData {
  time: string; // 'yyyy-mm-dd'
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface WatchlistState {
  items: WatchlistItemDTO[];
  isLoading: boolean;
  error: string | null;
}
```

## 6. Zarządzanie stanem

Główny stan aplikacji będzie zarządzany przez custom hook `useWatchlist`.

### `useWatchlist` Hook
*   **Stan:**
    *   `items`: Tablica `WatchlistItemDTO`.
    *   `loading`: Boolean.
*   **Funkcje:**
    *   `fetchItems()`: GET `/api/watchlist`.
    *   `addItem(ticker: string)`: POST `/api/watchlist`. Optimistic update (dodanie do listy) -> Request -> Revert on fail.
    *   `removeItem(id: string)`: DELETE `/api/watchlist/${id}`. Optimistic update.
    *   `reorderItems(activeId: string, overId: string)`:
        1.  Lokalna aktualizacja stanu (swap pozycji w tablicy).
        2.  Debounced (lub `onDragEnd`) wywołanie PATCH `/api/watchlist/positions` z nowymi pozycjami.

### Stan Wykresu (`useChartData`)
Każdy komponent `CandleChart` może zarządzać własnym pobieraniem danych historycznych (niezależnie od głównej listy), aby nie blokować renderowania całej siatki.

## 7. Integracja API

Integracja z endpointami opisanymi w planie API.

1.  **Pobranie listy:**
    *   Metoda: `GET /api/watchlist`
    *   Odpowiedź: `WatchlistListDTO` (`{ items: WatchlistItemDTO[], ... }`)

2.  **Dodanie elementu:**
    *   Metoda: `POST /api/watchlist`
    *   Body: `{ ticker: string, grid_position: number }`
    *   Odpowiedź: `WatchlistItemDTO`

3.  **Usunięcie elementu:**
    *   Metoda: `DELETE /api/watchlist/{id}`

4.  **Aktualizacja pozycji (Batch):**
    *   Metoda: `PATCH /api/watchlist/positions`
    *   Body: `{ updates: { id: string, grid_position: number }[] }`
    *   Odpowiedź: `BatchUpdateWatchlistItemsDTO`

5.  **Dane historyczne (do wykresu):**
    *   Potrzebny będzie nowy endpoint lub serwis klienta (np. `yahoo-finance2` proxy) do pobrania świeczek OHLC dla danego tickera. Na potrzeby MVP można użyć mocka lub istniejącego endpointu `/api/market/price/{ticker}` (jeśli zostanie rozszerzony o historię) lub dedykowanego endpointu `/api/market/candles/{ticker}`. *Założenie: Stworzymy funkcję pomocniczą w `lib/api` do pobierania danych.*

## 8. Interakcje użytkownika

1.  **Dodawanie spółki:**
    *   Użytkownik wpisuje ticker w polu input.
    *   Klika "Dodaj" lub wciska Enter.
    *   System waliduje limit (max 16).
    *   Spółka pojawia się na końcu siatki.

2.  **Przenoszenie (Reorder):**
    *   Użytkownik chwyta za nagłówek karty (Cursor: grab).
    *   Przeciąga kartę nad inną pozycję.
    *   Karty zamieniają się miejscami w czasie rzeczywistym (wizualnie).
    *   Po upuszczeniu (drop), nowa kolejność jest zapisywana w backendzie.

3.  **Usuwanie:**
    *   Użytkownik klika ikonę "X" lub kosza na karcie.
    *   Karta znika z siatki.
    *   Pozostałe karty przesuwają się, aby wypełnić lukę.

## 9. Warunki i walidacja

1.  **Limit elementów:**
    *   Przed wysłaniem żądania dodania, sprawdź czy `items.length < 16`.
    *   Jeśli `>= 16`, wyświetl `toast.error("Maximum number of charts reached (16)")`.

2.  **Duplikaty:**
    *   Frontend powinien sprawdzić, czy ticker już istnieje na liście.
    *   API zwróci `409 Conflict`, jeśli ticker istnieje – obsłużyć ten błąd wyświetlając odpowiedni komunikat.

3.  **Poprawność Tickera:**
    *   API zwróci błąd, jeśli ticker nie zostanie znaleziony w serwisie rynkowym. Obsłużyć błąd w formularzu.

## 10. Obsługa błędów

*   **Błąd ładowania listy:** Wyświetl komponent pustego stanu z przyciskiem "Spróbuj ponownie".
*   **Błąd dodawania:** Toast z błędem ("Ticker not found", "Limit reached"). Cofnięcie optimistic update (jeśli zastosowano).
*   **Błąd zapisu kolejności:** Toast z błędem "Failed to save layout". Opcjonalnie cofnięcie zmian w UI.
*   **Błąd danych wykresu:** Jeśli konkretny wykres nie może pobrać danych historycznych, wyświetl placeholder "No data" zamiast pustego canvasu.

## 11. Kroki implementacji

1.  **Instalacja zależności:**
    *   Dodać `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
    *   Dodać `lightweight-charts`.

2.  **Serwis API:**
    *   Utworzyć `src/lib/api/watchlist.client.ts` z funkcjami `getWatchlist`, `addItem`, `removeItem`, `updatePositions`.
    *   Utworzyć `src/lib/api/market.client.ts` (jeśli nie istnieje) do pobierania danych świecowych (mock lub podpięcie pod istniejące API).

3.  **Hook `useWatchlist`:**
    *   Zaimplementować logikę stanu, pobierania danych i mutacji.

4.  **Komponent `CandleChart`:**
    *   Stworzyć komponent React wrapper na `lightweight-charts`.
    *   Zaimplementować `ResizeObserver`.
    *   Dodać pobieranie danych historycznych wewnątrz komponentu.

5.  **Komponenty Grid i Karty:**
    *   Zaimplementować `SortableChartCard` i `ChartCard` używając komponentów UI (Card, Button).
    *   Skonfigurować `WatchlistGrid` z `DndContext`.

6.  **Komponent Nagłówka:**
    *   Zaimplementować formularz dodawania z walidacją limitu 16 elementów.

7.  **Złożenie strony:**
    *   Utworzyć `src/pages/watchlist.astro`.
    *   Osadzić `WatchlistManager` z dyrektywą `client:only="react"`.

