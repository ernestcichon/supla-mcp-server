import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Schemat walidacji dla konfiguracji
const ConfigSchema = z.object({
    serverUrl: z.string().url('Nieprawidłowy URL serwera'),
    accessToken: z.string().min(1, 'Token jest wymagany'),
    description: z.string().optional()
});

// Schemat walidacji dla aktualizacji konfiguracji
const UpdateConfigSchema = z.object({
    serverUrl: z.string().url('Nieprawidłowy URL serwera').optional(),
    accessToken: z.string().min(1, 'Token jest wymagany').optional(),
    description: z.string().optional()
});

// Przechowywanie konfiguracji w pamięci
let currentConfig = {
    serverUrl: 'https://svr2.supla.org',
    accessToken: null,
    description: 'Konfiguracja Supla MCP Server'
};

// Funkcja do dekodowania tokenu (jeśli jest zakodowany)
function decodeToken(token) {
    try {
        // Sprawdź czy token jest w formacie base64
        if (token.includes('.')) {
            const parts = token.split('.');
            if (parts.length === 2) {
                // Dekoduj część po kropce (URL serwera)
                const decodedUrl = Buffer.from(parts[1], 'base64').toString('utf-8');
                logger.info(`Dekodowano URL serwera z tokenu: ${decodedUrl}`);
                return {
                    token: parts[0],
                    serverUrl: decodedUrl
                };
            }
        }
        return { token, serverUrl: null };
    } catch (error) {
        logger.warn('Nie udało się zdekodować tokenu, używam oryginalnego');
        return { token, serverUrl: null };
    }
}

// Funkcja do walidacji połączenia z serwerem
async function validateConnection(serverUrl, accessToken) {
    try {
        const response = await fetch(`${serverUrl}/api/channels`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        
        if (response.ok) {
            return { success: true, message: 'Połączenie udane' };
        } else {
            return { success: false, message: `Błąd HTTP: ${response.status}` };
        }
    } catch (error) {
        return { success: false, message: `Błąd połączenia: ${error.message}` };
    }
}

// Narzędzie do ustawienia konfiguracji
export const set_config = {
    name: 'set_config',
    description: 'Ustaw konfigurację serwera Supla (URL i token dostępu)',
    inputSchema: ConfigSchema,
    handler: async (args) => {
        try {
            logger.info('Ustawianie nowej konfiguracji...');
            
            // Dekoduj token jeśli potrzeba
            const decoded = decodeToken(args.accessToken);
            
            // Aktualizuj konfigurację
            currentConfig = {
                serverUrl: decoded.serverUrl || args.serverUrl,
                accessToken: decoded.token,
                description: args.description || currentConfig.description
            };
            
            // Waliduj połączenie
            const validation = await validateConnection(currentConfig.serverUrl, currentConfig.accessToken);
            
            if (validation.success) {
                logger.info('Konfiguracja ustawiona pomyślnie');
                return {
                    success: true,
                    message: 'Konfiguracja została ustawiona pomyślnie',
                    serverUrl: currentConfig.serverUrl,
                    description: currentConfig.description,
                    connectionStatus: 'Połączony'
                };
            } else {
                logger.warn(`Konfiguracja ustawiona, ale połączenie nieudane: ${validation.message}`);
                return {
                    success: true,
                    message: 'Konfiguracja została ustawiona, ale połączenie nieudane',
                    serverUrl: currentConfig.serverUrl,
                    description: currentConfig.description,
                    connectionStatus: 'Błąd połączenia',
                    connectionError: validation.message
                };
            }
        } catch (error) {
            logger.error(`Błąd podczas ustawiania konfiguracji: ${error.message}`);
            return {
                success: false,
                message: `Błąd podczas ustawiania konfiguracji: ${error.message}`
            };
        }
    }
};

// Narzędzie do aktualizacji konfiguracji
export const update_config = {
    name: 'update_config',
    description: 'Aktualizuj częściowo konfigurację serwera Supla',
    inputSchema: UpdateConfigSchema,
    handler: async (args) => {
        try {
            logger.info('Aktualizowanie konfiguracji...');
            
            // Aktualizuj tylko podane pola
            if (args.serverUrl) {
                currentConfig.serverUrl = args.serverUrl;
            }
            
            if (args.accessToken) {
                const decoded = decodeToken(args.accessToken);
                currentConfig.accessToken = decoded.token;
                if (decoded.serverUrl) {
                    currentConfig.serverUrl = decoded.serverUrl;
                }
            }
            
            if (args.description) {
                currentConfig.description = args.description;
            }
            
            // Waliduj połączenie jeśli mamy token
            if (currentConfig.accessToken) {
                const validation = await validateConnection(currentConfig.serverUrl, currentConfig.accessToken);
                
                if (validation.success) {
                    logger.info('Konfiguracja zaktualizowana pomyślnie');
                    return {
                        success: true,
                        message: 'Konfiguracja została zaktualizowana pomyślnie',
                        serverUrl: currentConfig.serverUrl,
                        description: currentConfig.description,
                        connectionStatus: 'Połączony'
                    };
                } else {
                    logger.warn(`Konfiguracja zaktualizowana, ale połączenie nieudane: ${validation.message}`);
                    return {
                        success: true,
                        message: 'Konfiguracja została zaktualizowana, ale połączenie nieudane',
                        serverUrl: currentConfig.serverUrl,
                        description: currentConfig.description,
                        connectionStatus: 'Błąd połączenia',
                        connectionError: validation.message
                    };
                }
            } else {
                return {
                    success: true,
                    message: 'Konfiguracja została zaktualizowana (brak tokenu do walidacji)',
                    serverUrl: currentConfig.serverUrl,
                    description: currentConfig.description,
                    connectionStatus: 'Brak tokenu'
                };
            }
        } catch (error) {
            logger.error(`Błąd podczas aktualizacji konfiguracji: ${error.message}`);
            return {
                success: false,
                message: `Błąd podczas aktualizacji konfiguracji: ${error.message}`
            };
        }
    }
};

// Narzędzie do wyświetlania konfiguracji
export const get_config = {
    name: 'get_config',
    description: 'Pokaż aktualną konfigurację serwera Supla (bez tokenu)',
    inputSchema: z.object({}),
    handler: async () => {
        try {
            logger.info('Pobieranie konfiguracji...');
            
            return {
                success: true,
                config: {
                    serverUrl: currentConfig.serverUrl,
                    description: currentConfig.description,
                    hasToken: !!currentConfig.accessToken,
                    tokenPreview: currentConfig.accessToken ? 
                        `${currentConfig.accessToken.substring(0, 10)}...` : 
                        'BRAK'
                }
            };
        } catch (error) {
            logger.error(`Błąd podczas pobierania konfiguracji: ${error.message}`);
            return {
                success: false,
                message: `Błąd podczas pobierania konfiguracji: ${error.message}`
            };
        }
    }
};

// Narzędzie do testowania połączenia
export const test_connection = {
    name: 'test_connection',
    description: 'Przetestuj połączenie z serwerem Supla',
    inputSchema: z.object({}),
    handler: async () => {
        try {
            logger.info('Testowanie połączenia z serwerem Supla...');
            
            if (!currentConfig.accessToken) {
                return {
                    success: false,
                    message: 'Brak tokenu dostępu. Ustaw konfigurację najpierw.'
                };
            }
            
            const validation = await validateConnection(currentConfig.serverUrl, currentConfig.accessToken);
            
            if (validation.success) {
                logger.info('Test połączenia udany');
                return {
                    success: true,
                    message: 'Połączenie z serwerem Supla udane',
                    serverUrl: currentConfig.serverUrl,
                    status: 'Połączony'
                };
            } else {
                logger.warn(`Test połączenia nieudany: ${validation.message}`);
                return {
                    success: false,
                    message: `Test połączenia nieudany: ${validation.message}`,
                    serverUrl: currentConfig.serverUrl,
                    status: 'Błąd połączenia'
                };
            }
        } catch (error) {
            logger.error(`Błąd podczas testowania połączenia: ${error.message}`);
            return {
                success: false,
                message: `Błąd podczas testowania połączenia: ${error.message}`
            };
        }
    }
};

// Funkcja do pobierania aktualnej konfiguracji (dla innych modułów)
export function getCurrentConfig() {
    return currentConfig;
}

// Funkcja do ustawienia konfiguracji (dla innych modułów)
export function setCurrentConfig(config) {
    currentConfig = { ...currentConfig, ...config };
}
