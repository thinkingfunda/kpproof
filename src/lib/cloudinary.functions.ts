import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const clean = (s: string) => s.trim().replace(/[^A-Za-z0-9 _-]/g, "").replace(/\s+/g, "_");

export const signUpload = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ partyName: z.string().min(1).max(200), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), vehicle: z.string().min(1).max(30) }).parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["CLOUDINARY_API_KEY"];
    const secret = process.env["CLOUDINARY_API_SECRET"];
    const cloud = process.env["CLOUDINARY_CLOUD_NAME"];
    if (!apiKey || !secret || !cloud) throw new Error("Cloudinary not configured");
    const [y, m, d] = data.date.split("-");
    const folder = `${clean(data.partyName)}/${d}${m}${y}`;
    const public_id = `${clean(data.vehicle).toUpperCase()}_${Date.now()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}${secret}`;
    const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
    const signature = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return { apiKey, cloud, folder, public_id, timestamp, signature };
  });
