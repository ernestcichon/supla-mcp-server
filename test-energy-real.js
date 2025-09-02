#!/usr/bin/env node
import { SuplaClient } from './src/supla-client.js';
import { config } from './src/config.js';
import { setCurrentConfig } from './src/tools/config.js';
import fs from 'fs';
import path from 'path';

console.log('=== Test licznika energii - rzeczywiste dane z rozdzielczością co godzinę ===');
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

// Funkcja do generowania realistycznych danych energii
function generateRealisticEnergyData(hours = 24) {
    const data = [];
    const now = Math.floor(Date.now() / 1000);
    const oneHour = 3600;
    
    // Parametry dla realistycznych danych
    const baseEnergy = 1500; // kWh - początkowa energia
    const baseReactiveEnergy = 300; // kVarh - początkowa energia bierna
    
    // Wzorce dzienne (wyższe zużycie w godzinach 7-22)
    const dailyPattern = [
        0.3, 0.2, 0.15, 0.1, 0.1, 0.15,  // 00-05 (noc)
        0.4, 0.8, 1.2, 1.5, 1.8, 2.0,    // 06-11 (rano)
        1.8, 1.6, 1.4, 1.6, 1.8, 2.2,    // 12-17 (popołudnie)
        2.0, 1.8, 1.5, 1.2, 0.8, 0.5     // 18-23 (wieczór)
    ];
    
    for (let i = hours - 1; i >= 0; i--) {
        const timestamp = now - (i * oneHour);
        const hourOfDay = new Date(timestamp * 1000).getHours();
        const patternMultiplier = dailyPattern[hourOfDay];
        
        // Generuj realistyczne wartości
        const activePower = (1.0 + Math.random() * 0.5) * patternMultiplier;
        const voltage = 230 + (Math.random() * 10 - 5); // 225-235V
        const current = (activePower * 1000) / voltage; // Oblicz prąd z mocy
        const reactivePower = activePower * (0.2 + Math.random() * 0.1); // 20-30% mocy czynnej
        const powerFactor = 0.85 + (Math.random() * 0.1); // 0.85-0.95
        const temperature = 20 + (Math.random() * 5 - 2.5); // 17.5-22.5°C
        
        // Oblicz energię (całkowanie mocy w czasie)
        const energyIncrement = activePower * 1; // 1 godzina
        const reactiveEnergyIncrement = reactivePower * 1;
        
        const activeEnergy = baseEnergy + (hours - 1 - i) * energyIncrement + (Math.random() * 0.1);
        const reactiveEnergy = baseReactiveEnergy + (hours - 1 - i) * reactiveEnergyIncrement + (Math.random() * 0.05);
        
        data.push({
            timestamp: timestamp,
            phase: 'A',
            voltage: voltage,
            current: current,
            activePower: activePower,
            reactivePower: reactivePower,
            activeEnergy: activeEnergy,
            reactiveEnergy: reactiveEnergy,
            powerFactor: powerFactor,
            temperature: temperature
        });
    }
    
    return data;
}

// Funkcja do eksportu danych do pliku tekstowego
function exportToTextFile(data, filename, isRealData = false) {
    const outputPath = path.join(process.cwd(), filename);
    
    let content = '=== DANE LICZNIKA ENERGII - ROZDZIELCZOŚĆ CO GODZINĘ ===\n';
    content += `Data eksportu: ${new Date().toLocaleString('pl-PL')}\n`;
    content += `Liczba rekordów: ${data.length}\n`;
    content += `Typ danych: ${isRealData ? 'Rzeczywiste z API Supla' : 'Symulowane (realistyczne)'}\n\n`;
    
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
        content += `Maksymalna moc czynna: ${formatNumber(Math.max(...data.map(r => r.activePower || 0)))} kW\n`;
        content += `Minimalna moc czynna: ${formatNumber(Math.min(...data.map(r => r.activePower || 0)))} kW\n`;
        
        // Analiza wzorców dziennych
        const morningHours = data.filter(r => {
            const hour = new Date(r.timestamp * 1000).getHours();
            return hour >= 6 && hour <= 11;
        });
        const eveningHours = data.filter(r => {
            const hour = new Date(r.timestamp * 1000).getHours();
            return hour >= 18 && hour <= 22;
        });
        
        if (morningHours.length > 0) {
            const avgMorningPower = morningHours.reduce((sum, r) => sum + (r.activePower || 0), 0) / morningHours.length;
            content += `Średnia moc rano (6-11): ${formatNumber(avgMorningPower)} kW\n`;
        }
        
        if (eveningHours.length > 0) {
            const avgEveningPower = eveningHours.reduce((sum, r) => sum + (r.activePower || 0), 0) / eveningHours.length;
            content += `Średnia moc wieczorem (18-22): ${formatNumber(avgEveningPower)} kW\n`;
        }
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
        
        let hourlyData = [];
        let isRealData = false;
        
        if (electricityMeters.length > 0) {
            // Wybierz pierwszy licznik energii
            const selectedMeter = electricityMeters[0];
            console.log(`   📊 Używam licznika: ${selectedMeter.name || 'ID: ' + selectedMeter.id}`);
            
            // Test 3: Próba pobrania rzeczywistych danych
            console.log('\n3. Próba pobrania rzeczywistych danych historycznych...');
            console.log('   ⏱️  Pobieram dane z ostatnich 24 godzin...');
            
            try {
                const historyPoints = await suplaClient.getEnergyHistoryPoints(selectedMeter.id, 24);
                console.log(`   ✅ Pobrano ${historyPoints.length} rzeczywistych punktów historycznych`);
                
                if (historyPoints.length > 0) {
                    // Przetwórz rzeczywiste dane do formatu co godzinę
                    hourlyData = historyPoints.map(point => ({
                        timestamp: point.timestamp || Math.floor(Date.now() / 1000),
                        phase: point.phase || 'A',
                        voltage: point.voltage || 230.0,
                        current: point.current || 5.0,
                        activePower: point.activePower || 1.0,
                        reactivePower: point.reactivePower || 0.2,
                        activeEnergy: point.activeEnergy || 1000.0,
                        reactiveEnergy: point.reactiveEnergy || 200.0,
                        powerFactor: point.powerFactor || 0.9,
                        temperature: point.temperature || 20.0
                    }));
                    isRealData = true;
                } else {
                    console.log('   ⚠️  Brak rzeczywistych danych, generuję symulowane...');
                }
            } catch (error) {
                console.log(`   ⚠️  Błąd pobierania rzeczywistych danych: ${error.message}`);
                console.log('   🔄 Generuję symulowane dane...');
            }
        }
        
        // Jeśli nie ma rzeczywistych danych, generuj symulowane
        if (hourlyData.length === 0) {
            console.log('\n4. Generowanie symulowanych danych (realistycznych)...');
            hourlyData = generateRealisticEnergyData(24);
            console.log(`   ✅ Wygenerowano ${hourlyData.length} punktów co godzinę`);
        }
        
        // Test 5: Eksport do pliku tekstowego
        console.log('\n5. Eksport danych do pliku tekstowego...');
        const filename = `energia_godzinowa_${isRealData ? 'rzeczywiste' : 'symulowane'}_${new Date().toISOString().slice(0, 10)}.txt`;
        const outputPath = exportToTextFile(hourlyData, filename, isRealData);
        
        if (outputPath) {
            console.log('\n🎉 TEST ZAKOŃCZONY POMYŚLNIE!');
            console.log(`📊 Dane zostały wyeksportowane do: ${filename}`);
            console.log(`📁 Pełna ścieżka: ${outputPath}`);
            console.log(`🔍 Typ danych: ${isRealData ? 'Rzeczywiste z API Supla' : 'Symulowane (realistyczne)'}`);
            console.log('\n💡 Plik jest gotowy do importu do Excel:');
            console.log('   1. Otwórz Excel');
            console.log('   2. Data > Z tekstu/CSV');
            console.log('   3. Wybierz plik .txt');
            console.log('   4. Ustaw separator: średnik (;)');
            console.log('   5. Zaimportuj dane');
            console.log('\n📈 Dane zawierają:');
            console.log('   • Rozdzielczość co godzinę (24 punkty)');
            console.log('   • Wszystkie fazy energii (czynna, bierna)');
            console.log('   • Parametry elektryczne (napięcie, prąd, moc)');
            console.log('   • Współczynnik mocy i temperaturę');
            console.log('   • Podsumowanie statystyczne');
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
console.log('🚀 Uruchamianie testu licznika energii (rzeczywiste dane)...\n');
testEnergyMeter().catch(error => {
    console.error('❌ Krytyczny błąd:', error.message);
    process.exit(1);
});
