# 🔧 Przewodnik konfiguracji Supla MCP Server

## ✅ Nowy system konfiguracji

Od wersji 2.2.0 wprowadziliśmy nowy, bezpieczniejszy system konfiguracji, który pozwala na:

- **Bezpieczne zarządzanie tokenami** - tokeny nie są przechowywane w kodzie
- **Dynamiczną konfigurację** - możliwość zmiany ustawień w czasie działania
- **Automatyczne dekodowanie** - obsługa zakodowanych tokenów
- **Walidację połączenia** - sprawdzanie czy konfiguracja działa

## 🛠️ Nowe narzędzia konfiguracyjne

### 1. `set_config` - Ustawienie pełnej konfiguracji
```json
{
  "serverUrl": "https://svr2.supla.org",
  "accessToken": "twój_token_tutaj",
  "description": "Opis konfiguracji (opcjonalne)"
}
```

### 2. `update_config` - Częściowa aktualizacja
```json
{
  "serverUrl": "https://nowy.serwer.supla.org",
  "accessToken": "nowy_token",
  "description": "Nowy opis"
}
```

### 3. `get_config` - Wyświetlenie aktualnej konfiguracji
```json
{}
```

### 4. `test_connection` - Test połączenia
```json
{}
```

## 📱 Przykłady użycia w Claude

### Ustawienie konfiguracji po raz pierwszy:
```
"Ustaw konfigurację serwera Supla z URL https://svr2.supla.org i tokenem ZjBjMjQzOTE3YmI4Njkx..."
```

### Aktualizacja tylko tokenu:
```
"Zaktualizuj token dostępu na nowy_token_123"
```

### Sprawdzenie konfiguracji:
```
"Pokaż aktualną konfigurację serwera"
```

### Test połączenia:
```
"Przetestuj połączenie z serwerem Supla"
```

## 🔐 Bezpieczeństwo

### Automatyczne dekodowanie tokenów
System automatycznie dekoduje tokeny w formacie:
```
token_base64.encoded_server_url
```

Przykład:
```
ZjBjMjQzOTE3YmI4Njkx.aHR0cHM6Ly9zdnIyLnN1cGxhLm9yZw==
```

### Przechowywanie w pamięci
- Konfiguracja jest przechowywana tylko w pamięci
- Nie jest zapisywana na dysku
- Tokeny nie są logowane

## 🔄 Migracja z poprzedniej wersji

### Przed (w config.js):
```javascript
export const config = {
    SUPLA_SERVER_URL: 'https://svr2.supla.org',
    SUPLA_ACCESS_TOKEN: 'token_w_kodzie', // ❌ Niebezpieczne
    // ...
};
```

### Po (nowy system):
```javascript
// config.js - tylko domyślne wartości
export const config = {
    SUPLA_SERVER_URL: 'https://svr2.supla.org',
    SUPLA_ACCESS_TOKEN: null, // ✅ Bezpieczne
    // ...
};

// Token ustawiany przez Claude:
// set_config z accessToken
```

## 🚀 Korzyści nowego systemu

### 1. Bezpieczeństwo
- ✅ Tokeny nie w kodzie źródłowym
- ✅ Brak tokenów w logach
- ✅ Tylko w pamięci aplikacji

### 2. Elastyczność
- ✅ Zmiana konfiguracji bez restartu
- ✅ Obsługa wielu serwerów
- ✅ Dynamiczne aktualizacje

### 3. Walidacja
- ✅ Automatyczne sprawdzanie połączenia
- ✅ Informacje o błędach
- ✅ Potwierdzenie działania

### 4. Dekodowanie
- ✅ Automatyczne dekodowanie URL z tokenu
- ✅ Obsługa różnych formatów
- ✅ Fallback na oryginalny token

## 📋 Procedura pierwszego uruchomienia

1. **Uruchom serwer:**
   ```bash
   .\start.bat
   ```

2. **Otwórz Claude Desktop**

3. **Ustaw konfigurację:**
   ```
   "Ustaw konfigurację serwera Supla z URL https://svr2.supla.org i tokenem [twój_token]"
   ```

4. **Przetestuj połączenie:**
   ```
   "Przetestuj połączenie z serwerem"
   ```

5. **Użyj systemu:**
   ```
   "Pokaż wszystkie lokalizacje w systemie Supla"
   ```

## 🔍 Rozwiązywanie problemów

### Problem: "Brak konfiguracji"
```
Rozwiązanie: Użyj set_config aby ustawić URL i token
```

### Problem: "Błąd połączenia"
```
Rozwiązanie: Sprawdź URL i token, użyj test_connection
```

### Problem: "Token nieprawidłowy"
```
Rozwiązanie: Wygeneruj nowy token w panelu Supla
```

## 📊 Status konfiguracji

### Wszystkie narzędzia sprawdzają:
- ✅ Czy konfiguracja jest ustawiona
- ✅ Czy token jest dostępny
- ✅ Czy połączenie działa

### Automatyczne komunikaty:
- 💡 "Użyj set_config aby ustawić konfigurację"
- ✅ "Konfiguracja ustawiona pomyślnie"
- ⚠️ "Połączenie nieudane, sprawdź token"

## 🎯 Podsumowanie

Nowy system konfiguracji zapewnia:
- **Bezpieczeństwo** - tokeny nie w kodzie
- **Elastyczność** - zmiana w czasie działania
- **Walidację** - sprawdzanie połączenia
- **Dekodowanie** - automatyczne przetwarzanie tokenów

**Status:** ✅ **GOTOWY DO UŻYCIA**
