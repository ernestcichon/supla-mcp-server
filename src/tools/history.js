import { logger } from '../utils/logger.js';

export async function getEnergyHistoryTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia get_energy_history', { args });
    
    try {
        const { limit = 100, channelId = null } = args;
        
        // Pobierz wszystkie liczniki energii
        const electricityMeters = await suplaClient.getElectricityMeterChannels();
        
        if (electricityMeters.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: '❌ Nie znaleziono żadnych liczników energii w systemie.'
                    }
                ]
            };
        }
        
        let result = `📊 **Historia pomiarów energii (punkty historyczne)**\n\n`;
        
        // Jeśli podano konkretny channelId, użyj go
        const metersToProcess = channelId ? 
            electricityMeters.filter(m => m.id === channelId) : 
            electricityMeters;
        
        for (const meter of metersToProcess) {
            result += `🔌 **${meter.caption || 'Brak nazwy'}** (ID: ${meter.id})\n`;
            
            try {
                // Pobierz punkty historyczne
                const historyPoints = await suplaClient.getEnergyHistoryPoints(meter.id, limit);
                
                if (historyPoints.length === 0) {
                    result += `   ❌ Brak punktów historycznych\n\n`;
                    continue;
                }
                
                result += `   📈 **Punkty:** ${historyPoints.length}\n`;
                
                // Pokaż najnowszy punkt
                const latest = historyPoints[0];
                const latestDate = new Date(latest.date_timestamp * 1000).toLocaleString('pl-PL');
                result += `   🕐 **Najnowszy:** ${latestDate}\n`;
                
                // Sumuj dane z wszystkich faz
                let totalFAE = 0;
                let totalRAE = 0;
                let totalFRE = 0;
                let totalRRE = 0;
                
                ['phase1', 'phase2', 'phase3'].forEach(phase => {
                    totalFAE += latest[`${phase}_fae`] || 0;
                    totalRAE += latest[`${phase}_rae`] || 0;
                    totalFRE += latest[`${phase}_fre`] || 0;
                    totalRRE += latest[`${phase}_rre`] || 0;
                });
                
                result += `   ⚡ **Energia czynna:** ${(totalFAE / 100000).toFixed(2)} kWh\n`;
                result += `   🔄 **Energia bierna:** ${(totalRAE / 100000).toFixed(2)} kVARh\n`;
                result += `   📊 **Energia bierna (F):** ${(totalFRE / 100000).toFixed(2)} kVARh\n`;
                result += `   📈 **Energia bierna (R):** ${(totalRRE / 100000).toFixed(2)} kVARh\n\n`;
                
                // Pokaż szczegóły faz
                result += `   **Szczegóły faz:**\n`;
                ['phase1', 'phase2', 'phase3'].forEach((phase, index) => {
                    const fae = latest[`${phase}_fae`] || 0;
                    const rae = latest[`${phase}_rae`] || 0;
                    result += `   Faza ${index + 1}: ${(fae / 100000).toFixed(2)} kWh / ${(rae / 100000).toFixed(2)} kVARh\n`;
                });
                result += `\n`;
                
            } catch (error) {
                result += `   ❌ **Błąd:** ${error.message}\n\n`;
            }
        }
        
        return {
            content: [
                {
                    type: 'text',
                    text: result
                }
            ]
        };
    } catch (error) {
        logger.error('Błąd podczas pobierania historii energii', { error: error.message });
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ Błąd podczas pobierania historii energii: ${error.message}`
                }
            ]
        };
    }
}
