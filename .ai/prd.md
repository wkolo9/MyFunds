# Dokument wymagań produktu (PRD) - MyFunds

## 1. Przegląd produktu

MyFunds (MVP-1) to aplikacja webowa zaprojektowana, aby zapewnić użytkownikom skonsolidowany i uproszczony widok ich zdywersyfikowanego portfela finansowego. Aplikacja umożliwia użytkownikom ręczne wprowadzanie posiadanych aktywów (np. akcji, kryptowalut), a następnie śledzi ich łączną wartość, oblicza rozkład portfela na poszczególne sektory oraz prezentuje te dane w jednej, wybranej przez użytkownika walucie (USD lub PLN). Dodatkowo, MyFunds oferuje dedykowaną stronę do monitorowania wykresów cenowych wybranych przez użytkownika spółek w formie konfigurowalnej siatki.

Celem MVP jest dostarczenie podstawowych narzędzi do pasywnego przeglądania zagregowanych danych portfelowych bez integracji z giełdami czy zaawansowanej analityki.

Architektura (MVP): Aplikacja webowa (React + Astro) z backendem wykorzystującym buforowanie danych (cache in-memory) w celu ograniczenia zapytań do darmowych API. Aplikacja w fazie MVP będzie hostowana lokalnie.

## 2. Problem użytkownika

Inwestorzy posiadający zdywersyfikowane portfele (obejmujące różne klasy aktywów, jak akcje z różnych giełd czy kryptowaluty) napotykają na następujące problemy:

1.  Brak jednego miejsca do śledzenia łącznej wartości wszystkich swoich aktywów.
2.  Konieczność ręcznego przeliczania wartości portfela na jedną, wspólną walutę (np. z EUR i BTC na PLN).
3.  Trudność w szybkiej ocenie alokacji portfela, tj. jaki procent inwestycji znajduje się w poszczególnych sektorach (np. technologia, finanse, surowce).
4.  Potrzeba monitorowania wielu wykresów cenowych na różnych platformach lub w wielu oknach przeglądarki.

MyFunds adresuje te problemy, oferując centralny pulpit nawigacyjny, który automatyzuje agregację wartości, konwersję walut, wizualizację sektorów oraz prezentuje konfigurowalną listę obserwowanych wykresów.

## 3. Wymagania funkcjonalne

### 3.1. System kont użytkowników
* Użytkownik musi mieć możliwość rejestracji konta przy użyciu adresu e-mail i hasła.
* Wymagane jest silne hasło (minimum 8 znaków).
* Wymagana jest podstawowa weryfikacja adresu e-mail (mechanizm do ustalenia, np. link weryfikacyjny).
* Użytkownik musi mieć możliwość zalogowania się przy użyciu swoich poświadczeń.
* Użytkownik musi mieć możliwość wylogowania się.

### 3.2. Zarządzanie portfelem (CRUD)
* Użytkownik musi mieć możliwość dodania nowego aktywa do swojego portfela.
    * Wymagane pola: Ticker/Symbol (identyfikator z API), Ilość.
* Użytkownik musi mieć możliwość edycji ilości posiadanego aktywa.
* Użytkownik musi mieć możliwość usunięcia aktywa ze swojego portfela.
* Wszystkie operacje CRUD na portfelu odbywają się na stronie profilu użytkownika.
* Aktywa są ograniczone do tych, które są dostępne poprzez wybrane darmowe API (brak możliwości dodawania aktywów własnych, np. "nieruchomość").

### 3.3. Zarządzanie sektorami
* Podczas dodawania lub edycji aktywa, użytkownik musi mieć możliwość przypisania go do sektora.
* Interfejs wyboru sektora (dropdown) musi zawierać opcję "Dodaj nowy sektor", pozwalającą na dynamiczne tworzenie własnych kategorii.
* Aktywa nieprzypisane do sektora powinny być grupowane w domyślnym sektorze "Inne".

### 3.4. Pulpit Portfela
* Aplikacja musi wyświetlać łączną bieżącą wartość portfela użytkownika.
* Aplikacja musi wyświetlać rozkład portfela na zdefiniowane przez użytkownika sektory (np. w formie procentowej listy lub wykresu kołowego).
* Użytkownik musi mieć możliwość przełączania waluty bazowej portfela między USD (domyślnie) a PLN.
* Po zmianie waluty, wszystkie wartości w portfelu muszą zostać automatycznie przeliczone na podstawie aktualnego (buforowanego) kursu walutowego.

### 3.5. Strona Śledzenia (Wykresy)
* Aplikacja musi udostępniać stronę z siatką do wyświetlania wykresów cenowych.
* Siatka musi mieć rozmiar 4x4, pozwalając na jednoczesne wyświetlanie maksymalnie 16 wykresów.
* Użytkownik musi mieć możliwość dodawania nowych spółek (wg tickera) do siatki.
* Użytkownik musi mieć możliwość usuwania wykresów z siatki.
* Użytkownik musi mieć możliwość zmiany kolejności/pozycji wykresów w siatce za pomocą mechanizmu "przeciągnij i upuść" (drag & drop).

### 3.6. Dane i System
* Dane cenowe aktywów oraz kursy walut (USD/PLN) muszą być pobierane z zewnętrznych, darmowych API.
* Dane pobrane z API muszą być buforowane po stronie backendu (np. w pamięci) z czasem życia (TTL) wynoszącym około 1 godziny.
* Aplikacja musi wyraźnie wyświetlać informację o czasie ostatniego odświeżenia danych (np. "Dane z godz. 14:30").
* W przypadku błędu pobierania danych z API, aplikacja musi wyświetlić użytkownikowi stosowny komunikat (np. "Dane chwilowo niedostępne") zamiast błędu systemowego.
* Aplikacja w wersji MVP będzie hostowana lokalnie.
* Brak śledzenia historycznej wartości portfela (wyświetlana jest tylko bieżąca wartość "tu i teraz").

## 4. Granice produktu

Następujące funkcje i cechy są świadomie wykluczone z zakresu MVP-1:

* Współdzielenie portfela lub jakichkolwiek informacji między użytkownikami.
* Handel, składanie zleceń lub jakakolwiek integracja z platformami transakcyjnymi.
* Integracja z kontami maklerskimi lub bankowymi (wszystkie dane portfelowe wprowadzane są ręcznie).
* Dodawanie aktywów niestandardowych, które nie są dostępne w API (np. nieruchomości, dzieła sztuki, gotówka).
* Śledzenie historii wartości portfela (np. wykres wartości portfela w czasie).
* Zaawansowana analityka, rekomendacje inwestycyjne lub alerty cenowe.
* Hosting w chmurze i skalowalna infrastruktura (MVP hostowane lokalnie).
* Rozbudowane funkcje profilu użytkownika (np. awatary, zmiana hasła - poza rejestracją).

## 5. Historyjki użytkowników

### 5.1. Uwierzytelnianie i Zarządzanie Kontem

ID: US-001
Tytuł: Rejestracja nowego użytkownika
Opis: Jako nowy użytkownik, chcę móc zarejestrować konto w aplikacji używając mojego adresu e-mail i hasła, aby uzyskać dostęp do funkcji portfela.
Kryteria akceptacji:
1.  Formularz rejestracji zawiera pola: e-mail, hasło, powtórz hasło.
2.  Walidacja po stronie klienta sprawdza, czy hasła się zgadzają.
3.  Walidacja po stronie serwera sprawdza, czy e-mail nie jest już zajęty.
4.  Walidacja po stronie serwera sprawdza, czy hasło ma co najmniej 8 znaków.
5.  Po pomyślnej rejestracji, użytkownik jest automatycznie logowany (lub przekierowywany do logowania) i uzyskuje dostęp do aplikacji.
6.  Weryfikacja e-mail jest opcjonalna w MVP i nie blokuje dostępu do konta.

ID: US-002
Tytuł: Logowanie użytkownika
Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji podając mój e-mail i hasło, aby uzyskać dostęp do aplikacji.
Kryteria akceptacji:
1.  Formularz logowania zawiera pola: e-mail, hasło.
2.  Po pomyślnym zalogowaniu, użytkownik jest przekierowany do swojego pulpitu (np. strony portfela).
3.  W przypadku podania błędnego e-maila lub hasła, użytkownik widzi stosowny komunikat błędu.

ID: US-003
Tytuł: Wylogowywanie użytkownika
Opis: Jako zalogowany użytkownik, chcę móc się wylogować, aby zakończyć moją sesję.
Kryteria akceptacji:
1.  W interfejsie aplikacji znajduje się widoczny przycisk "Wyloguj".
2.  Po kliknięciu przycisku, sesja użytkownika jest kończona i zostaje on przekierowany na stronę logowania.

### 5.2. Zarządzanie Portfelem

ID: US-101
Tytuł: Dodawanie pierwszego aktywa do portfela
Opis: Jako nowy użytkownik na mojej stronie profilu/portfela, chcę dodać aktywo (np. 10 akcji AAPL) do mojego pustego portfela, aby rozpocząć śledzenie.
Kryteria akceptacji:
1.  Na stronie profilu znajduje się formularz dodawania aktywa (pole Ticker/Symbol, pole Ilość).
2.  Użytkownik wprowadza "AAPL" i "10".
3.  Po zatwierdzeniu, aktywo "AAPL" w ilości 10 sztuk jest widoczne na liście mojego portfela.
4.  Wartość portfela jest przeliczana i wyświetlana.

ID: US-102
Tytuł: Edycja ilości istniejącego aktywa
Opis: Jako użytkownik, który posiada już aktywa, chcę móc edytować ilość posiadanych jednostek (np. zmienić 10 AAPL na 15 AAPL), aby zaktualizować mój portfel.
Kryteria akceptacji:
1.  Przy każdym elemencie portfela na stronie profilu znajduje się opcja "Edytuj".
2.  Po wybraniu edycji, użytkownik może zmienić pole "Ilość".
3.  Po zatwierdzeniu zmiany (np. z 10 na 15), nowa ilość jest zapisana.
4.  Łączna wartość portfela jest natychmiast przeliczana i aktualizowana w widoku.

ID: US-103
Tytuł: Usuwanie aktywa z portfela
Opis: Jako użytkownik, chcę móc usunąć całą pozycję (np. sprzedałem wszystkie akcje TSLA) z mojego portfela.
Kryteria akceptacji:
1.  Przy każdym elemencie portfela na stronie profilu znajduje się opcja "Usuń".
2.  Po kliknięciu "Usuń" (i ewentualnym potwierdzeniu), aktywo znika z listy.
3.  Łączna wartość portfela i rozkład sektorowy są natychmiast przeliczane i aktualizowane.

ID: US-104
Tytuł: Próba dodania aktywa o nieprawidłowym tickerze
Opis: Jako użytkownik, próbuję dodać aktywo wpisując nieistniejący ticker (np. "XYZ123"), aby zobaczyć, jak system obsługuje błędy.
Kryteria akceptacji:
1.  Użytkownik wprowadza "XYZ123" w polu tickera i klika "Dodaj".
2.  System (backend) próbuje zweryfikować ticker w API.
3.  Gdy API nie znajduje tickera, użytkownik widzi komunikat błędu, np. "Nie znaleziono aktywa o podanym symbolu".
4.  Aktywo nie jest dodawane do portfela.

### 5.3. Sektory i Waluty

ID: US-201
Tytuł: Przeglądanie wartości portfela w domyślnej walucie (USD)
Opis: Jako użytkownik, po zalogowaniu chcę zobaczyć łączną wartość mojego portfela przeliczoną na USD.
Kryteria akceptacji:
1.  Strona portfela domyślnie wyświetla łączną wartość wszystkich aktywów.
2.  Wartość jest oznaczona jako "USD".
3.  Wszystkie aktywa (nawet te notowane w PLN lub EUR, jeśli API to obsługuje) są przeliczane na USD wg buforowanego kursu.

ID: US-202
Tytuł: Zmiana waluty wyświetlania portfela na PLN
Opis: Jako użytkownik, chcę móc przełączyć widok waluty mojego portfela z USD na PLN, aby zobaczyć jego wartość w lokalnej walucie.
Kryteria akceptacji:
1.  Na stronie portfela znajduje się przełącznik (np. przyciski radio lub dropdown) "USD / PLN".
2.  Po wybraniu "PLN", łączna wartość portfela oraz (opcjonalnie) wartości poszczególnych pozycji są przeliczane i wyświetlane w PLN.
3.  Przeliczenie następuje automatycznie, bez przeładowania strony.
4.  Wybór waluty jest zapamiętywany (przynajmniej na czas sesji).

ID: US-203
Tytuł: Przypisanie aktywa do istniejącego sektora
Opis: Jako użytkownik, dodając nowe aktywo (np. MSFT), chcę je przypisać do istniejącego sektora "Technologia" z listy rozwijanej.
Kryteria akceptacji:
1.  Formularz dodawania aktywa zawiera pole "Sektor" (dropdown).
2.  Lista zawiera wcześniej utworzone sektory (np. "Technologia") oraz opcję "Inne".
3.  Użytkownik wybiera "Technologia".
4.  Po dodaniu aktywa, jest ono wliczane do sektora "Technologia" w widoku rozkładu portfela.

ID: US-204
Tytuł: Tworzenie nowego sektora podczas dodawania aktywa
Opis: Jako użytkownik, dodając nowe aktywo (np. PKO), chcę utworzyć nowy sektor "Finanse", ponieważ nie ma go na liście.
Kryteria akceptacji:
1.  Lista rozwijana "Sektor" zawiera opcję "Dodaj nowy...".
2.  Po jej wybraniu pojawia się pole do wpisania nazwy nowego sektora.
3.  Użytkownik wpisuje "Finanse" i zatwierdza dodanie aktywa.
4.  Nowy sektor "Finanse" jest tworzony i zapisywany dla użytkownika.
5.  Aktywo PKO jest przypisane do sektora "Finanse".

ID: US-205
Tytuł: Przeglądanie rozkładu sektorowego
Opis: Jako użytkownik, chcę na stronie portfela zobaczyć, jaki procent mojej inwestycji przypada na poszczególne sektory.
Kryteria akceptacji:
1.  Na stronie portfela widoczna jest sekcja "Rozkład sektorowy".
2.  Sekcja ta pokazuje listę sektorów (np. "Technologia", "Finanse", "Inne").
3.  Przy każdym sektorze widoczna jest jego procentowa lub kwotowa wartość w stosunku do całości portfela.

### 5.4. Strona Śledzenia (Wykresy)

ID: US-301
Tytuł: Dodawanie spółki do siatki wykresów
Opis: Jako użytkownik, chcę na stronie "Wykresy" dodać spółkę (np. "CD Projekt") do siatki, aby monitorować jej kurs.
Kryteria akceptacji:
1.  Strona wykresów posiada przycisk lub pole "Dodaj spółkę".
2.  Użytkownik wyszukuje ticker (np. "CDR").
3.  Po zatwierdzeniu, nowy wykres dla "CDR" pojawia się w najbliższym wolnym slocie siatki (maks. 16).

ID: US-302
Tytuł: Usuwanie spółki z siatki wykresów
Opis: Jako użytkownik, chcę usunąć wykres (np. "CDR") z siatki, ponieważ już mnie nie interesuje.
Kryteria akceptacji:
1.  Każdy wykres na siatce ma widoczną ikonę "Usuń" (np. "X").
2.  Po kliknięciu ikony, wykres znika z siatki, zwalniając slot.

ID: US-303
Tytuł: Reorganizacja siatki wykresów (Drag & Drop)
Opis: Jako użytkownik, chcę móc przeciągnąć wykres AAPL i zamienić go miejscem z wykresem MSFT na siatce, aby ułożyć je według własnych preferencji.
Kryteria akceptacji:
1.  Użytkownik może kliknąć i przytrzymać nagłówek wykresu.
2.  Podczas przeciągania, użytkownik widzi wizualną informację zwrotną.
3.  Po upuszczeniu wykresu na inny slot, wykresy zamieniają się miejscami.
4.  Nowy układ siatki jest zapisywany dla użytkownika.

ID: US-304
Tytuł: Próba dodania 17. wykresu
Opis: Jako użytkownik, który ma już 16 wykresów na siatce, próbuję dodać kolejny.
Kryteria akceptacji:
1.  Użytkownik próbuje dodać 17. spółkę.
2.  Aplikacja wyświetla komunikat "Osiągnięto maksymalną liczbę wykresów (16)".
3.  Wykres nie zostaje dodany.

### 5.5. System i Dane

ID: US-401
Tytuł: Sprawdzanie aktualności danych
Opis: Jako użytkownik, chcę wiedzieć, jak świeże są dane (ceny i kursy walut), które oglądam w aplikacji.
Kryteria akceptacji:
1.  W stałym miejscu interfejsu (np. w stopce lub rogu) widoczny jest tekst, np. "Dane z: 12.11.2025 20:50".
2.  Czas ten odpowiada ostatniemu pomyślnemu pobraniu danych z API przez backend (zgodnie z 1-godzinnym TTL cache).

ID: US-402
Tytuł: Obsługa błędu API
Opis: Jako użytkownik, otwieram aplikację w momencie, gdy zewnętrzne API danych nie odpowiada lub backend nie może pobrać danych.
Kryteria akceptacji:
1.  Zamiast wartości liczbowych portfela lub wykresów, wyświetlany jest komunikat "Dane chwilowo niedostępne".
2.  Aplikacja nie ulega awarii, a jedynie informuje o problemie.
3.  Wyświetlany jest czas ostatniej próby odświeżenia.

## 6. Metryki sukcesu

Kryteria sukcesu dla MVP-1 będą mierzone głównie poprzez testy funkcjonalne i wydajnościowe w środowisku lokalnym/testowym.

1.  Ukończenie krytycznej ścieżki użytkownika (Mierzalne: Tak/Nie)
    * Cel: Użytkownik jest w stanie pomyślnie: (a) zarejestrować się, (b) zalogować, (c) dodać 3 aktywa do portfela, (d) zobaczyć łączną wartość portfela, (e) przełączyć walutę na PLN, (f) dodać 2 wykresy do strony śledzenia.
    * Pomiar: 100% pomyślnych przejść ścieżki w testach manualnych.

2.  Poprawność danych (Mierzalne: Dokładność)
    * Cel: Obliczenia wartości portfela i konwersje walut są precyzyjne.
    * Pomiar: Weryfikacja manualna 5 różnych scenariuszy portfela musi wykazać 100% zgodności obliczeń z danymi wejściowymi (pobrane ceny i kursy).

3.  Wydajność (Mierzalne: Czas)
    * Cel: Aplikacja działa responsywnie pomimo opóźnień API (dzięki buforowaniu).
    * Pomiar: Czas ładowania widoku Portfela oraz widoku Wykresów (z buforowanymi danymi) musi być krótszy niż 3 sekundy w środowisku testowym.

4.  Stabilność (Mierzalne: Testy)
    * Cel: Backend i kluczowe funkcje są stabilne.
    * Pomiar: 100% testów jednostkowych dla operacji CRUD i logiki API (backend) musi przechodzić pomyślnie (passing).

5.  Zgodność z MVP (Mierzalne: Tak/Nie)
    * Cel: Wszystkie funkcje opisane w sekcji 3 (Wymagania Funkcjonalne) są zaimplementowane i działają.
    * Pomiar: Testy manualne potwierdzające działanie każdej funkcji (w tym drag & drop, dodawanie sektorów, obsługa błędów API).