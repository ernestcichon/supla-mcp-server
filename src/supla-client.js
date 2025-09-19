/**
 * Klient API dla systemu Supla
 * @version 2.3.0
 * @author ERGO energia
 */

import axios from 'axios';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { getCurrentConfig } from './tools/config.js';

export class SuplaClient {
    /**
     * Tworzy nowy klient Supla
     * @param {string|null} serverUrl URL serwera Supla
     * @param {string|null} accessToken Token dostępu
     */
    constructor(serverUrl = null, accessToken = null) {
        // Użyj podanych parametrów lub pobierz z aktualnej konfiguracji
        const currentConfig = getCurrentConfig();
        
        this.serverUrl = serverUrl || currentConfig.serverUrl;
        this.accessToken = accessToken || currentConfig.accessToken;
        
        if (!this.accessToken) {
            throw new Error('Brak tokenu dostępu. Ustaw konfigurację najpierw używając set_config.');
        }
        
        this.api = this.createApiClient();
        logger.info('SuplaClient utworzony', { serverUrl: this.serverUrl });
    }

    /**
     * Tworzy instancję axios z konfiguracją
     * @returns {AxiosInstance} Skonfigurowana instancja axios
     */
    createApiClient() {
        return axios.create({
            baseURL: this.serverUrl,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: config.API_TIMEOUT
        });
    }

    /**
     * Aktualizuje konfigurację klienta w czasie działania
     * @param {string|null} newServerUrl Nowy URL serwera
     * @param {string|null} newAccessToken Nowy token dostępu
     */
    updateConfig(newServerUrl = null, newAccessToken = null) {
        if (newServerUrl) {
            this.serverUrl = newServerUrl;
        }
        if (newAccessToken) {
            this.accessToken = newAccessToken;
        }
        
        // Aktualizuj instancję axios
        this.api = this.createApiClient();
        logger.info('Konfiguracja SuplaClient zaktualizowana', { serverUrl: this.serverUrl });
    }

    // Metody dla kanalow
    async getChannels() {
        try {
            logger.debug('Pobieranie kanalow...');
            const response = await this.api.get(`${config.API.basePath}${config.API.endpoints.channels}`);
            logger.info(`Pobrano ${response.data.length} kanalow`);
            return response.data;
        } catch (error) {
            logger.error('Blad podczas pobierania kanalow', { error: error.message });
            throw error;
        }
    }

    async getChannel(channelId) {
        try {
            logger.debug(`Pobieranie kanalu ${channelId}...`);
            const response = await this.api.get(`${config.API.basePath}${config.API.endpoints.channels}/${channelId}`);
            return response.data;
        } catch (error) {
            logger.error(`Blad podczas pobierania kanalu ${channelId}`, { error: error.message });
            throw error;
        }
    }

    // Metody dla lokalizacji
    async getLocations() {
        try {
            logger.debug('Pobieranie lokalizacji...');
            const response = await this.api.get(`${config.API.basePath}/${config.API.version}${config.API.endpoints.locations}`, {
                params: {
                    include: 'channels,iodevices'
                }
            });
            logger.info(`Pobrano ${response.data.length} lokalizacji`);
            return response.data || [];
        } catch (error) {
            logger.error('Blad podczas pobierania lokalizacji', { error: error.message });
            return [];
        }
    }

    async getLocation(locationId) {
        try {
            logger.debug(`Pobieranie lokalizacji ${locationId}...`);
            const response = await this.api.get(`${config.API.basePath}${config.API.endpoints.locations}/${locationId}`);
            return response.data;
        } catch (error) {
            logger.error(`Blad podczas pobierania lokalizacji ${locationId}`, { error: error.message });
            throw error;
        }
    }

    // Metody dla uzytkownikow
    async getUsers() {
        try {
            logger.debug('Pobieranie listy uzytkownikow...');
            const response = await this.api.get(`${config.API.basePath}/${config.API.version}${config.API.endpoints.users}`);
            logger.info(`Pobrano ${response.data.length} uzytkownikow`);
            return response.data || [];
        } catch (error) {
            logger.error('Blad podczas pobierania uzytkownikow', { error: error.message });
            return [];
        }
    }

    async getUser(userId) {
        try {
            logger.debug(`Pobieranie szczegolow uzytkownika ${userId}...`);
            const response = await this.api.get(`${config.API.basePath}/${config.API.version}${config.API.endpoints.users}/${userId}`);
            return response.data;
        } catch (error) {
            logger.error(`Blad podczas pobierania uzytkownika ${userId}`, { error: error.message });
            throw error;
        }
    }

    // Nowe metody dla smartfonow i aplikacji
    async getSmartphones() {
        try {
            logger.debug('Pobieranie listy smartfonow...');
            
            // Pobierz wszystkich uzytkownikow
            const users = await this.getUsers();
            let totalSmartphones = 0;
            const smartphoneDetails = [];
            
            // Dla kazdego uzytkownika pobierz szczegoly
            for (const user of users) {
                try {
                    const userDetails = await this.getUser(user.id);
                    
                    if (userDetails && userDetails.relationsCount && userDetails.relationsCount.clientApps > 0) {
                        totalSmartphones += userDetails.relationsCount.clientApps;
                        
                        smartphoneDetails.push({
                            userId: user.id,
                            userName: user.caption,
                            enabled: user.enabled,
                            smartphones: userDetails.relationsCount.clientApps,
                            locations: userDetails.relationsCount.locations || 0,
                            lastAccess: userDetails.lastAccess || 'Brak danych'
                        });
                    }
                } catch (error) {
                    logger.warn(`Nie udalo sie pobrac szczegolow uzytkownika ${user.id}`, { error: error.message });
                }
            }
            
            logger.info(`Znaleziono ${totalSmartphones} smartfonow w ${smartphoneDetails.length} uzytkownikach`);
            
            return {
                totalSmartphones,
                users: smartphoneDetails,
                summary: {
                    totalUsers: users.length,
                    usersWithSmartphones: smartphoneDetails.length,
                    averageSmartphonesPerUser: smartphoneDetails.length > 0 ? 
                        (totalSmartphones / smartphoneDetails.length).toFixed(1) : 0
                }
            };
        } catch (error) {
            logger.error('Blad podczas pobierania smartfonow', { error: error.message });
            return {
                totalSmartphones: 0,
                users: [],
                summary: {
                    totalUsers: 0,
                    usersWithSmartphones: 0,
                    averageSmartphonesPerUser: 0
                }
            };
        }
    }

    async getSmartphoneDetails(userId) {
        try {
            logger.debug(`Pobieranie szczegolow smartfonow dla uzytkownika ${userId}...`);
            
            const userDetails = await this.getUser(userId);
            
            if (!userDetails) {
                throw new Error('Uzytkownik nie znaleziony');
            }
            
            return {
                userId: userId,
                userName: userDetails.caption,
                enabled: userDetails.enabled,
                smartphones: userDetails.relationsCount?.clientApps || 0,
                locations: userDetails.relationsCount?.locations || 0,
                lastAccess: userDetails.lastAccess || 'Brak danych',
                permissions: userDetails.permissions || [],
                accessIds: userDetails.accessIds || []
            };
        } catch (error) {
            logger.error(`Blad podczas pobierania szczegolow smartfonow dla uzytkownika ${userId}`, { error: error.message });
            throw error;
        }
    }

    // Metody dla urzadzen
    async getDevices() {
        try {
            logger.debug('Pobieranie urzadzen...');
            const response = await this.api.get(`${config.API.basePath}/${config.API.version}${config.API.endpoints.devices}`);
            const devices = response.data || [];
            logger.info(`Pobrano ${devices.length} urzadzen`);
            return devices;
        } catch (error) {
            logger.error('Blad podczas pobierania urzadzen', { error: error.message });
            return [];
        }
    }

    async getDevice(deviceId) {
        try {
            logger.debug(`Pobieranie urządzenia ${deviceId}...`);
            const response = await this.api.get(`${config.API.basePath}${config.API.endpoints.devices}/${deviceId}`);
            return response.data;
        } catch (error) {
            logger.error(`Błąd podczas pobierania urządzenia ${deviceId}`, { error: error.message });
            throw error;
        }
    }

    // Metody akcji - nowa implementacja z PATCH
    async executeChannelAction(channelId, actionName) {
        try {
            logger.debug(`Wykonywanie akcji ${actionName} na kanale ${channelId}...`);
            
            // Mapowanie akcji na odpowiednie wartości
            const actionMap = {
                'toggle': 'TOGGLE',
                'turn-on': 'TURN_ON',
                'turn-off': 'TURN_OFF',
                'open': 'OPEN',
                'close': 'CLOSE'
            };
            
            const actionValue = actionMap[actionName.toLowerCase()] || actionName.toUpperCase();
            
            // Użyj PATCH z body JSON
            const response = await this.api.patch(`${config.API.basePath}/${config.API.version}${config.API.endpoints.channels}/${channelId}`, {
                action: actionValue
            });
            
            logger.info(`Akcja ${actionName} wykonana pomyślnie na kanale ${channelId}`);
            return response.data;
        } catch (error) {
            logger.error(`Błąd podczas wykonywania akcji ${actionName} na kanale ${channelId}`, { error: error.message });
            
            // Fallback do starej metody POST
            try {
                logger.debug(`Próba z metodą POST...`);
                const response = await this.api.post(`${config.API.basePath}/${config.API.version}${config.API.endpoints.channels}/${channelId}/action/${actionName}`);
                return response.data;
            } catch (error2) {
                logger.error(`Błąd również w metodzie POST`, { error: error2.message });
                throw error2;
            }
        }
    }

    // Metody pomocnicze
    async checkConnection() {
        try {
            logger.debug('Sprawdzanie połączenia z serwerem Supla...');
            const channels = await this.getChannels();
            return {
                connected: true,
                channelsCount: channels.length,
                message: `Połączony pomyślnie. Znaleziono ${channels.length} kanałów.`
            };
        } catch (error) {
            logger.error('Błąd połączenia z serwerem Supla', { error: error.message });
            return {
                connected: false,
                error: error.message
            };
        }
    }

    async getChannelsByFunction(functionName) {
        try {
            logger.debug(`Pobieranie kanałów z funkcją ${functionName}...`);
            const channels = await this.getChannels();
            const filtered = channels.filter(channel => 
                channel.function && channel.function.name === functionName
            );
            logger.info(`Znaleziono ${filtered.length} kanałów z funkcją ${functionName}`);
            return filtered;
        } catch (error) {
            logger.error(`Błąd podczas pobierania kanałów z funkcją ${functionName}`, { error: error.message });
            return [];
        }
    }

    async getChannelsByLocation(locationId) {
        try {
            logger.debug(`Pobieranie kanałów z lokalizacji ${locationId}...`);
            const channels = await this.getChannels();
            const filtered = channels.filter(channel => channel.locationId === locationId);
            logger.info(`Znaleziono ${filtered.length} kanałów w lokalizacji ${locationId}`);
            return filtered;
        } catch (error) {
            logger.error(`Błąd podczas pobierania kanałów z lokalizacji ${locationId}`, { error: error.message });
            return [];
        }
    }

    async getLocationChannels(locationId) {
        try {
            logger.debug(`Pobieranie kanałów dla lokalizacji ${locationId}...`);
            const response = await this.api.get(`${config.API.basePath}/${config.API.version}${config.API.endpoints.locations}/${locationId}`, {
                params: {
                    include: 'channels,iodevices'
                }
            });
            return response.data.channels || [];
        } catch (error) {
            logger.error(`Błąd podczas pobierania kanałów dla lokalizacji ${locationId}`, { error: error.message });
            return [];
        }
    }

    // Metody dla pomiarów energii (MEW)
    async getElectricityMeterChannels() {
        try {
            logger.debug('Pobieranie kanałów liczników energii...');
            const channels = await this.getChannels();
            const electricityMeters = channels.filter(channel => 
                channel.function && channel.function.name === 'ELECTRICITYMETER'
            );
            logger.info(`Znaleziono ${electricityMeters.length} liczników energii`);
            return electricityMeters;
        } catch (error) {
            logger.error('Błąd podczas pobierania liczników energii', { error: error.message });
            return [];
        }
    }

    async getChannelState(channelId) {
        try {
            logger.debug(`Pobieranie stanu kanału ${channelId}...`);
            const response = await this.api.get(`${config.API.basePath}${config.API.endpoints.channels}/${channelId}/state`);
            return response.data;
        } catch (error) {
            logger.error(`Błąd podczas pobierania stanu kanału ${channelId}`, { error: error.message });
            throw error;
        }
    }

    // ===== METODY ENERGII - 3 RÓŻNE SPOSOBY =====
    
    // 1. AKTUALNE POMIARY - bieżące odczyty z liczników
    async getCurrentEnergyMeasurements(channelId) {
        try {
            logger.debug(`Pobieranie aktualnych pomiarów energii dla kanału ${channelId}...`);
            
            // Pobierz aktualny stan kanału z pomiarami
            const response = await this.api.get(`${config.API.basePath}${config.API.endpoints.channels}/${channelId}`);
            
            if (response.data && response.data.phases) {
                logger.info(`Pobrano aktualne pomiary dla kanału ${channelId}`);
                return {
                    channelId: channelId,
                    connected: response.data.connected,
                    totalCost: response.data.totalCost,
                    currency: response.data.currency,
                    phases: response.data.phases,
                    timestamp: new Date().toISOString()
                };
            } else {
                logger.warn(`Brak aktualnych pomiarów dla kanału ${channelId}`);
                return null;
            }
        } catch (error) {
            logger.error(`Błąd podczas pobierania aktualnych pomiarów dla kanału ${channelId}`, { error: error.message });
            return null;
        }
    }
    
    // 2. DANE HISTORYCZNE W PUNKTACH - pomiary w określonych momentach
    async getEnergyHistoryPoints(channelId, limit = 100) {
        try {
            logger.debug(`Pobieranie punktów historycznych energii dla kanału ${channelId} (limit: ${limit})...`);
            
            // Użyj endpointu v2.4.0 który działał wcześniej
            const response = await this.api.get(`/api/v2.4.0/channels/${channelId}/measurement-logs`, {
                params: { 
                    limit,
                    order: 'DESC',
                    logsType: 'default'
                }
            });
            
            logger.info(`Pobrano ${response.data?.length || 0} punktów historycznych dla kanału ${channelId}`);
            return response.data || [];
        } catch (error) {
            logger.error(`Błąd podczas pobierania punktów historycznych dla kanału ${channelId}`, { error: error.message });
            return [];
        }
    }
    
    // 3. EKSPORT ZIP/CSV - pobieranie archiwalnych danych
    async exportEnergyDataArchive(channelId, dateFrom = null, dateTo = null) {
        try {
            logger.debug(`Eksport archiwalnych danych energii dla kanału ${channelId}...`);
            
            // Pobierz dane historyczne z mniejszym limitem
            const history = await this.getEnergyHistoryPoints(channelId, 1000);
            
            if (history.length === 0) {
                throw new Error('Brak danych do eksportu');
            }
            
            // Filtruj według dat jeśli podane
            let filteredHistory = history;
            if (dateFrom || dateTo) {
                filteredHistory = history.filter(record => {
                    const timestamp = record.date_timestamp;
                    if (dateFrom && timestamp < dateFrom) return false;
                    if (dateTo && timestamp > dateTo) return false;
                    return true;
                });
            }
            
            // Generuj CSV
            const csvHeaders = [
                'Data',
                'Timestamp',
                'Faza1_FAE',
                'Faza1_RAE', 
                'Faza1_FRE',
                'Faza1_RRE',
                'Faza2_FAE',
                'Faza2_RAE',
                'Faza2_FRE', 
                'Faza2_RRE',
                'Faza3_FAE',
                'Faza3_RAE',
                'Faza3_FRE',
                'Faza3_RRE'
            ].join(',');
            
            const csvRows = filteredHistory.map(record => {
                const date = new Date(record.date_timestamp * 1000).toISOString();
                return [
                    date,
                    record.date_timestamp,
                    record.phase1_fae || '',
                    record.phase1_rae || '',
                    record.phase1_fre || '',
                    record.phase1_rre || '',
                    record.phase2_fae || '',
                    record.phase2_rae || '',
                    record.phase2_fre || '',
                    record.phase2_rre || '',
                    record.phase3_fae || '',
                    record.phase3_rae || '',
                    record.phase3_fre || '',
                    record.phase3_rre || ''
                ].join(',');
            });
            
            const csvContent = [csvHeaders, ...csvRows].join('\n');
            
            // Utwórz nazwę pliku
            const now = new Date().toISOString().split('T')[0];
            const filename = `energy_archive_${channelId}_${now}.csv`;
            
            logger.info(`Wyeksportowano ${filteredHistory.length} rekordów do CSV dla kanału ${channelId}`);
            
            return {
                filename: filename,
                data: csvContent,
                size: csvContent.length,
                records: filteredHistory.length,
                timestamp: new Date().toISOString(),
                dateRange: {
                    from: dateFrom ? new Date(dateFrom * 1000).toISOString() : null,
                    to: dateTo ? new Date(dateTo * 1000).toISOString() : null
                }
            };
        } catch (error) {
            logger.error(`Błąd podczas eksportu archiwalnych danych dla kanału ${channelId}`, { error: error.message });
            throw error;
        }
    }
}
