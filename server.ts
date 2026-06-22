/**
 * Astrogalaxy — API REST
 * Lenguaje: TypeScript  ·  Runtime: Node.js  ·  Framework: Express
 *
 * Maneja retos, subida de evidencia, verificación por IA, emisión de NFTs,
 * puntos y ranking (por grado o individual).
 *
 * Ejecutar:
 *   npm install
 *   npm run dev      # arranca en http://localhost:4000
 */

import express, { Request, Response } from "express";
import multer from "multer"; // recibe la foto (multipart/form-data)
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: "uploads/" });

const AI_SERVICE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// 1) Listar retos (gratuitos + premium)
// ---------------------------------------------------------------------------
app.get("/v1/challenges", async (_req: Request, res: Response) => {
  // En producción esto viene de PostgreSQL (ver db/schema.sql)
  res.json([
    { id: "recycle-classroom", title: "Reciclaje en el aula", points: 150, premium: false, nft: "Recicla-Bot" },
    { id: "no-plastic-week",   title: "Semana sin plástico",  points: 300, premium: false, nft: "Plastic-Free" },
    { id: "galactic-reforest", title: "Reforestación galáctica", points: 800, premium: true,  nft: "Astro Tree" },
  ]);
});

// ---------------------------------------------------------------------------
// 2) Subir foto de evidencia + verificar con IA en un solo paso
// ---------------------------------------------------------------------------
app.post("/v1/evidence", upload.single("photo"), async (req: Request, res: Response) => {
  const { challenge, participant, mode } = req.body; // mode: "grade" | "individual"
  if (!req.file) return res.status(400).json({ error: "Falta la foto de evidencia" });

  // Llamamos al microservicio de IA (Python/FastAPI)
  const fileBuffer = fs.readFileSync(req.file.path);
  const form = new FormData();
  form.append("challenge", challenge);
  form.append("photo", new Blob([fileBuffer], { type: req.file.mimetype }), req.file.originalname);

  const ai = await fetch(`${AI_SERVICE}/verify`, { method: "POST", body: form })
    .then((r) => r.json() as Promise<{ ai_verified: boolean; confidence: number; duplicate: boolean; points: number }>)
    .finally(() => fs.unlink(req.file!.path, () => {}));

  if (!ai.ai_verified) {
    const message = ai.duplicate
      ? "Esta foto ya fue utilizada como evidencia anteriormente."
      : "La IA no pudo validar que la evidencia corresponda al reto.";
    return res.json({ ai_verified: false, confidence: ai.confidence, duplicate: ai.duplicate, message });
  }

  // Premium → multiplicador x2
  const isPremium = await isPremiumParticipant(participant);
  const points = ai.points * (isPremium ? 2 : 1);

  await awardPoints(participant, mode, points);          // PostgreSQL
  const nft = await mintNft(participant, challenge, isPremium); // Solidity / ERC-721

  res.json({ ai_verified: true, confidence: ai.confidence, duplicate: false, points_awarded: points, nft });
});

// ---------------------------------------------------------------------------
// 3) Ranking (por grado o individual)
// ---------------------------------------------------------------------------
app.get("/v1/leaderboard", async (req: Request, res: Response) => {
  const mode = (req.query.mode as string) ?? "grade";
  // SELECT ... ORDER BY total_points DESC  (ver schema.sql)
  res.json({ mode, top: await getLeaderboard(mode) });
});

// ---------------------------------------------------------------------------
// 4) Dashboard de un participante o grado
// ---------------------------------------------------------------------------
app.get("/v1/dashboard/:id", async (req: Request, res: Response) => {
  res.json(await getDashboard(req.params.id));
});

// --- Funciones de apoyo (implementar contra la BD / blockchain) -------------
async function isPremiumParticipant(_id: string): Promise<boolean> { return false; }
async function awardPoints(_id: string, _mode: string, _points: number): Promise<void> {}
async function mintNft(_id: string, _challenge: string, _unique: boolean) {
  return { name: "Plastic-Free", rarity: _unique ? "unique" : "rare", tokenId: 1234 };
}
async function getLeaderboard(_mode: string) {
  return [{ name: "6°A · Liceo Andes", points: 4820 }, { name: "5°B · Colegio San Martín", points: 4510 }];
}
async function getDashboard(_id: string) {
  return { points: 1240, nfts: 8, challenges: 9, rank: 14 };
}

app.listen(4000, () => console.log("Astrogalaxy API en http://localhost:4000"));
