#!/usr/bin/env node
/**
 * Supla MCP Server
 * Serwer MCP (Model Context Protocol) dla integracji z systemem Supla smart home
 * 
 * @version 2.3.0
 * @author ERGO energia
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SuplaClient } from './supla-client.js';
import { config, displayConfig } from './config.js';
import { logger } from './utils/logger.js';
import { getCurrentConfig, setCurrentConfig } from './tools/config.js';

// Import narzędzi MCP
import { registerTools } from './tools/index.js';

/**
 * Główna funkcja uruchamiająca serwer MCP
 */
async function startServer() {
    try {
        logger.info('🚀 Uruchamianie serwera MCP Supla...');
        
        // Wyświetl konfigurację
        displayConfig();
        
        // Inicjalizuj konfigurację fallback
        const fallbackConfig = {
            serverUrl: config.SUPLA_SERVER_URL,
            accessToken: config.SUPLA_ACCESS_TOKEN,
            description: 'Konfiguracja Supla MCP Server'
        };
        
        setCurrentConfig(fallbackConfig);
        
        // Utwórz klienta Supla
        const suplaClient = await initializeSuplaClient();
        
        // Utwórz serwer MCP
        const server = createMcpServer();
        
        // Zarejestruj narzędzia
        registerTools(server, suplaClient);
        
        // Uruchom serwer
        await startMcpServer(server);
        
    } catch (error) {
        logger.error('❌ Błąd podczas uruchamiania serwera:', error.message);
        process.exit(1);
    }
}

/**
 * Inicjalizuje klienta Supla
 * @returns {SuplaClient|null} Klient Supla lub null jeśli nie można utworzyć
 */
async function initializeSuplaClient() {
    const currentConfig = getCurrentConfig();
    
    if (!currentConfig.accessToken) {
        logger.info('⚠️ Brak tokenu w konfiguracji. Użyj set_config aby ustawić konfigurację.');
        return null;
    }
    
    try {
        const client = new SuplaClient();
        logger.info('✅ SuplaClient utworzony z fallback konfiguracji');
        return client;
    } catch (error) {
        logger.warn('⚠️ Nie udało się utworzyć SuplaClient:', error.message);
        logger.info('💡 Użyj set_config aby ustawić prawidłową konfigurację');
        return null;
    }
}

/**
 * Tworzy serwer MCP
 * @returns {McpServer} Serwer MCP
 */
function createMcpServer() {
    logger.info('🔧 Tworzenie serwera MCP...');
    
    return new McpServer(
        config.MCP_SERVER,
        {
            capabilities: {
                tools: {}
            }
        }
    );
}

/**
 * Uruchamia serwer MCP
 * @param {McpServer} server Serwer MCP
 */
async function startMcpServer(server) {
    logger.info('🔌 Tworzenie transportu STDIO...');
    const transport = new StdioServerTransport();
    
    logger.info('🔗 Łączenie z transportem...');
    await server.connect(transport);
    
    logger.info('✅ Serwer MCP Supla uruchomiony pomyślnie!');
    logger.info('🛠️ Dostępne narzędzia: set_config, update_config, get_config, test_connection, get_locations, get_channels, get_users, get_smartphones, check_connection, execute_channel_action, get_energy_measurements, get_energy_summary, get_energy_history, export_energy_csv');
}

// Uruchom serwer
startServer();
