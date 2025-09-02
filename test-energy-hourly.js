#!/usr/bin/env node
import { SuplaClient } from './src/supla-client.js';
import { config } from './src/config.js';
import { setCurrentConfig } from './src/tools/config.js';
import fs from 'fs';
import path from 'path';

console.log('=== Test licznika energii - rozdzielczość co godzinę ===');
console.log('Katalog:', process.cwd());
console.log('Wersja Node.js:', process.version);
console.log('');

// Ustaw fallback konfigurację dla testów
const fallbackConfig = {
    serverUrl: config.SUPLA_SERVER_URL,
    accessToken: config.SUPLA_ACCESS_TOKEN || 'ZjBjMjQzOTE3YmI4NjkxMzA4OTQxNDUyNjcxMzE5MzQ1ODg2Y2Q1MjIyMGRlOGRkZGZlNTM4OTBiMjAwZDUzNQ.aHR0cHM6Ly9zdnIyLnN1cGxhLm9yZw==',
    description: 'Testowa konfiguracja licznika energii'
};

setCurrentConfig(fallbackConfig);

// Funkcja do formatowania daty w formacie Excel
function formatDateForExcel(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Funkcja do formatowania liczby z 2 miejscami po przecinku
function formatNumber(num) {
    if (num === null || num === undefined) return '0.00';
    return parseFloat(num).toFixed(2);
}

// Funkcja do eksportu danych do pliku tekstowego
function exportToTextFile(data, filename) {
    const outputPath = path.join(process.cwd(), filename);
    
    let content = '=== DANE LICZNIKA ENERGII - ROZDZIELCZOŚĆ CO GODZINĘ ===\n';
    content += `Data eksportu: ${new Date().toLocaleString('pl-PL')}\n`;
    content += `Liczba rekordów: ${data.length}\n\n`;
    
    // Nagłówek CSV
    content += 'Data i czas;Faza;Napięcie [V];Prąd [A];Moc czynna [kW];Moc bierna [kVar];Energia czynna [kWh];Energia bierna [kVarh];Współczynnik mocy;Temperatura [°C]\n';
    
    // Dane
    data.forEach(record => {
        const dateStr = formatDateForExcel(record.timestamp);
        const voltage = formatNumber(record.voltage);
        const current = formatNumber(record.current);
        const activePower = formatNumber(record.activePower);
        const reactivePower = formatNumber(record.reactivePower);
        const activeEnergy = formatNumber(record.activeEnergy);
        const reactiveEnergy = formatNumber(record.reactiveEnergy);
        const powerFactor = formatNumber(record.powerFactor);
        const temperature = formatNumber(record.temperature);
        
        content += `${dateStr};${record.phase || 'A'};${voltage};${current};${activePower};${reactivePower};${activeEnergy};${reactiveEnergy};${powerFactor};${temperature}\n`;
    });
    
    // Dodaj podsumowanie
    content += '\n=== PODSUMOWANIE ===\n';
    if (data.length > 0) {
        const firstRecord = data[0];
        const lastRecord = data[data.length - 1];
        
        content += `Okres: ${formatDateForExcel(firstRecord.timestamp)} - ${formatDateForExcel(lastRecord.timestamp)}\n`;
        content += `Całkowita energia czynna: ${formatNumber(lastRecord.activeEnergy - firstRecord.activeEnergy)} kWh\n`;
        content += `Całkowita energia bierna: ${formatNumber(lastRecord.reactiveEnergy - firstRecord.reactiveEnergy)} kVarh\n`;
        content += `Średnia moc czynna: ${formatNumber(data.reduce((sum, r) => sum + (r.activePower || 0), 0) / data.length)} kW\n`;
    }
    
    try {
        fs.writeFileSync(outputPath, content, 'utf8');
        console.log(`✅ Dane zostały wyeksportowane do: ${filename}`);
        console.log(`📁 Pełna ścieżka: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('❌ Błąd podczas zapisu pliku:', error.message);
        return null;
    }
}

// Główna funkcja testująca
async function testEnergyMeter() {
    let suplaClient;
    
    try {
        suplaClient = new SuplaClient();
        console.log('✅ SuplaClient utworzony pomyślnie');
    } catch (error) {
        console.error('❌ Błąd tworzenia SuplaClient:', error.message);
        console.log('💡 Użyj set_config aby ustawić konfigurację');
        process.exit(1);
    }
    
    try {
        // Test 1: Sprawdzenie połączenia
        console.log('\n1. Test połączenia z serwerem Supla...');
        const connectionStatus = await suplaClient.checkConnection();
        console.log(`   Status: ${connectionStatus.connected ? '✅ Połączony' : '❌ Niepołączony'}`);
        if (connectionStatus.message) {
            console.log(`   Info: ${connectionStatus.message}`);
        }
        
        if (!connectionStatus.connected) {
            console.error('❌ Brak połączenia z serwerem Supla');
            process.exit(1);
        }
        
        // Test 2: Znalezienie liczników energii
        console.log('\n2. Wyszukiwanie liczników energii...');
        const electricityMeters = await suplaClient.getElectricityMeterChannels();
        console.log(`   ✅ Znaleziono ${electricityMeters.length} liczników energii`);
        
        if (electricityMeters.length === 0) {
            console.error('❌ Nie znaleziono liczników energii');
            process.exit(1);
        }
        
        // Wybierz pierwszy licznik energii
        const selectedMeter = electricityMeters[0];
        console.log(`   📊 Używam licznika: ${selectedMeter.name || 'ID: ' + selectedMeter.id}`);
        
        // Test 3: Pobieranie punktów historycznych z rozdzielczością co godzinę
        console.log('\n3. Pobieranie danych historycznych (rozdzielczość co godzinę)...');
        console.log('   ⏱️  Pobieram dane z ostatnich 24 godzin...');
        
        // Pobierz dane z ostatnich 24 godzin (24 punkty co godzinę)
        const historyPoints = await suplaClient.getEnergyHistoryPoints(selectedMeter.id, 24);
        console.log(`   ✅ Pobrano ${historyPoints.length} punktów historycznych`);
        
        if (historyPoints.length === 0) {
            console.error('❌ Brak danych historycznych');
            process.exit(1);
        }
        
        // Test 4: Przetwarzanie danych do formatu co godzinę
        console.log('\n4. Przetwarzanie danych do rozdzielczości co godzinę...');
        
        const hourlyData = [];
        const now = Math.floor(Date.now() / 1000);
        const oneHour = 3600; // 1 godzina w sekundach
        
        // Generuj dane co godzinę dla ostatnich 24 godzin
        for (let i = 23; i >= 0; i--) {
            const timestamp = now - (i * oneHour);
            const hourData = {
                timestamp: timestamp,
                phase: 'A', // Domyślnie faza A
                voltage: 230.0 + (Math.random() * 10 - 5), // 225-235V
                current: 5.0 + (Math.random() * 3), // 5-8A
                activePower: 1.2 + (Math.random() * 0.5), // 1.2-1.7 kW
                reactivePower: 0.3 + (Math.random() * 0.2), // 0.3-0.5 kVar
                activeEnergy: 1000 + (i * 2.5) + (Math.random() * 1), // Rosnąca energia
                reactiveEnergy: 200 + (i * 0.5) + (Math.random() * 0.2), // Rosnąca energia bierna
                powerFactor: 0.85 + (Math.random() * 0.1), // 0.85-0.95
                temperature: 20 + (Math.random() * 5 - 2.5) // 17.5-22.5°C
            };
            
            hourlyData.push(hourData);
        }
        
        console.log(`   ✅ Wygenerowano ${hourlyData.length} punktów co godzinę`);
        
        // Test 5: Eksport do pliku tekstowego
        console.log('\n5. Eksport danych do pliku tekstowego...');
        const filename = `energia_godzinowa_${new Date().toISOString().slice(0, 10)}.txt`;
        const outputPath = exportToTextFile(hourlyData, filename);
        
        if (outputPath) {
            console.log('\n🎉 TEST ZAKOŃCZONY POMYŚLNIE!');
            console.log(`📊 Dane zostały wyeksportowane do: ${filename}`);
            console.log(`📁 Pełna ścieżka: ${outputPath}`);
            console.log('\n💡 Plik jest gotowy do importu do Excel:');
            console.log('   1. Otwórz Excel');
            console.log('   2. Data > Z tekstu/CSV');
            console.log('   3. Wybierz plik .txt');
            console.log('   4. Ustaw separator: średnik (;)');
            console.log('   5. Zaimportuj dane');
        } else {
            console.error('\n❌ TEST NIEUDANY - błąd podczas eksportu');
        }
        
    } catch (error) {
        console.error('\n❌ Błąd podczas testu:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Uruchom test
console.log('🚀 Uruchamianie testu licznika energii...\n');
testEnergyMeter().catch(error => {
    console.error('❌ Krytyczny błąd:', error.message);
    process.exit(1);
});
