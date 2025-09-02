import { logger } from '../utils/logger.js';

export async function executeActionTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia execute_channel_action', { args });
    
    const { channelId, actionName } = args;
    
    if (!channelId || !actionName) {
        throw new Error('Wymagane parametry: channelId i actionName');
    }
    
    const actionResult = await suplaClient.executeChannelAction(channelId, actionName);
    
    return {
        content: [
            {
                type: 'text',
                text: `✅ Akcja ${actionName} została wykonana na kanale ${channelId} pomyślnie.`
            }
        ]
    };
}
