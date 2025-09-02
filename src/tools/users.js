import { logger } from '../utils/logger.js';

export async function getUsersTool(suplaClient, args) {
    logger.debug('Wykonywanie narzędzia get_users');
    
    try {
        // Pobierz szczegółowe informacje o smartfonach
        const smartphoneData = await suplaClient.getSmartphones();
        
        let result = `📱 **INFORMACJE O UŻYTKOWNIKACH I SMARTPHONACH**\n\n`;
        
        // Podsumowanie
        result += `📊 **PODSUMOWANIE:**\n`;
        result += `   👥 **Użytkownicy:** ${smartphoneData.summary.totalUsers}\n`;
        result += `   📱 **Smartfony:** ${smartphoneData.totalSmartphones}\n`;
        result += `   🔗 **Użytkownicy z smartfonami:** ${smartphoneData.summary.usersWithSmartphones}\n`;
        result += `   📈 **Średnio smartfonów na użytkownika:** ${smartphoneData.summary.averageSmartphonesPerUser}\n\n`;
        
        // Lista użytkowników ze smartfonami
        if (smartphoneData.users.length > 0) {
            result += `👥 **UŻYTKOWNICY ZE SMARTPHONAMI:**\n`;
            
            smartphoneData.users.forEach((user, index) => {
                result += `\n${index + 1}. **${user.userName}** (ID: ${user.userId})\n`;
                result += `   📱 **Smartfony:** ${user.smartphones}\n`;
                result += `   🏠 **Lokalizacje:** ${user.locations}\n`;
                result += `   🕐 **Ostatni dostęp:** ${user.lastAccess}\n`;
                result += `   ${user.enabled ? '✅ **Aktywny**' : '❌ **Nieaktywny**'}\n`;
            });
        } else {
            result += `❌ **Brak użytkowników ze smartfonami**\n`;
        }
        
        // Dodatkowe informacje
        result += `\n💡 **Uwaga:** Dane obejmują wszystkie zarejestrowane aplikacje mobilne (smartfony, tablety) dla każdego użytkownika.`;
        
        return {
            content: [
                {
                    type: 'text',
                    text: result
                }
            ]
        };
    } catch (error) {
        logger.error('Błąd podczas pobierania informacji o użytkownikach', { error: error.message });
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ Błąd podczas pobierania informacji o użytkownikach: ${error.message}`
                }
            ]
        };
    }
}
