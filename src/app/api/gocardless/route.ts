import { NextResponse } from "next/server";

const SECRET_ID = process.env.GOCARDLESS_SECRET_ID;
const SECRET_KEY = process.env.GOCARDLESS_SECRET_KEY;

export async function GET() {
    if (!SECRET_ID || !SECRET_KEY) {
        return NextResponse.json(
            { error: "GoCardless credentials not configured" },
            { status: 500 }
        );
    }

    try {
        // 1. Obtener Token de Acceso
        const response = await fetch("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                secret_id: SECRET_ID,
                secret_key: SECRET_KEY,
            }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to connect to GoCardless" }, { status: 500 });
    }
}
