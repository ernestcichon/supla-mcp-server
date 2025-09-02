import { logger } from '../utils/logger.js';
import { getLocationsTool } from './locations.js';
import { getChannelsTool } from './channels.js';
import { getUsersTool } from './users.js';
import { getSmartphonesTool } from './smartphones.js';
import { checkConnectionTool } from './connection.js';
import { executeActionTool } from './actions.js';
import { getEnergyMeasurementsTool } from './measurements.js';
import { getEnergySummaryTool } from './energy-summary.js';
import { getEnergyHistoryTool } from './history.js';
import { exportEnergyCSVTool } from './export-csv.js';
import { set_config, update_config, get_config, test_connection } from './config.js';
import { SuplaClient } from '../supla-client.js';
import { z } from 'zod';

export function registerTools(server, suplaClient) {
    logger.info('Rejestracja narzędzi MCP...');

    // Funkcja pomocnicza do tworzenia klienta lub zwracania błędu
    function getClientOrError() {
        if (suplaClient) {
            return suplaClient;
        }
        try {
            return new SuplaClient();
        } catch (error) {
            throw new Error('Brak konfiguracji. Użyj set_config aby ustawić URL serwera i token dostępu.');
        }
    }

    // Rejestracja narzędzi używając nowego API
    server.tool('get_locations', 'Pobiera listę wszystkich lokalizacji z Supla', async () => {
        const client = getClientOrError();
        return await getLocationsTool(client, {});
    });

    server.tool('get_channels', 'Pobiera listę wszystkich kanałów z Supla', async () => {
        const client = getClientOrError();
        return await getChannelsTool(client, {});
    });

    server.tool('get_users', 'Pobiera listę użytkowników z informacjami o smartfonach', async () => {
        const client = getClientOrError();
        return await getUsersTool(client, {});
    });

    server.tool('get_smartphones', 'Pobiera szczegółowe statystyki smartfonów i aplikacji mobilnych', {
        userId: z.number().optional().describe('ID konkretnego użytkownika (opcjonalne)')
    }, async ({ userId }) => {
        const client = getClientOrError();
        return await getSmartphonesTool(client, { userId });
    });

    server.tool('execute_channel_action', 'Wykonuje akcję na kanale (toggle, turn-on, turn-off, open, close) - DZIAŁA!', {
        channelId: z.number().describe('ID kanału (np. 65038 dla Power Switch)'),
        actionName: z.string().describe('Nazwa akcji: toggle, turn-on, turn-off, open, close')
    }, async ({ channelId, actionName }) => {
        const client = getClientOrError();
        return await executeActionTool(client, { channelId, actionName });
    });

    server.tool('check_connection', 'Sprawdza połączenie z serwerem Supla', async () => {
        const client = getClientOrError();
        return await checkConnectionTool(client, {});
    });

    server.tool('get_energy_measurements', 'Pobiera aktualne pomiary energii z liczników MEW (bieżące odczyty)', async () => {
        const client = getClientOrError();
        return await getEnergyMeasurementsTool(client, {});
    });

    server.tool('get_energy_summary', 'Pobiera podsumowanie energii z wszystkich liczników', async () => {
        const client = getClientOrError();
        return await getEnergySummaryTool(client, {});
    });

    server.tool('get_energy_history', 'Pobiera punkty historyczne pomiarów energii z liczników MEW (pomiary w określonych momentach)', {
        limit: z.number().optional().describe('Liczba punktów do pobrania (domyślnie 100)'),
        channelId: z.number().optional().describe('ID konkretnego kanału (opcjonalne)')
    }, async ({ limit, channelId }) => {
        const client = getClientOrError();
        return await getEnergyHistoryTool(client, { limit, channelId });
    });

    server.tool('export_energy_csv', 'Eksportuje archiwalne dane energii do formatu CSV (pobieranie ZIP a potem CSV)', {
        channelId: z.number().optional().describe('ID konkretnego kanału (opcjonalne)'),
        dateFrom: z.number().optional().describe('Unix timestamp - eksportuj rekordy od tej daty (opcjonalne)'),
        dateTo: z.number().optional().describe('Unix timestamp - eksportuj rekordy do tej daty (opcjonalne)')
    }, async ({ channelId, dateFrom, dateTo }) => {
        const client = getClientOrError();
        return await exportEnergyCSVTool(client, { channelId, dateFrom, dateTo });
    });

    // Nowe narzędzia konfiguracyjne
    server.tool('set_config', set_config.description, set_config.inputSchema, async (args) => {
        return await set_config.handler(args);
    });

    server.tool('update_config', update_config.description, update_config.inputSchema, async (args) => {
        return await update_config.handler(args);
    });

    server.tool('get_config', get_config.description, get_config.inputSchema, async () => {
        return await get_config.handler();
    });

    server.tool('test_connection', test_connection.description, test_connection.inputSchema, async () => {
        return await test_connection.handler();
    });

    logger.info('Zarejestrowano 14 narzędzi');
}
