import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const apiKey = process.env.IMGBB_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
    }

    if (!request.body) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    // Récupérer le fichier
    const buffer = await request.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Envoyer à ImgBB
    const formData = new FormData();
    formData.append('image', base64);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json({ 
        error: "Erreur ImgBB", 
        details: data 
      }, { status: 500 });
    }

    // Retourner l'URL de l'image
    return NextResponse.json({ 
      url: data.data.url,
      display_url: data.data.display_url,
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Erreur serveur", 
      message: String(error) 
    }, { status: 500 });
  }
}
