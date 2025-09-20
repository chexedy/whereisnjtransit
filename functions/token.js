export async function onRequestGet(context) {
    const kv = context.env.NJT_token;

    const token = await kv.get("NJT_current_token");

    if (!token) {
        return new Response(JSON.stringify({ error: "Token missing" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ token }), {
        headers: { "Content-Type": "application/json" },
    });
}