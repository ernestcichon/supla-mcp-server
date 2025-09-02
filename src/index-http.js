#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SuplaClient } from './supla-client.js';
import { config, validateConfig, displayConfig } from './config.js';
import { logger } from './utils/logger.js';
import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';

logger.info('Uruchamianie serwera MCP Supla (HTTPS)...');

// Walidacja konfiguracji
try {
    validateConfig();
    displayConfig();
} catch (error) {
    logger.error('Błąd konfiguracji:', error.message);
    process.exit(1);
}

const suplaClient = new SuplaClient(
    config.SUPLA_SERVER_URL,
    config.SUPLA_ACCESS_TOKEN
);

const server = new McpServer(
    config.MCP_SERVER,
    {
        capabilities: {
            tools: {}
        }
    }
);

// Rejestracja narzędzi MCP
import { registerTools } from './tools/index.js';
registerTools(server, suplaClient);

const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => Math.random().toString(36).substring(2, 15),
    enableJsonResponse: true
});

await server.connect(transport);

// Utworzenie Express serwera
const app = express();
app.use(express.json());

// Endpoint MCP
app.all('/mcp', async (req, res) => {
    await transport.handleRequest(req, res, req.body);
});

// Endpoint testowy
app.get('/', (req, res) => {
    res.json({
        message: 'Serwer MCP Supla działa!',
        endpoints: {
            mcp: '/mcp',
            status: '/status'
        }
    });
});

app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        server: 'Supla MCP Server',
        version: '2.1.0',
        tools: [
            'get_locations', 'get_channels', 'get_users', 'get_smartphones',
            'check_connection', 'execute_channel_action', 'get_energy_measurements',
            'get_energy_summary', 'get_energy_history', 'export_energy_csv'
        ]
    });
});

const PORT = 3000;
const HTTPS_PORT = 3443;

// Funkcja do generowania self-signed certyfikatu
function generateSelfSignedCert() {
    const certPath = path.join(process.cwd(), 'cert.pem');
    const keyPath = path.join(process.cwd(), 'key.pem');
    
    // Sprawdź czy certyfikaty już istnieją
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        logger.info('Znaleziono istniejące certyfikaty SSL');
        return {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
        };
    }
    
    logger.info('Generowanie self-signed certyfikatu SSL...');
    
    // Użyj OpenSSL do wygenerowania certyfikatu
    const { execSync } = require('child_process');
    try {
        execSync(`openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=PL/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
        logger.info('Certyfikat SSL wygenerowany pomyślnie');
        return {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
        };
    } catch (error) {
        logger.warn('Nie można wygenerować certyfikatu SSL, używam HTTP');
        return null;
    }
}

// Uruchomienie serwera HTTP (fallback)
app.listen(PORT, () => {
    logger.info(`Serwer MCP Supla (HTTP) uruchomiony na http://localhost:${PORT}`);
});

// Uruchomienie serwera HTTPS
const sslOptions = generateSelfSignedCert();
if (sslOptions) {
    const httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
        logger.info(`Serwer MCP Supla (HTTPS) uruchomiony na https://localhost:${HTTPS_PORT}`);
        logger.info('Dostępne narzędzia: get_locations, get_channels, get_users, get_smartphones, check_connection, execute_channel_action, get_energy_measurements, get_energy_summary, get_energy_history, export_energy_csv');
    });
} else {
    logger.info('Dostępne narzędzia: get_locations, get_channels, get_users, get_smartphones, check_connection, execute_channel_action, get_energy_measurements, get_energy_summary, get_energy_history, export_energy_csv');
}
