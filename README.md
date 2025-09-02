# 🏠 Supla MCP Server

Serwer MCP (Model Context Protocol) dla integracji z systemem Supla smart home.

## ✅ Status: DZIAŁA

Serwer jest w pełni skonfigurowany i działa z Claude Desktop.

## 🚀 Szybkie uruchomienie

### 1. Uruchom serwer MCP
```bash
node src/index.js
```

### 2. Uruchom Claude Desktop
Serwer MCP musi być uruchomiony przed otwarciem Claude Desktop.

### 3. Ustaw konfigurację (pierwszy raz)
```
"Ustaw konfigurację serwera Supla z URL https://svr2.supla.org i tokenem [twój_token]"
```

## 🛠️ Dostępne narzędzia MCP

### Konfiguracja (NOWE):
- `set_config` - Ustaw konfigurację serwera (URL i token)
- `update_config` - Aktualizuj częściowo konfigurację
- `get_config` - Pokaż aktualną konfigurację
- `test_connection` - Przetestuj połączenie z serwerem

### Podstawowe:
- `get_locations` - Lista lokalizacji (10 lokalizacji)
- `get_channels` - Lista kanałów (21 kanałów)
- `get_users` - Lista użytkowników (4 użytkowników)
- `get_smartphones` - Statystyki smartfonów (62 smartfony)
- `check_connection` - Sprawdzenie połączenia
- `execute_channel_action` - Sterowanie urządzeniami

### Energia:
- `get_energy_measurements` - Aktualne pomiary energii
- `get_energy_summary` - Podsumowanie energii
- `get_energy_history` - Historia pomiarów
- `export_energy_csv` - Eksport danych do CSV

## 📱 Przykłady użycia w Claude

### Konfiguracja:
```
"Ustaw konfigurację serwera Supla z URL https://svr2.supla.org i tokenem ZjBjMjQzOTE3YmI4Njkx..."
"Pokaż aktualną konfigurację serwera"
"Przetestuj połączenie z serwerem Supla"
"Zaktualizuj token dostępu na nowy_token_123"
```

### Podstawowe zapytania:
```
"Pokaż wszystkie lokalizacje w systemie Supla"
"Które bramy są dostępne do sterowania?"
"Ile smartfonów ma dostęp do systemu?"
"Pokaż szczegółowe statystyki smartfonów"
```

### Sterowanie urządzeniami:
```
"Włącz światło w salonie"
"Zamknij bramę garażową"
"Przełącz power switch w kuchni"
```

### Moduł energii:
```
"Pokaż aktualne pomiary energii z liczników"
"Pobierz punkty historyczne energii z ostatnich 24h"
"Eksportuj dane energii do CSV z ostatniego tygodnia"
"Podsumowanie zużycia energii z wszystkich liczników"
```

## 🔧 Konfiguracja

### Claude Desktop
Plik konfiguracyjny: `C:\Users\admin\AppData\Roaming\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supla-server": {
      "command": "node",
      "args": ["C:/supla-mcp-server/src/index.js"],
      "env": {},
      "description": "Serwer MCP dla integracji z systemem Supla smart home"
    }
  }
}
```

### Nowy system konfiguracji (v2.2.0+)

#### Bezpieczeństwo:
- ✅ Tokeny nie są przechowywane w kodzie
- ✅ Automatyczne dekodowanie tokenów
- ✅ Walidacja połączenia
- ✅ Dynamiczna konfiguracja

#### Automatyczne dekodowanie:
System automatycznie dekoduje tokeny w formacie:
```
token_base64.encoded_server_url
```

Przykład:
```
ZjBjMjQzOTE3YmI4Njkx.aHR0cHM6Ly9zdnIyLnN1cGxhLm9yZw==
```

## 📊 Statystyki systemu

- **📍 Lokalizacje:** 10
- **🔌 Kanały:** 21 (8 sterowalnych)
- **👥 Użytkownicy:** 4
- **📱 Smartfony:** 62 (średnio 15.5 na użytkownika)
- **🚪 Bramy:** 6 (4 zwykłe + 2 garażowe)
- **⚡ Liczniki energii:** 3

## 🧪 Testowanie

```bash
# Pełny test systemu
npm test

# Test modułu energii
npm run test:energy

# Test funkcjonalności smartfonów
npm run test:smartphones
```

## 📁 Struktura projektu

```
supla-mcp-server/
├── src/
│   ├── index.js              # Główny serwer MCP
│   ├── config.js             # Konfiguracja (bez tokenów)
│   ├── supla-client.js       # Klient API Supla
│   ├── utils/
│   │   └── logger.js         # System logowania
│   └── tools/
│       ├── index.js          # Rejestracja narzędzi
│       ├── config.js         # NOWE: Zarządzanie konfiguracją
│       ├── locations.js      # get_locations
│       ├── channels.js       # get_channels
│       ├── users.js          # get_users
│       ├── smartphones.js    # get_smartphones
│       ├── connection.js     # check_connection
│       ├── actions.js        # execute_channel_action
│       ├── measurements.js   # get_energy_measurements
│       ├── history.js        # get_energy_history
│       ├── energy-summary.js # get_energy_summary
│       └── export-csv.js     # export_energy_csv
├── tests/
│   ├── test-suite.js         # Główny test
│   ├── test-energy-module.js # Test modułu energii
│   └── test-smartphones.js   # Test funkcjonalności smartfonów
├── backup/                   # Backup projektu
├── start.bat                 # Skrypt uruchamiania
├── package.json              # Zależności
├── README.md                 # Dokumentacja
├── CONFIGURATION-GUIDE.md    # NOWE: Przewodnik konfiguracji
├── PROJECT-STATUS.md         # Status projektu
├── REFACTORING-REPORT.md     # Raport refaktoryzacji
├── FINAL-SUMMARY.md          # Podsumowanie
├── LICENSE
└── .gitignore
```

## 🔍 Rozwiązywanie problemów

### Problem: "Brak konfiguracji"
1. Użyj `set_config` aby ustawić URL i token
2. Sprawdź czy token jest prawidłowy
3. Przetestuj połączenie

### Problem: "Server disconnected"
1. Upewnij się, że serwer MCP jest uruchomiony
2. Sprawdź konfigurację Claude Desktop
3. Restartuj Claude Desktop

### Problem: Serwer się nie uruchamia
```bash
npm install
npm test
```

## 📈 Historia wersji

### v2.2.0 - Nowy system konfiguracji (13.08.2025)
- ✅ Bezpieczne zarządzanie tokenami
- ✅ 4 nowe narzędzia konfiguracyjne
- ✅ Automatyczne dekodowanie tokenów
- ✅ Dynamiczna konfiguracja
- ✅ Walidacja połączenia
- ✅ Refaktoryzacja projektu

### v2.1.0 - Funkcjonalność smartfonów
- ✅ Dodano szczegółowe statystyki smartfonów
- ✅ Nowe narzędzie `get_smartphones`
- ✅ Ranking użytkowników

### v2.0.0 - Przeprojektowanie modułu energii
- ✅ 3 metody pobierania danych energii
- ✅ Eksport CSV
- ✅ Historia pomiarów

### v1.0.0 - Podstawowa funkcjonalność
- ✅ Integracja z API Supla
- ✅ 5 narzędzi MCP
- ✅ System logowania

## 🎯 Następne kroki

### Możliwe rozszerzenia:
1. **Dodanie nowych narzędzi MCP**
2. **Integracja z innymi systemami smart home**
3. **Panel administracyjny web**
4. **Powiadomienia push**
5. **Automatyzacja scenariuszy**

### Utrzymanie:
1. **Regularne testy**
2. **Aktualizacja zależności**
3. **Monitoring wydajności**
4. **Backup konfiguracji**

## 📞 Wsparcie

- **Dokumentacja API Supla:** https://svr2.supla.org/api-docs/docs.html
- **Model Context Protocol:** https://modelcontextprotocol.io/
- **Przewodnik konfiguracji:** [CONFIGURATION-GUIDE.md](CONFIGURATION-GUIDE.md)

## 📝 Licencja

MIT License - zobacz plik [LICENSE](LICENSE) dla szczegółów.
