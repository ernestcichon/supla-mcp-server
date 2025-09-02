// Konfiguracja serwera MCP dla Supla
// Zmien te wartosci wedlug potrzeb

export const config = {
    // Domyślny URL serwera Supla (może być nadpisany przez set_config)
    SUPLA_SERVER_URL: 'https://svr2.supla.org',
    
    // Token dostępu do API Supla (może być nadpisany przez set_config)
    // UWAGA: Token jest teraz ustawiany przez Claude używając set_config
    // Fallback token dla kompatybilności wstecznej
    SUPLA_ACCESS_TOKEN: 'ZjBjMjQzOTE3YmI4NjkxMzA4OTQxNDUyNjcxMzE5MzQ1ODg2Y2Q1MjIyMGRlOGRkZGZlNTM4OTBiMjAwZDUzNQ.aHR0cHM6Ly9zdnIyLnN1cGxhLm9yZw==',
    
    // Konfiguracja serwera MCP
    MCP_SERVER: {
        name: 'supla-server',
        version: '2.2.0'
    },
    
    // Ustawienia logowania
    LOGGING: {
        enabled: true,
        level: 'info', // 'debug', 'info', 'warn', 'error'
        format: 'text' // 'text', 'json'
    },
    
    // Timeout dla zapytan API (w milisekundach)
    API_TIMEOUT: 10000,
    
    // Maksymalna liczba prob ponowienia zapytania
    MAX_RETRIES: 3,
    
    // Interwal miedzy probami ponowienia (w milisekundach)
    RETRY_DELAY: 1000,
    
    // Ustawienia API
    API: {
        version: 'v3',
        basePath: '/api',
        endpoints: {
            channels: '/channels',
            locations: '/locations',
            users: '/accessids',
            devices: '/iodevices'
        }
    }
};

// Funkcja do walidacji konfiguracji
export function validateConfig() {
    const errors = [];
    
    if (!config.SUPLA_SERVER_URL) {
        errors.push('SUPLA_SERVER_URL jest wymagany');
    }
    
    // Token nie jest już wymagany w config.js - może być ustawiony przez set_config
    // if (!config.SUPLA_ACCESS_TOKEN) {
    //     errors.push('SUPLA_ACCESS_TOKEN jest wymagany');
    // }
    
    if (errors.length > 0) {
        throw new Error(`Bledy konfiguracji:\n${errors.join('\n')}`);
    }
    
    return true;
}

// Funkcja do wyswietlania konfiguracji (bez tokenu)
export function displayConfig() {
    const displayConfig = {
        ...config,
        SUPLA_ACCESS_TOKEN: config.SUPLA_ACCESS_TOKEN ? 
            `${config.SUPLA_ACCESS_TOKEN.substring(0, 20)}...` : 
            'BRAK (ustaw przez set_config)'
    };
    
    // Uzywaj stderr zamiast stdout, aby nie psuc komunikacji MCP
    console.error('=== KONFIGURACJA SERWERA MCP SUPLA ===');
    console.error(JSON.stringify(displayConfig, null, 2));
    console.error('========================================');
    console.error('💡 Użyj set_config aby ustawić token dostępu');
}
