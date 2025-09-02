import { logger } from '../utils/logger.js';

export async function getEnergyMeasurementsTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia get_energy_measurements', { args });
    
    try {
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
        
        let result = `📊 **Aktualne pomiary energii - ${electricityMeters.length} liczników**\n\n`;
        
        for (const meter of electricityMeters) {
            result += `🔌 **${meter.caption || 'Brak nazwy'}** (ID: ${meter.id})\n`;
            
            try {
                // Pobierz aktualne pomiary
                const measurements = await suplaClient.getCurrentEnergyMeasurements(meter.id);
                
                if (measurements && measurements.connected) {
                    result += `   ✅ **Połączony**\n`;
                    result += `   💰 **Koszt całkowity:** ${measurements.totalCost || 0} ${measurements.currency || 'PLN'}\n`;
                    result += `   📈 **Fazy:** ${measurements.phases?.length || 0}\n\n`;
                    
                    if (measurements.phases && measurements.phases.length > 0) {
                        measurements.phases.forEach((phase, index) => {
                            result += `   **Faza ${phase.number}:**\n`;
                            result += `   ⚡ Napięcie: ${phase.voltage || 0}V\n`;
                            result += `   🔌 Prąd: ${phase.current || 0}A\n`;
                            result += `   ⚡ Moc czynna: ${phase.powerActive || 0}W\n`;
                            result += `   🔋 Moc bierna: ${phase.powerReactive || 0}VAR\n`;
                            result += `   📊 Moc pozorna: ${phase.powerApparent || 0}VA\n`;
                            result += `   📈 Współczynnik mocy: ${phase.powerFactor || 0}\n`;
                            result += `   🔢 Częstotliwość: ${phase.frequency || 0}Hz\n`;
                            result += `   📊 Energia czynna: ${phase.totalForwardActiveEnergy || 0}kWh\n`;
                            result += `   🔄 Energia bierna: ${phase.totalForwardReactiveEnergy || 0}kVARh\n\n`;
                        });
                    } else {
                        result += `   📊 Brak danych pomiarowych\n\n`;
                    }
                } else {
                    result += `   ❌ **Niepołączony** lub brak danych\n\n`;
                }
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
        logger.error('Błąd podczas pobierania pomiarów energii', { error: error.message });
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ Błąd podczas pobierania pomiarów energii: ${error.message}`
                }
            ]
        };
    }
}
