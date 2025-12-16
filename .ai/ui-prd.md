Oto zaktualizowane podsumowanie planowania PRD, uwzględniające Twoje ostatnie decyzje dotyczące źródła danych, obsługi błędów i zarządzania sektorami.

<conversation_summary>

<decisions>

1.  **Struktura Nawigacji:** Aplikacja wykorzystuje górny pasek (Header) z dwiema głównymi zakładkami: "Portfolio" i "Trading View" oraz ikoną profilu po prawej stronie. Na mobile zakładki realizowane jako "Segmented Control".
2.  **Zarządzanie Stanem:** Wykorzystanie **React Context** do przechowywania danych sesji i ustawień globalnych po zalogowaniu.
3.  **Źródło Danych:** Backend wykorzystuje bibliotekę **`yahoo-finance2`** (Node.js) do pobierania danych rynkowych i historycznych.
4.  **Biblioteki UI/Wykresów:**
    *   "Trading View": **Lightweight Charts** (wykresy świecowe OHLC, interwał 1D).
    *   "Portfolio": **Recharts** (wykres kołowy/donat alokacji).
    *   Drag & Drop: **dnd-kit**.
5.  **Walidacja Formularza "Add Fund":** Wymagana walidacja tickera przed wysłaniem formularza (blocking). Sukces walidacji (zielony check + nazwa spółki) jest konieczny do aktywacji przycisku "Dodaj".
6.  **Obsługa Błędów (Soft Validation):** W przypadku problemów z pobraniem ceny dla poprawnego tickera lub innych błędów niekrytycznych, system wyświetla powiadomienie typu **Toast**.
7.  **Zarządzanie Sektorami:**
    *   Usuwanie sektora zawierającego aktywa powoduje automatyczne przeniesienie ich do kategorii "Inne".
    *   W profilu użytkownika znajduje się **Tabela** do zarządzania sektorami (edycja nazw, usuwanie).
8.  **Tryb Ciemny/Jasny:** Domyślnie **Dark Mode**. Przełącznik w dropdownie zmienia motyw tylko lokalnie (bez zapisu w DB).
9.  **Dane Rynkowe:** Brak odświeżania w czasie rzeczywistym. Lazy loading danych historycznych na wykresach.
10. **Responsywność Siatki (Watchlist):** Desktop (4 kolumny), Tablet (2 kolumny), Mobile (1 kolumna, brak edycji układu).

</decisions>

<matched_recommendations>

1.  Zastosowanie układu Dashboardu: Karta wartości całkowitej + Wykres alokacji + Tabela aktywów.
2.  Implementacja "Empty State" z wyraźnym Call-to-Action dla nowych użytkowników.
3.  Wykorzystanie Astro Middleware do zabezpieczenia routingu.
4.  Zastosowanie Combobox/AsyncSelect z Debounce (500ms) do wprowadzania Tickerów.
5.  Formatowanie liczb adaptacyjne (6-8 miejsc po przecinku dla krypto < 1.00, 2 miejsca dla reszty).
6.  Mechanizm potwierdzania usunięcia aktywa (Alert Dialog).
7.  Kolorystyka wykresów świecowych zgodna ze standardem finansowym (Zielony/Czerwony).

</matched_recommendations>

<prd_planning_summary>

**a. Główne wymagania funkcjonalne (MVP):**
*   **Portfolio Dashboard:** Wyświetlanie całkowitej wartości (PLN/USD), alokacji sektorowej oraz tabelarycznej listy aktywów z możliwością edycji (ilość, sektor) i usuwania.
*   **Dodawanie Aktywów:** Modal z walidacją tickera (via API -> `yahoo-finance2`), wyborem sektora i podaniem ilości.
*   **Trading View (Watchlist):** Siatka do 16 kafelków z wykresami świecowymi. Obsługa dodawania, edycji tickera i zmiany kolejności (D&D - desktop).
*   **Profil Użytkownika:** Dropdown z ustawieniami oraz dedykowany widok/modal z Tabelą do zarządzania nazwami sektorów.

**b. Kluczowe historie użytkownika i ścieżki:**
1.  **Onboarding:** Użytkownik loguje się -> Widzi "Empty State" -> Klika "Add Fund" -> Wyszukuje Ticker -> Dodaje ilość i sektor -> Widzi zaktualizowany Dashboard.
2.  **Obsługa Błędów:** Użytkownik wpisuje ticker -> System nie może pobrać ceny -> Wyświetla się Toast z informacją o problemie z danymi zewnętrznymi.
3.  **Zarządzanie Sektorami:** Użytkownik wchodzi w Profil -> Widzi tabelę sektorów -> Zmienia nazwę sektora "Tech" na "Technologia" -> Zmiana odzwierciedla się w Portfolio.

**c. Kryteria sukcesu i metryki:**
*   Poprawne mapowanie danych z `yahoo-finance2` na strukturę aplikacji.
*   Czytelność interfejsu w domyślnym Dark Mode.
*   Płynne działanie siatki wykresów przy 16 elementach.
*   Skuteczne informowanie użytkownika o błędach API za pomocą Toastów.

**d. Aspekty techniczne UI:**
*   **Stack:** Astro 5 + React 19 + Tailwind 4 + Shadcn/ui.
*   **Data Fetching:** Pośrednictwo API (`src/pages/api/...`) między UI a `yahoo-finance2`.
*   **Komponenty:** Tabela (TanStack Table lub prosta tabela HTML/Tailwind), Toaster (Sonner lub Shadcn toast), Wykresy (Lightweight Charts, Recharts).

</prd_planning_summary>

<unresolved_issues>

Brak krytycznych nierozwiązanych kwestii na tym etapie planowania. Wszystkie kluczowe decyzje architektoniczne dla MVP zostały podjęte.

</unresolved_issues>

</conversation_summary>