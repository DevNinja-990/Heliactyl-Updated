const fetch = require("node-fetch");
const settings = require("../settings.json");

module.exports.load = async function (app, db) {
  app.post("/buycoins", async (req, res) => {
    if (!req.session.pterodactyl) {
      return res.redirect("/?error=" + encodeURIComponent(Buffer.from("You are not logged in.").toString('base64')));
    }

    const amount = parseFloat(req.body.amount);
    const currency = req.body.currency;
    const email = req.body.email;

    if (!amount || isNaN(amount) || amount < 0.1) {
      return res.redirect("/buy?error=" + encodeURIComponent(Buffer.from("Invalid amount").toString('base64')));
    }

    try {
      const response = await fetch("https://api.oxapay.com/merchant/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.oxapay.api_key}`
        },
        body: JSON.stringify({
          merchant: settings.oxapay.merchant_id,
          amount: amount,
          fiat: "USD",
          coin: currency,
          email: email,
          order_id: `${req.session.userinfo.id}_${Date.now()}`,
          callback_url: `${settings.website.url}/oxapay/callback`,
          redirect_url: `${settings.website.url}/buy?success=true`
        })
      });

      const data = await response.json();

      if (!data.status || data.status !== "success") {
        return res.redirect("/buy?error=" + encodeURIComponent(Buffer.from("OxaPay error").toString('base64')));
      }

      return res.redirect(data.invoice_url);

    } catch (err) {
      console.error("OxaPay error:", err);
      return res.redirect("/buy?error=" + encodeURIComponent(Buffer.from("Something went wrong").toString('base64')));
    }
  });
};
