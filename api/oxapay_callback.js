const settings = require("../settings.json");

module.exports.load = async function (app, db) {
  app.post("/oxapay/callback", async (req, res) => {
    try {
      const payload = req.body;

      if (payload.status !== "confirmed") return res.sendStatus(200);
      if (!payload.order_id || !payload.amount) return res.sendStatus(400);

      const [userId] = payload.order_id.split("_");
      const usdAmount = parseFloat(payload.amount);
      const coinsToGive = usdAmount * settings.stripe.coins;

      const currentCoins = await db.get(`coins-${userId}`) || 0;
      await db.set(`coins-${userId}`, currentCoins + coinsToGive);

      console.log(`✅ Credited ${coinsToGive} coins to user ${userId} from OxaPay.`);
      res.sendStatus(200);
    } catch (err) {
      console.error("❌ OxaPay callback error:", err);
      res.sendStatus(500);
    }
  });
};
