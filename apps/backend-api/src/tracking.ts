const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
import { Request, Response } from "express";
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ShipmentModel = require("./models/shipment.model");
const { createProvider } = require("./providers/factory");
const { upsertFromProvider } = require("./utils/shipment-service");

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));
console.log("mongo connecting to", process.env.MONGO_URI);
mongoose
  .connect(process.env.MONGO_URI || "", { dbName: "shop" })
  .catch((err: any) => console.error("mongo connect err", err));

// Initialize provider based on env
const provider = createProvider(process.env.TRACKING_PROVIDER || "mock");

// In-memory store for tracking registrations (for the sample tracking service)
const registrations: Record<
  string,
  { callbackUrl?: string; courierCode?: string }
> = {};

// Create tracking endpoint - called by main app to request a new tracking number
app.post("/create", async (req: Request, res: Response) => {
  try {
    const { orderId, carrier, callbackUrl } = req.body || {};
    const courierCode = carrier || "SIMULATOR";
    // Use orderId to derive trackingNumber when provided
    const trackingNumber = orderId
      ? `ORD-${String(orderId)}`
      : `TM-${Date.now()}`;

    // store registration so simulate can look up callbackUrl later
    registrations[trackingNumber] = { callbackUrl, courierCode };

    // return minimal tracking info
    res.json({ ok: true, trackingNumber, courierCode, trackingData: null });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || e });
  }
});

app.get("/shipments/:trackingNumber", async (req: Request, res: Response) => {
  try {
    const s = await ShipmentModel.findOne({
      trackingNumber: req.params.trackingNumber,
    });
    if (!s) return res.status(404).json({ ok: false, message: "not found" });
    const events = (s.events || []).sort(
      (a: any, b: any) => +new Date(b.eventTime) - +new Date(a.eventTime)
    );
    res.json({ ok: true, shipment: s, events });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || e });
  }
});

app.post("/simulate", async (req: Request, res: Response) => {
  try {
    const { courierCode, trackingNumber, time, description, location, status } =
      req.body || {};
    if (process.env.TRACKING_PROVIDER !== "mock") {
      return res
        .status(400)
        .json({ ok: false, message: "simulate only in mock" });
    }

    const event = {
      eventTime: time || new Date().toISOString(),
      description: description || "Out for delivery (mock)",
      location: location || "HCMC",
      status: status || "out for delivery",
    };

    // If provider supports simulateEvent, call it (maintain internal provider state)
    if (provider && typeof provider.simulateEvent === "function") {
      await provider.simulateEvent(courierCode, trackingNumber, event);
    }

    // If we have a registration, attempt to POST a webhook to the main app
    const reg = registrations[trackingNumber];
    const mainAppUrl = reg?.callbackUrl || process.env.MAIN_APP_URL || null;
    if (mainAppUrl) {
      const axios = require("axios");
      const webhookUrl = `${mainAppUrl.replace(/\/$/, "")}/trackingmore`;
      console.log(`Posting simulated event to main app webhook ${webhookUrl}`);
      try {
        await axios.post(webhookUrl, {
          data: { tracking_number: trackingNumber, courier_code: courierCode },
          event,
        });
      } catch (err: any) {
        console.error(
          "failed to post webhook to main app",
          err?.message || err
        );
        // If the error is connection refused and the host is localhost, try IPv4 loopback (127.0.0.1)
        const code =
          err &&
          (err.code || (err.errors && err.errors[0] && err.errors[0].code));
        if (code === "ECONNREFUSED" && webhookUrl.includes("localhost")) {
          const alt = webhookUrl.replace("localhost", "127.0.0.1");
          try {
            console.info(
              "Attempting webhook retry using 127.0.0.1 instead of localhost"
            );
            await axios.post(alt, {
              data: {
                tracking_number: trackingNumber,
                courier_code: courierCode,
              },
              event,
            });
          } catch (err2: any) {
            console.error("retry to 127.0.0.1 failed", err2?.message || err2);
          }
        }
      }
    }

    // Do not auto-sync to local DB here. Tracking service forwards the event to the
    // main app (callbackUrl /trackingmore) and the main app is responsible for saving it.
    return res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || e });
  }
});

app.listen(process.env.PORT_PROVIDER || 3000, () => {
  console.log(
    `Server on http://localhost:${process.env.PORT_PROVIDER || 3000}`
  );
});
