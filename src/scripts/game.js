import { createChart } from 'lightweight-charts';

// --- GAME STATE ---
const STARTING_BALANCE = 100000000; // 100M USD
const TRADE_SIZE = 1000000; // 1M EUR per trade

let currentPrice = 1.1000; // Starting EUR/USD exchange rate
const priceImpact = 0.0001; // How much price moves per 1M EUR trade

const players = [
    { id: 'human', name: 'You', usd: STARTING_BALANCE, eur: 0, isHuman: true },
    { id: 'ai-1', name: 'AI Trader 1', usd: STARTING_BALANCE, eur: 0, isHuman: false },
    { id: 'ai-2', name: 'AI Trader 2', usd: STARTING_BALANCE, eur: 0, isHuman: false },
    { id: 'ai-3', name: 'AI Trader 3', usd: STARTING_BALANCE, eur: 0, isHuman: false },
    { id: 'ai-4', name: 'AI Trader 4', usd: STARTING_BALANCE, eur: 0, isHuman: false },
    { id: 'ai-5', name: 'AI Trader 5', usd: STARTING_BALANCE, eur: 0, isHuman: false },
];

let tickData = [];
let lastCandleTime = Math.floor(Date.now() / 1000);

// --- CHARTING SETUP ---
const chartContainer = document.getElementById('chart-container');
const chart = createChart(chartContainer, {
    layout: {
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#333',
    },
    grid: {
        vertLines: { color: '#e0e0e0' },
        horzLines: { color: '#e0e0e0' },
    },
    timeScale: {
        timeVisible: true,
        secondsVisible: true,
    }
});

const candlestickSeries = chart.addCandlestickSeries({
    upColor: '#008000',
    downColor: '#800000',
    borderVisible: false,
    wickUpColor: '#008000',
    wickDownColor: '#800000'
});

// Resize chart observer
new ResizeObserver(entries => {
    if (entries.length === 0 || entries[0].target !== chartContainer) { return; }
    const newRect = entries[0].contentRect;
    chart.applyOptions({ height: newRect.height, width: newRect.width });
}).observe(chartContainer);

// Initial candle
let currentCandle = {
    time: lastCandleTime,
    open: currentPrice,
    high: currentPrice,
    low: currentPrice,
    close: currentPrice,
};
candlestickSeries.update(currentCandle);


// --- MARKET ENGINE ---

function formatCurrency(num, isEur = false) {
    return (isEur ? '€' : '$') + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateUI() {
    const human = players.find(p => p.id === 'human');
    document.getElementById('human-usd').innerText = formatCurrency(human.usd);
    document.getElementById('human-eur').innerText = formatCurrency(human.eur, true);

    const aiStatsContainer = document.getElementById('ai-stats-container');
    aiStatsContainer.innerHTML = '';

    players.filter(p => !p.isHuman).forEach(ai => {
        const row = document.createElement('div');
        row.className = 'stat-row';

        const nameSpan = document.createElement('span');
        nameSpan.innerText = ai.name;

        const balanceSpan = document.createElement('span');
        balanceSpan.innerText = `${formatCurrency(ai.usd)} | ${formatCurrency(ai.eur, true)}`;

        row.appendChild(nameSpan);
        row.appendChild(balanceSpan);
        aiStatsContainer.appendChild(row);
    });
}

function executeTrade(playerId, type) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const tradeCost = TRADE_SIZE * currentPrice;

    if (type === 'buy') {
        if (player.usd >= tradeCost) {
            player.usd -= tradeCost;
            player.eur += TRADE_SIZE;
            currentPrice += priceImpact; // Price goes up
        } else {
            if(player.isHuman) console.log("Not enough USD to buy!");
            return;
        }
    } else if (type === 'sell') {
        if (player.eur >= TRADE_SIZE) {
            player.usd += tradeCost;
            player.eur -= TRADE_SIZE;
            currentPrice -= priceImpact; // Price goes down
        } else {
            if(player.isHuman) console.log("Not enough EUR to sell!");
            return;
        }
    }

    // Add noise to make chart look realistic
    const noise = (Math.random() - 0.5) * 0.00005;
    currentPrice += noise;

    // Ensure positive price
    if(currentPrice <= 0) currentPrice = 0.0001;

    updateChartTick(currentPrice, player.isHuman ? type : null);
    updateUI();
}

let markers = [];

function updateChartTick(price, humanAction) {
    const now = Math.floor(Date.now() / 1000);

    // Every 5 seconds start a new candle
    if (now >= currentCandle.time + 5) {
        currentCandle = {
            time: Math.floor(now / 5) * 5, // Snap to 5-sec boundary
            open: price,
            high: price,
            low: price,
            close: price
        };
    } else {
        currentCandle.close = price;
        if (price > currentCandle.high) currentCandle.high = price;
        if (price < currentCandle.low) currentCandle.low = price;
    }

    candlestickSeries.update(currentCandle);

    if (humanAction) {
        markers.push({
            time: currentCandle.time,
            position: humanAction === 'buy' ? 'belowBar' : 'aboveBar',
            color: humanAction === 'buy' ? '#008000' : '#800000',
            shape: humanAction === 'buy' ? 'arrowUp' : 'arrowDown',
            text: humanAction === 'buy' ? 'BUY' : 'SELL'
        });
        // Sort markers by time
        markers.sort((a,b) => a.time - b.time);
        candlestickSeries.setMarkers(markers);
    }
}


// --- AI ENGINE ---
function aiLoop() {
    const aiPlayers = players.filter(p => !p.isHuman);

    // Pick a random AI to trade
    const randomAi = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];

    // Randomly decide to buy or sell (mostly buy if EUR=0, else 50/50)
    const type = randomAi.eur < TRADE_SIZE ? 'buy' : (Math.random() > 0.5 ? 'buy' : 'sell');

    executeTrade(randomAi.id, type);

    // Random interval for next trade (between 500ms and 2000ms)
    const nextTradeDelay = Math.random() * 1500 + 500;
    setTimeout(aiLoop, nextTradeDelay);
}


// --- EVENTS & INIT ---

document.getElementById('btn-buy').addEventListener('click', () => {
    executeTrade('human', 'buy');
});

document.getElementById('btn-sell').addEventListener('click', () => {
    executeTrade('human', 'sell');
});

// Initialize UI
updateUI();

// Start AI loop
setTimeout(aiLoop, 1000);
