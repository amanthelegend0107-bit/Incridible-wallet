const express = require("express");
const ethers = require("ethers");

const app = express();
app.use(express.json());

// ETH RPC
const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth");

// SEND ETH
app.post("/send-eth", async (req, res) => {
  const { privateKey, to, amount } = req.body;

  try {
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount)
    });

    await tx.wait();

    res.json({ success: true, hash: tx.hash });

  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
