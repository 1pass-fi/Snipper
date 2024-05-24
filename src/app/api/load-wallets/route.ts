import { loadWallets } from "@/blockchain/utils/utils";

export async function GET() {
  try {
    const path = 'pumpVolumeMakerExample.csv';
    const tokens = await loadWallets(path);
    return Response.json({tokens});
  } catch (error) {
    return Response.json({error});
  }
}