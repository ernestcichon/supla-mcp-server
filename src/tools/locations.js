import { logger } from '../utils/logger.js';

export async function getLocationsTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia get_locations');
    
    const locations = await suplaClient.getLocations();
    const locationList = locations.map(loc => 
        `- ${loc.caption} (ID: ${loc.id}) - ${loc.ioDevices?.length || 0} urządzeń, ${loc.channels?.length || 0} kanałów`
    ).join('\n');
    
    return {
        content: [
            {
                type: 'text',
                text: `Znaleziono ${locations.length} lokalizacji:\n\n${locationList}`
            }
        ]
    };
}
