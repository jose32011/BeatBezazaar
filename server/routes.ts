import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBeatSchema, insertPurchaseSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    res.json({ user: { id: user.id, username: user.username, role: user.role } });
  });

  // Beat routes
  app.get("/api/beats", async (req, res) => {
    const beats = await storage.getAllBeats();
    res.json(beats);
  });

  app.get("/api/beats/latest/:limit", async (req, res) => {
    const limit = parseInt(req.params.limit) || 6;
    const beats = await storage.getLatestBeats(limit);
    res.json(beats);
  });

  app.get("/api/beats/:id", async (req, res) => {
    const beat = await storage.getBeat(req.params.id);
    if (!beat) {
      return res.status(404).json({ error: "Beat not found" });
    }
    res.json(beat);
  });

  app.post("/api/beats", async (req, res) => {
    try {
      const validatedBeat = insertBeatSchema.parse(req.body);
      const beat = await storage.createBeat(validatedBeat);
      res.status(201).json(beat);
    } catch (error) {
      res.status(400).json({ error: "Invalid beat data" });
    }
  });

  app.put("/api/beats/:id", async (req, res) => {
    try {
      const beat = await storage.updateBeat(req.params.id, req.body);
      if (!beat) {
        return res.status(404).json({ error: "Beat not found" });
      }
      res.json(beat);
    } catch (error) {
      res.status(400).json({ error: "Invalid beat data" });
    }
  });

  app.delete("/api/beats/:id", async (req, res) => {
    const deleted = await storage.deleteBeat(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Beat not found" });
    }
    res.status(204).send();
  });

  // Purchase routes
  app.get("/api/purchases", async (req, res) => {
    const purchases = await storage.getAllPurchases();
    res.json(purchases);
  });

  app.get("/api/purchases/user/:userId", async (req, res) => {
    const purchases = await storage.getPurchasesByUser(req.params.userId);
    res.json(purchases);
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      const validatedPurchase = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(validatedPurchase);
      
      // Increment download count
      await storage.incrementDownloads();
      
      res.status(201).json(purchase);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase data" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", async (req, res) => {
    const analytics = await storage.getAnalytics();
    res.json(analytics);
  });

  app.post("/api/analytics/visit", async (req, res) => {
    await storage.incrementSiteVisits();
    res.status(204).send();
  });

  app.post("/api/analytics/download", async (req, res) => {
    await storage.incrementDownloads();
    res.status(204).send();
  });

  const httpServer = createServer(app);

  return httpServer;
}
