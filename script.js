const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth"
);

let wallet;
let lastBalance = 0;
let ethPrice = 0;

// ===== PRICE =====
async function getPrice() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const data = await res.json();
  ethPrice = data.ethereum.usd;
}

// ===== CREATE =====
async function createWallet() {
  wallet = ethers.Wallet.createRandom();

  document.getElementById("address").innerText =
    wallet.address;

  document.getElementById("receiveAddress").innerText =
    wallet.address;

  const encrypted = await wallet.encrypt("1234");
  localStorage.setItem("wallet", encrypted);
}

// ===== LOAD =====
async function loadWallet() {
  const encrypted = localStorage.getItem("wallet");

  if (!encrypted) {
    alert("No wallet found");
    return;
  }

  wallet = await ethers.Wallet.fromEncryptedJson(
    encrypted,
    "1234"
  );

  document.getElementById("address").innerText =
    wallet.address;

  document.getElementById("receiveAddress").innerText =
    wallet.address;

  await getPrice();
  getBalance();
  trackWallet();
}

// ===== BALANCE =====
async function getBalance() {
  const balance = await provider.getBalance(wallet.address);
  const eth = parseFloat(ethers.utils.formatEther(balance));

  const usd = eth * ethPrice;

  document.getElementById("balance").innerText =
    eth.toFixed(4) + " ETH";

  document.getElementById("total").innerText =
    "$" + usd.toFixed(2);

  lastBalance = eth;
}

// ===== SEND =====
async function send() {
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  try {
    setStatus("📤 Sending $" + (amount * ethPrice).toFixed(2), "yellow");

    const tx = await wallet.connect(provider).sendTransaction({
      to,
      value: ethers.utils.parseEther(amount)
    });

    await tx.wait();

    setStatus("✅ Sent $" + (amount * ethPrice).toFixed(2), "lime");

    getBalance();

  } catch {
    setStatus("❌ Error", "red");
  }
}

// ===== STATUS =====
function setStatus(msg, color="white") {
  const s = document.getElementById("status");
  s.innerText = msg;
  s.style.color = color;
}

// ===== TRACK =====
function trackWallet() {
  setInterval(async () => {
    const balance = await provider.getBalance(wallet.address);
    const current = parseFloat(ethers.utils.formatEther(balance));

    if (lastBalance !== 0) {

      if (current > lastBalance) {
        const diff = (current - lastBalance) * ethPrice;
        setStatus("💰 Receiving $" + diff.toFixed(2), "lime");
      }

      if (current < lastBalance) {
        const diff = (lastBalance - current) * ethPrice;
        setStatus("📤 Sent $" + diff.toFixed(2), "red");
      }
    }

    lastBalance = current;

  }, 5000);
}
