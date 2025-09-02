import { logger } from '../utils/logger.js';

export async function checkConnectionTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia check_connection');
    
    const connectionStatus = await suplaClient.checkConnection();
    
    return {
        content: [
            {
                type: 'text',
                text: `Status połączenia: ${connectionStatus.connected ? 'Połączony' : 'Niepołączony'}${connectionStatus.message ? `\n${connectionStatus.message}` : ''}`
            }
        ]
    };
}
