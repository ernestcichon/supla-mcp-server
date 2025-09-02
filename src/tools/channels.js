import { logger } from '../utils/logger.js';

export async function getChannelsTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia get_channels');
    
    const channels = await suplaClient.getChannels();
    const channelList = channels.map(ch => 
        `- ID: ${ch.id}, Nazwa: ${ch.caption || 'Brak nazwy'}, Funkcja: ${ch.function?.caption || 'Nieznana'}`
    ).join('\n');
    
    return {
        content: [
            {
                type: 'text',
                text: `Znaleziono ${channels.length} kanałów:\n\n${channelList}`
            }
        ]
    };
}
