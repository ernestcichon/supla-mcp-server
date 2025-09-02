import { logger } from '../utils/logger.js';

export async function getSmartphonesTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia get_smartphones', { args });
    
    try {
        const { userId = null } = args;
        
        if (userId) {
            // Pobierz szczegóły dla konkretnego użytkownika
            const userDetails = await suplaClient.getSmartphoneDetails(userId);
            
            let result = `📱 **SZCZEGÓŁY SMARTPHONÓW - ${userDetails.userName}**\n\n`;
            result += `👤 **Użytkownik:** ${userDetails.userName} (ID: ${userDetails.userId})\n`;
            result += `📱 **Liczba smartfonów:** ${userDetails.smartphones}\n`;
            result += `🏠 **Dostępne lokalizacje:** ${userDetails.locations}\n`;
            result += `🕐 **Ostatni dostęp:** ${userDetails.lastAccess}\n`;
            result += `   ${userDetails.enabled ? '✅ **Aktywny**' : '❌ **Nieaktywny**'}\n\n`;
            
            if (userDetails.permissions && userDetails.permissions.length > 0) {
                result += `🔐 **Uprawnienia:**\n`;
                userDetails.permissions.forEach(permission => {
                    result += `   - ${permission}\n`;
                });
                result += `\n`;
            }
            
            if (userDetails.accessIds && userDetails.accessIds.length > 0) {
                result += `🔑 **Access IDs:** ${userDetails.accessIds.length}\n`;
            }
            
            return {
                content: [
                    {
                        type: 'text',
                        text: result
                    }
                ]
            };
        } else {
            // Pobierz ogólne statystyki smartfonów
            const smartphoneData = await suplaClient.getSmartphones();
            
            let result = `📱 **STATYSTYKI SMARTPHONÓW**\n\n`;
            
            // Statystyki ogólne
            result += `📊 **PODSUMOWANIE OGÓLNE:**\n`;
            result += `   📱 **Całkowita liczba smartfonów:** ${smartphoneData.totalSmartphones}\n`;
            result += `   👥 **Użytkownicy z smartfonami:** ${smartphoneData.summary.usersWithSmartphones}/${smartphoneData.summary.totalUsers}\n`;
            result += `   📈 **Średnio na użytkownika:** ${smartphoneData.summary.averageSmartphonesPerUser}\n\n`;
            
            // Top użytkownicy z największą liczbą smartfonów
            if (smartphoneData.users.length > 0) {
                const sortedUsers = smartphoneData.users.sort((a, b) => b.smartphones - a.smartphones);
                
                result += `🏆 **TOP UŻYTKOWNICY (najwięcej smartfonów):**\n`;
                sortedUsers.slice(0, 5).forEach((user, index) => {
                    result += `   ${index + 1}. ${user.userName}: ${user.smartphones} smartfonów\n`;
                });
                result += `\n`;
                
                // Szczegółowa lista
                result += `📋 **SZCZEGÓŁOWA LISTA:**\n`;
                smartphoneData.users.forEach((user, index) => {
                    result += `\n${index + 1}. **${user.userName}** (ID: ${user.userId})\n`;
                    result += `   📱 Smartfony: ${user.smartphones}\n`;
                    result += `   🏠 Lokalizacje: ${user.locations}\n`;
                    result += `   🕐 Ostatni dostęp: ${user.lastAccess}\n`;
                    result += `   ${user.enabled ? '✅ Aktywny' : '❌ Nieaktywny'}\n`;
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
        }
    } catch (error) {
        logger.error('Błąd podczas pobierania informacji o smartfonach', { error: error.message });
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ Błąd podczas pobierania informacji o smartfonach: ${error.message}`
                }
            ]
        };
    }
}
