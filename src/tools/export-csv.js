import { logger } from '../utils/logger.js';

export async function exportEnergyCSVTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia export_energy_csv', { args });
    
    try {
        const { channelId = null, dateFrom = null, dateTo = null } = args;
        
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
        
        let result = `📊 **Eksport archiwalnych danych energii CSV**\n\n`;
        
        // Jeśli podano konkretny channelId, użyj go
        const metersToProcess = channelId ? 
            electricityMeters.filter(m => m.id === channelId) : 
            electricityMeters;
        
        for (const meter of metersToProcess) {
            result += `🔌 **${meter.caption || 'Brak nazwy'}** (ID: ${meter.id})\n`;
            
            try {
                // Eksportuj dane archiwalne
                const exportResult = await suplaClient.exportEnergyDataArchive(meter.id, dateFrom, dateTo);
                
                result += `   ✅ **Eksport zakończony**\n`;
                result += `   📁 **Plik:** ${exportResult.filename}\n`;
                result += `   📊 **Rekordy:** ${exportResult.records}\n`;
                result += `   📏 **Rozmiar:** ${exportResult.size} znaków\n`;
                result += `   🕐 **Timestamp:** ${new Date(exportResult.timestamp).toLocaleString('pl-PL')}\n`;
                
                if (exportResult.dateRange.from || exportResult.dateRange.to) {
                    result += `   📅 **Zakres:** ${exportResult.dateRange.from || 'od początku'} do ${exportResult.dateRange.to || 'do teraz'}\n`;
                }
                
                // Pokaż fragment danych CSV
                const lines = exportResult.data.split('\n');
                result += `   📋 **Fragment danych:**\n`;
                result += `   ${lines[0]}\n`; // Nagłówek
                if (lines.length > 1) {
                    result += `   ${lines[1]}\n`; // Pierwszy wiersz danych
                }
                if (lines.length > 2) {
                    result += `   ... (${lines.length - 2} więcej wierszy)\n`;
                }
                result += `\n`;
                
            } catch (error) {
                result += `   ❌ **Błąd eksportu:** ${error.message}\n\n`;
            }
        }
        
        result += `💡 **Uwaga:** Dane CSV zawierają następujące kolumny:\n`;
        result += `   - Data: Timestamp w formacie ISO\n`;
        result += `   - Timestamp: Unix timestamp\n`;
        result += `   - Faza1_FAE, Faza2_FAE, Faza3_FAE: Energia czynna (kWh * 100000)\n`;
        result += `   - Faza1_RAE, Faza2_RAE, Faza3_RAE: Energia bierna (kVARh * 100000)\n`;
        result += `   - Faza1_FRE, Faza2_FRE, Faza3_FRE: Energia bierna Forward (kVARh * 100000)\n`;
        result += `   - Faza1_RRE, Faza2_RRE, Faza3_RRE: Energia bierna Reverse (kVARh * 100000)\n`;
        
        return {
            content: [
                {
                    type: 'text',
                    text: result
                }
            ]
        };
    } catch (error) {
        logger.error('Błąd podczas eksportu CSV', { error: error.message });
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ Błąd podczas eksportu CSV: ${error.message}`
                }
            ]
        };
    }
}
