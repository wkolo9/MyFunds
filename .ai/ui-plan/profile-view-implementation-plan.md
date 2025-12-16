# Plan implementacji widoku Profil Użytkownika

## 1. Przegląd

Widok Profilu Użytkownika (`ProfileView`) służy do zarządzania ustawieniami konta oraz konfiguracji kategorii (sektorów) używanych w portfelu inwestycyjnym. Użytkownik może tutaj zmienić preferowaną walutę oraz zarządzać listą sektorów (dodawanie, edycja, usuwanie), które są kluczowe dla poprawnej kategoryzacji aktywów.

## 2. Routing widoku

*   **Ścieżka:** `/profile`
*   **Plik Astro:** `src/pages/profile.astro`

## 3. Struktura komponentów

Hierarchia komponentów dla tego widoku (Astro jako kontener, React dla interaktywności):

```text
src/pages/profile.astro (Layout, Server-side data pre-fetch option)
└── ProfileView.tsx (Client-side logic container)
    ├── ProfileHeader.tsx (Tytuł i opis)
    ├── UserSettingsCard.tsx (Karta ustawień konta)
    │   └── CurrencySelector.tsx (Komponent wyboru waluty: Select/Radio)
    └── SectorManagementCard.tsx (Karta zarządzania sektorami)
        ├── SectorAddForm.tsx (Formularz dodawania nowego sektora)
        ├── SectorList.tsx (Tabela wyświetlająca sektory)
        │   └── SectorRow.tsx (Wiersz tabeli z trybem edycji)
        └── DeleteSectorDialog.tsx (Modal potwierdzenia usunięcia - AlertDialog)
```

## 4. Szczegóły komponentów

### `ProfileView` (Container)
*   **Opis:** Główny kontener zarządzający pobieraniem danych i stanem globalnym widoku.
*   **Główne elementy:** `div` (wrapper), `UserSettingsCard`, `SectorManagementCard`, `Toaster` do powiadomień,  jest globalnie dostępny, używany jako useToast() w componencie React.
*   **Typy:** Brak propsów (pobiera dane wewnętrznie).

### `UserSettingsCard`
*   **Opis:** Wyświetla informacje o użytkowniku i pozwala zmienić walutę.
*   **Główne elementy:** `Card` (Shadcn), `CardHeader`, `CardContent`, `CurrencySelector`.
*   **Propsy:**
    *   `profile: ProfileDTO | null`
    *   `isLoading: boolean`
    *   `onCurrencyChange: (currency: Currency) => Promise<void>`

### `CurrencySelector`
*   **Opis:** Komponent UI do wyboru waluty (USD/PLN).
*   **Główne elementy:** `Select` lub `RadioGroup` (Shadcn).
*   **Obsługiwane zdarzenia:** `onChange` (zmiana wartości).
*   **Propsy:**
    *   `value: Currency`
    *   `disabled: boolean`
    *   `onChange: (value: Currency) => void`

### `SectorManagementCard`
*   **Opis:** Kontener dla logiki zarządzania sektorami.
*   **Główne elementy:** `Card`, `SectorAddForm`, `SectorList`.
*   **Propsy:**
    *   `sectors: SectorDTO[]`
    *   `isLoading: boolean`
    *   `onAdd: (name: string) => Promise<void>`
    *   `onEdit: (id: string, name: string) => Promise<void>`
    *   `onDelete: (id: string) => Promise<void>`

### `SectorAddForm`
*   **Opis:** Prosty formularz inline do dodawania nowego sektora.
*   **Główne elementy:** `Input`, `Button` (z ikoną Plus).
*   **Obsługiwane walidacja:** Niepusty ciąg znaków, unikalność nazwy (klient).
*   **Propsy:**
    *   `isSubmitting: boolean`
    *   `existingNames: string[]` (do walidacji)
    *   `onSubmit: (name: string) => void`

### `SectorList` & `SectorRow`
*   **Opis:** Tabela wyświetlająca sektory. Wiersz posiada tryb "Read" i "Edit".
*   **Główne elementy:** `Table` (Shadcn), `Input` (w trybie edycji), przyciski akcji (Edit, Save, Cancel, Delete).
*   **Stan lokalny (Row):** `isEditing` (boolean), `tempName` (string).
*   **Obsługiwane zdarzenia:** Wejście w tryb edycji, zapisanie zmian, anulowanie, kliknięcie usuń.
*   **Propsy (Row):**
    *   `sector: SectorDTO`
    *   `existingNames: string[]`
    *   `onSave: (id: string, newName: string) => Promise<void>`
    *   `onDeleteRequest: (id: string) => void`

### `DeleteSectorDialog`
*   **Opis:** Modal potwierdzający usunięcie sektora z ostrzeżeniem.
*   **Główne elementy:** `AlertDialog` (Shadcn).
*   **Propsy:**
    *   `open: boolean`
    *   `sectorName: string`
    *   `onConfirm: () => void`
    *   `onCancel: () => void`

## 5. Typy

Wykorzystanie istniejących typów z `src/types.ts`:

```typescript
// Wykorzystywane z types.ts
import type { 
  ProfileDTO, 
  SectorDTO, 
  Currency, 
  UpdateProfileCommand,
  CreateSectorCommand,
  UpdateSectorCommand
} from '../../types';

// Typy lokalne dla stanu widoku
export interface ProfileViewState {
  profile: ProfileDTO | null;
  sectors: SectorDTO[];
  isLoadingProfile: boolean;
  isLoadingSectors: boolean;
  error: string | null;
}
```

## 6. Zarządzanie stanem

Zalecane użycie niestandardowego hooka `useProfileData` w `ProfileView` do separacji logiki od widoku.

### Hook `useProfileData`
*   **Stan:**
    *   `profile`: Dane profilu.
    *   `sectors`: Tablica sektorów.
    *   `loading`: Stany ładowania dla profilu i sektorów.
*   **Metody:**
    *   `refreshData()`: Pobranie równoległe profilu i sektorów.
    *   `updateCurrency(currency: Currency)`: Wywołanie API i optymistyczna lub pasywna aktualizacja stanu.
    *   `addSector(name: string)`: Dodanie sektora i odświeżenie listy.
    *   `updateSector(id: string, name: string)`: Aktualizacja sektora.
    *   `deleteSector(id: string)`: Usunięcie sektora.

## 7. Integracja API

Integracja z endpointami zdefiniowanymi w `src/pages/api/`. Należy utworzyć serwis frontendowy `src/lib/api/profile.client.ts` (lub podobny) obsługujący `fetch`.

| Akcja | Metoda | Endpoint | Payload (Body) | Oczekiwany Wynik |
|-------|--------|----------|----------------|------------------|
| Pobierz profil | GET | `/api/profile` | - | `ProfileDTO` |
| Aktualizuj walutę | PATCH | `/api/profile` | `{ preferred_currency: "PLN" }` | `ProfileDTO` |
| Pobierz sektory | GET | `/api/sectors` | - | `{ sectors: SectorDTO[], total: number }` |
| Dodaj sektor | POST | `/api/sectors` | `{ name: "Nazwa" }` | `SectorDTO` |
| Edytuj sektor | PATCH | `/api/sectors/:id` | `{ name: "Nowa Nazwa" }` | `SectorDTO` |
| Usuń sektor | DELETE | `/api/sectors/:id` | - | `204 No Content` |

## 8. Mapowanie Danych i Transformacje

Szczegółowa analiza przepływu danych między API a interfejsem użytkownika, ze wskazaniem miejsc transformacji typów.

### Profil (`ProfileDTO`)

*   **Backend (API Response) -> Frontend (State):**
    *   `created_at` (`string` ISO 8601) -> `string` (Bez konwersji na `Date` w stanie, formatowanie tylko w widoku).
    *   `preferred_currency` (`enum Currency`) -> `enum Currency` (Bezpośrednie mapowanie).
*   **Frontend (Form) -> Backend (Request):**
    *   `UpdateProfileCommand` wymaga tylko pola `preferred_currency`.
    *   Brak transformacji typów.

### Sektory (`SectorDTO`)

*   **Backend (API Response) -> Frontend (State):**
    *   Endpoint zwraca obiekt `{ sectors: SectorDTO[], total: number }`.
    *   Frontend mapuje to na `SectorDTO[]` (płaska lista) w stanie aplikacji. Pole `total` jest ignorowane lub wykorzystywane tylko pomocniczo.
    *   `created_at` -> `string` (ISO 8601).
*   **Frontend (Form) -> Backend (Request):**
    *   **Tworzenie:** UI przekazuje `string` (nazwa). Backend oczekuje obiektu `{ name: string }`.
    *   **Edycja:** UI przekazuje `id` (z URL/props) i `string` (nazwa). Backend oczekuje obiektu `{ name: string }`.
    *   **Walidacja typów:** Frontend musi zapewnić `trim()` na stringach przed wysłaniem, aby zachować spójność.

### Kluczowe różnice typów (Type Mismatches)

1.  **Daty (`Date` vs `string`):**
    *   **Backend:** Przesyła daty jako ciągi znaków w formacie ISO 8601.
    *   **Frontend (Types):** Używa typu `string` dla pól daty w DTO.
    *   **Frontend (UI):** Wymaga konwersji `new Date(string)` lub użycia biblioteki formatującej bezpośrednio w JSX.
2.  **Identyfikatory (`UUID`):**
    *   Zarówno Backend jak i Frontend traktują UUID jako `string`.
3.  **Obsługa `null` vs `undefined`:**
    *   Frontendowe formularze mogą używać `undefined` lub `""` zamiast `null`. Wymagana konwersja przy inicjalizacji formularzy.

## 9. Interakcje użytkownika

1.  **Zmiana waluty:** Użytkownik wybiera walutę z dropdownu -> Loader na komponencie -> API request -> Toast "Zaktualizowano walutę".
2.  **Dodawanie sektora:** Użytkownik wpisuje nazwę -> Enter/Klik "Dodaj" -> Walidacja (niepuste, unikalne) -> API request -> Sektor pojawia się na liście -> Input czyszczony.
3.  **Edycja nazwy:** Klik "Ołówek" -> Tekst zmienia się w Input -> Zmiana nazwy -> Enter/Save -> API request -> Powrót do tekstu -> Toast sukcesu.
4.  **Usuwanie sektora:** Klik "Kosz" -> Modal z ostrzeżeniem "Aktywa trafią do Inne" -> Potwierdzenie -> API request -> Usunięcie z listy.

## 10. Warunki i walidacja

*   **Nazwa sektora (Dodawanie/Edycja):**
    *   **Wymagane:** Nie może być puste.
    *   **Unikalność:** Nazwa nie może występować na liście obecnych sektorów (case-insensitive). Sprawdzenie po stronie klienta przed wysłaniem żądania, aby uniknąć błędu 409, oraz obsługa błędu 409 z API.
    *   **Długość:** Min 1 znak, max np. 30 znaków (UI limit).

## 11. Obsługa błędów

*   **Błędy API (4xx/5xx):** Wyświetlenie powiadomienia typu "Toast" (np. z biblioteki `sonner` lub `radix-ui/toast`) z komunikatem błędu.
*   **Błąd 409 (Conflict):** Specjalny komunikat "Sektor o takiej nazwie już istnieje".
*   **Błąd 404 (Not Found):** Odświeżenie listy (być może ktoś inny usunął zasób).
*   **Błąd sieci:** Komunikat "Błąd połączenia".

## 12. Kroki implementacji

1.  **Przygotowanie serwisu API:** Utworzenie funkcji pomocniczych w `src/lib/api/` do komunikacji z endpointami `/api/profile` i `/api/sectors`.
2.  **Stworzenie Hooka:** Implementacja `useProfileData` zarządzającego stanem i logiką biznesową.
3.  **Implementacja UserSettingsCard:** Budowa komponentu wyświetlania ID i zmiany waluty.
4.  **Implementacja SectorAddForm:** Formularz z walidacją.
5.  **Implementacja SectorRow & List:** Tabela z logiką edycji inline.
6.  **Implementacja DeleteSectorDialog:** Modal potwierdzenia.
7.  **Złożenie widoku:** Integracja wszystkich komponentów w `ProfileView` i osadzenie w `src/pages/profile.astro`.
8.  **Stylowanie:** Dopracowanie wyglądu za pomocą Tailwind CSS i komponentów Shadcn/ui. Domyslne ustawienia stylu - Darkmode.
