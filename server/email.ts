import type { Express, Request, Response } from "express";
import nodemailer from "nodemailer";
import { getStatutLabel } from "@shared/orderStatus";

// Created lazily (on first use), not at module load: this file is imported by
// server/index.ts before that file calls loadDotEnvFiles(), so building the
// transporter here at the top level would always capture an empty SMTP_PASS.
let transporterInstance: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransporter() {
  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: "mail.floreapara.com",
      port: 465, // or 587 if your mail server requires STARTTLS
      secure: true, // true for 465, false for 587
      auth: {
        user: "contact@floreapara.com",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }
  return transporterInstance;
}

const ADMIN_EMAIL = "houssem.warteni11@gmail.com";

// Email function — sending is currently disabled (see console.log below).
// The HTML template is kept commented alongside the send call so nothing is
// built on every order when it won't be used; uncomment both together to
// re-enable real sending.
async function sendOrderEmail(order: any) {
  console.log("ℹ️ Envoi d'email désactivé. Simulation d'envoi pour :", order.email);
  /*
  const productsHTML = order.produits
    .map((p: any) => {
      const price = p.discounted_price ?? p.original_price ?? 0;
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; text-align: center;">
<img src="${p.image_path}" alt="${p.name}" width="60" style="border-radius: 6px;" />
          </td>
          <td style="padding: 8px;">${p.name}</td>
          <td style="padding: 8px; text-align: center;">${p.quantity}</td>
          <td style="padding: 8px; text-align: right;">${price.toFixed(2)} DT</td>
        </tr>
      `;
    })
    .join("");

  const mailOptions = {
    from: '"Floreapara" <contact@floreapara.com>',
    to: order.email,
    subject: `Confirmation de votre commande - Floreapara`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #fafafa; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <div style="text-align: center;">
      <img src="https://i.ibb.co/zHXt9Mzk/flor-a-logos-01.png" alt="florea para" height="40" />
            <h2 style="color: #9a3ac3d4;">Confirmation de votre commande</h2>
          </div>

          <p>Bonjour <strong>${order.nom} ${order.prenom}</strong>,</p>
          <p>Merci pour votre commande ! Voici les détails :</p>

          <h3 style="color: #9a3ac3d4; margin-top: 20px;">Informations client</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr><td><strong>Nom:</strong></td><td>${order.nom} ${order.prenom}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${order.email}</td></tr>
            <tr><td><strong>Téléphone:</strong></td><td>${order.phone}</td></tr>
            <tr><td><strong>Adresse:</strong></td><td>${order.adresse}, ${order.ville}, ${order.code_postal}</td></tr>
            <tr><td><strong>Mode de paiement:</strong></td><td>${order.paiement_mode}</td></tr>
          </table>

          <h3 style="color: #9a3ac3d4;">Détails de la commande</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #eee;">
            <thead>
              <tr style="background-color: #f6f6f6;">
                <th style="padding: 8px;">Image</th>
                <th style="padding: 8px; text-align: left;">Produit</th>
                <th style="padding: 8px; text-align: center;">Qté</th>
                <th style="padding: 8px; text-align: right;">Prix (DT)</th>
              </tr>
            </thead>
            <tbody>
              ${productsHTML}
            </tbody>
          </table>

          <div style="margin-top: 15px; text-align: right;">
            <p><strong>Sous-total :</strong> ${(
              order.total - order.frais_livraison
            ).toFixed(2)} DT</p>
            <p><strong>Frais de livraison :</strong> ${order.frais_livraison.toFixed(
              2
            )} DT</p>
            <p style="font-size: 18px; font-weight: bold; color: #9a3ac3d4;">
              Total : ${order.total.toFixed(2)} DT
            </p>
          </div>

          <p style="margin-top: 30px;">Nous vous remercions pour votre confiance 💜 </p>
          <p style="color: #999;">Cordialement,<br/>L’équipe Floreapara</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    throw err;
  }
  */
}

async function sendStatusChangeEmail(order: any, oldStatut: string, newStatut: string) {
  const oldLabel = getStatutLabel(oldStatut);
  const newLabel = getStatutLabel(newStatut);

  const productsHTML = (order.produits || [])
    .map((p: any) => {
      const price = Number(p.discounted_price ?? p.original_price ?? 0);
      return `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px;">${p.name}</td>
          <td style="padding:8px;text-align:center;">${p.quantity}</td>
          <td style="padding:8px;text-align:right;">${price.toFixed(3)} TND</td>
        </tr>`;
    })
    .join("");

  const mailOptions = {
    from: '"YJ PARA Admin" <contact@floreapara.com>',
    to: ADMIN_EMAIL,
    subject: `[YJ PARA] Commande #${order.id?.slice(0, 8)} — Statut changé : ${oldLabel} → ${newLabel}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:10px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <h2 style="color:#1D8EE6;margin-top:0;">Changement de statut de commande</h2>

          <div style="background:#f0f7ff;border-left:4px solid #1D8EE6;padding:12px 16px;border-radius:4px;margin-bottom:20px;">
            <p style="margin:0;font-size:16px;">
              <strong>${oldLabel}</strong>
              <span style="margin:0 10px;color:#888;">→</span>
              <strong style="color:#1D8EE6;">${newLabel}</strong>
            </p>
          </div>

          <h3 style="color:#333;border-bottom:1px solid #eee;padding-bottom:8px;">Informations client</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr><td style="padding:4px;color:#666;width:140px;">Commande</td><td style="padding:4px;font-weight:bold;">#${order.id?.slice(0, 8)}</td></tr>
            <tr><td style="padding:4px;color:#666;">Client</td><td style="padding:4px;">${order.nom || ""} ${order.prenom || ""}</td></tr>
            <tr><td style="padding:4px;color:#666;">Téléphone</td><td style="padding:4px;">${order.phone || "—"}</td></tr>
            <tr><td style="padding:4px;color:#666;">Adresse</td><td style="padding:4px;">${order.adresse || ""}, ${order.ville || ""}</td></tr>
            <tr><td style="padding:4px;color:#666;">Paiement</td><td style="padding:4px;">${order.paiement_mode || "—"}</td></tr>
            <tr><td style="padding:4px;color:#666;">Date</td><td style="padding:4px;">${new Date(order.created_at).toLocaleString("fr-FR")}</td></tr>
          </table>

          <h3 style="color:#333;border-bottom:1px solid #eee;padding-bottom:8px;">Produits commandés</h3>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
            <thead>
              <tr style="background:#f6f6f6;">
                <th style="padding:8px;text-align:left;">Produit</th>
                <th style="padding:8px;text-align:center;">Qté</th>
                <th style="padding:8px;text-align:right;">Prix</th>
              </tr>
            </thead>
            <tbody>${productsHTML}</tbody>
          </table>

          <div style="margin-top:16px;text-align:right;border-top:1px solid #eee;padding-top:12px;">
            <p style="margin:4px 0;color:#555;">Frais de livraison : <strong>${Number(order.frais_livraison || 0).toFixed(3)} TND</strong></p>
            <p style="margin:4px 0;font-size:18px;font-weight:bold;color:#1D8EE6;">Total : ${Number(order.total || 0).toFixed(3)} TND</p>
          </div>

          <p style="margin-top:24px;color:#999;font-size:12px;">Cet email a été envoyé automatiquement par le système YJ PARA.</p>
        </div>
      </div>
    `,
  };

  await getTransporter().sendMail(mailOptions);
}

export function registerEmailRoutes(app: Express) {
  app.post("/send-status-change-email", async (req: Request, res: Response) => {
    try {
      const { order, oldStatut, newStatut } = req.body;
      await sendStatusChangeEmail(order, oldStatut, newStatut);
      res.json({ message: "Email envoyé à l'admin." });
    } catch (err: any) {
      console.error("❌ Status email error:", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/send-order-email", async (req: Request, res: Response) => {
    try {
      const order = req.body;
      await sendOrderEmail(order);
      res.json({ message: "Email envoyé avec succès !" });
    } catch (err: any) {
      console.error("❌ Failed to send email:", err.message);
      console.error("Code:", err.code);
      console.error("Response:", err.response);
      console.error(err.stack);
      res.status(500).json({ message: err.message || "Erreur lors de l'envoi de l'email" });
    }
  });
}
