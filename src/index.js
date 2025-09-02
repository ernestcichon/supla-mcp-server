#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SuplaClient } from './supla-client.js';
import { config, displayConfig } from './config.js';
import { logger } from './utils/logger.js';
import { getCurrentConfig, setCurrentConfig } from './tools/config.js';

logger.info('Uruchamianie serwera MCP Supla...');

// Wyświetl podstawową konfigurację
displayConfig();

// Inicjalizacja konfiguracji z pliku config.js (jako fallback)
const fallbackConfig = {
    serverUrl: config.SUPLA_SERVER_URL,
    accessToken: config.SUPLA_ACCESS_TOKEN,
    description: 'Konfiguracja Supla MCP Server'
};

// Ustaw fallback konfigurację
setCurrentConfig(fallbackConfig);

// Sprawdź czy mamy token w fallback konfiguracji
const currentConfig = getCurrentConfig();
let suplaClient = null;

if (currentConfig.accessToken) {
    try {
        suplaClient = new SuplaClient();
        logger.info('SuplaClient utworzony z fallback konfiguracji');
    } catch (error) {
        logger.warn('Nie udało się utworzyć SuplaClient z fallback konfiguracji:', error.message);
        logger.info('Użyj set_config aby ustawić prawidłową konfigurację');
    }
} else {
    logger.info('Brak tokenu w konfiguracji. Użyj set_config aby ustawić konfigurację.');
}

logger.info('Tworzenie serwera MCP...');
const server = new McpServer(
    config.MCP_SERVER,
    {
        capabilities: {
            tools: {}
        }
    }
);

// Rejestracja narzędzi MCP
logger.info('Importowanie narzędzi...');
import { registerTools } from './tools/index.js';
logger.info('Rejestracja narzędzi...');
registerTools(server, suplaClient);

logger.info('Tworzenie transportu STDIO...');
const transport = new StdioServerTransport();

logger.info('Łączenie z transportem...');
try {
    await server.connect(transport);
    logger.info('Połączenie z transportem udane!');
} catch (error) {
    logger.error('Błąd podczas łączenia z transportem:', error.message);
    process.exit(1);
}

logger.info('Serwer MCP Supla uruchomiony pomyslnie!');
logger.info('Dostepne narzedzia: set_config, update_config, get_config, test_connection, get_locations, get_channels, get_users, get_smartphones, check_connection, execute_channel_action, get_energy_measurements, get_energy_summary, get_energy_history, export_energy_csv');
