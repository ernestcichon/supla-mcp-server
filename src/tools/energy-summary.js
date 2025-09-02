import { logger } from '../utils/logger.js';

export async function getEnergySummaryTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia get_energy_summary', { args });
    
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
        
        let totalCost = 0;
        let totalActiveEnergy = 0;
        let totalReactiveEnergy = 0;
        let totalPowerActive = 0;
        let totalPowerReactive = 0;
        let totalPowerApparent = 0;
        let connectedMeters = 0;
        
        const meterDetails = [];
        
        for (const meter of electricityMeters) {
            try {
                const details = await suplaClient.getChannel(meter.id);
                
                if (details.connected && details.phases) {
                    connectedMeters++;
                    
                    // Sumuj dane z wszystkich faz
                    let meterActiveEnergy = 0;
                    let meterReactiveEnergy = 0;
                    let meterPowerActive = 0;
                    let meterPowerReactive = 0;
                    let meterPowerApparent = 0;
                    
                    details.phases.forEach(phase => {
                        meterActiveEnergy += phase.totalForwardActiveEnergy || 0;
                        meterReactiveEnergy += phase.totalForwardReactiveEnergy || 0;
                        meterPowerActive += phase.powerActive || 0;
                        meterPowerReactive += phase.powerReactive || 0;
                        meterPowerApparent += phase.powerApparent || 0;
                    });
                    
                    totalActiveEnergy += meterActiveEnergy;
                    totalReactiveEnergy += meterReactiveEnergy;
                    totalPowerActive += meterPowerActive;
                    totalPowerReactive += meterPowerReactive;
                    totalPowerApparent += meterPowerApparent;
                    totalCost += details.totalCost || 0;
                    
                    meterDetails.push({
                        name: meter.caption || 'Brak nazwy',
                        id: meter.id,
                        activeEnergy: meterActiveEnergy,
                        reactiveEnergy: meterReactiveEnergy,
                        powerActive: meterPowerActive,
                        powerReactive: meterPowerReactive,
                        powerApparent: meterPowerApparent,
                        cost: details.totalCost || 0,
                        currency: details.currency || 'PLN'
                    });
                }
            } catch (error) {
                logger.error(`Błąd podczas pobierania danych licznika ${meter.id}`, { error: error.message });
            }
        }
        
        // Oblicz średni współczynnik mocy
        const averagePowerFactor = totalPowerApparent > 0 ? 
            Math.abs(totalPowerActive / totalPowerApparent) : 0;
        
        let result = `📊 **PODSUMOWANIE ENERGII**\n\n`;
        result += `🔌 **Liczniki:** ${connectedMeters}/${electricityMeters.length} połączone\n\n`;
        
        result += `💰 **Koszt całkowity:** ${totalCost.toFixed(2)} PLN\n`;
        result += `⚡ **Energia czynna:** ${totalActiveEnergy.toFixed(2)} kWh\n`;
        result += `🔄 **Energia bierna:** ${totalReactiveEnergy.toFixed(2)} kVARh\n\n`;
        
        result += `📈 **Moc aktualna:**\n`;
        result += `   ⚡ Moc czynna: ${totalPowerActive.toFixed(2)} W\n`;
        result += `   🔋 Moc bierna: ${totalPowerReactive.toFixed(2)} VAR\n`;
        result += `   📊 Moc pozorna: ${totalPowerApparent.toFixed(2)} VA\n`;
        result += `   📈 Współczynnik mocy: ${averagePowerFactor.toFixed(3)}\n\n`;
        
        if (meterDetails.length > 0) {
            result += `📋 **Szczegóły liczników:**\n`;
            meterDetails.forEach((meter, index) => {
                result += `\n${index + 1}. **${meter.name}** (ID: ${meter.id})\n`;
                result += `   💰 Koszt: ${meter.cost.toFixed(2)} ${meter.currency}\n`;
                result += `   ⚡ Energia: ${meter.activeEnergy.toFixed(2)} kWh\n`;
                result += `   🔄 Energia bierna: ${meter.reactiveEnergy.toFixed(2)} kVARh\n`;
                result += `   📊 Moc: ${meter.powerActive.toFixed(2)} W\n`;
            });
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
        logger.error('Błąd podczas pobierania podsumowania energii', { error: error.message });
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ Błąd podczas pobierania podsumowania energii: ${error.message}`
                }
            ]
        };
    }
}
