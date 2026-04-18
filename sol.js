// ===== SOL SYSTEM =====

let solBalance = 0;
let solPrice = 0;

// GET SOL PRICE
async function getSOLPrice() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
  );
  const data = await res.json();
  solPrice = data.solana.usd;
}

// GET SOL BALANCE
async function getSOLBalance(address) {
  try {
    const res = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address]
      })
    });

    const data = await res.json();

    // lamports → SOL
    solBalance = data.result.value / 1000000000;

    console.log("SOL:", solBalance);

  } catch (e) {
    console.log("SOL error");
  }
}

// LOAD SOL
async function loadSOL() {
  if (!wallet) return;

  await getSOLPrice();
  await getSOLBalance(wallet.address);

  updatePortfolioSOL();
}

// UPDATE TOTAL WITH SOL
function updatePortfolioSOL() {
  const currentTotal = parseFloat(
    document.getElementById("total").innerText.replace("$", "")
  ) || 0;

  const solUSD = solBalance * solPrice;

  const newTotal = currentTotal + solUSD;

  document.getElementById("total").innerText =
    "$" + newTotal.toFixed(2);
}

// AUTO RUN
setInterval(loadSOL, 15000);
