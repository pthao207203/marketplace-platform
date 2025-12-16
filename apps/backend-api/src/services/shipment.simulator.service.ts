import ShipmentModel from "../models/shipment.model";
import { eventCodeNameToValue } from "../constants/order.constants";
import OrderModel from "../models/order.model";
import { ORDER_STATUS } from "../constants/order.constants";
import mongoose from "mongoose";

// Simple in-memory simulator: given a shipment id, it will emit events over time
const simulators: Record<string, NodeJS.Timeout[]> = {};

export function startSimulation(shipmentId: string) {
  // If already running, skip
  if (simulators[shipmentId]) return;

  const timers: NodeJS.Timeout[] = [];
  simulators[shipmentId] = timers;

  // sequence of events to simulate
  const events = [
    { code: "PICKED_UP", delay: 2000 },
    { code: "ARRIVAL_FACILITY", delay: 4000 },
    { code: "DEPARTURE_FACILITY", delay: 6000 },
    { code: "OUT_FOR_DELIVERY", delay: 8000 },
    { code: "DELIVERED", delay: 10000 },
  ];

  for (const ev of events) {
    const t = setTimeout(async () => {
      try {
        const s = await ShipmentModel.findById(String(shipmentId));
        if (!s) return;
        const now = new Date();
        // push event (store numeric eventCode)
        s.events.push({
          eventCode: eventCodeNameToValue(ev.code),
          description: `Simulated ${ev.code}`,
          eventTime: now,
          raw: { simulated: true },
        } as any);
        // map code to numeric status
        let status = s.currentStatus;
        switch (ev.code) {
          case "PICKED_UP":
            status = 2;
            break;
          // ARRIVAL_FACILITY should map to IN_TRANSIT (3)
          case "ARRIVAL_FACILITY":
            status = 3;
            break;
          case "DEPARTURE_FACILITY":
            status = 3;
            break;
          case "OUT_FOR_DELIVERY":
            status = 5;
            break;
          case "DELIVERED":
            status = 6;
            break;
          default:
            status = s.currentStatus;
        }
        s.currentStatus = status;
        s.rawStatus = ev.code;
        await s.save();
      } catch (err) {
        console.error("shipment simulation error", err);
      }
    }, ev.delay);
    timers.push(t);
  }
}

export function stopSimulation(shipmentId: string) {
  const timers = simulators[shipmentId] || [];
  for (const t of timers) clearTimeout(t);
  delete simulators[shipmentId];
}

export default { startSimulation, stopSimulation };
