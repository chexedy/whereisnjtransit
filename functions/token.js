export default {
    async fetch(request, env) {
        const token = await env.NJT_token.get("NJT_current_token");

        if (!token) {
            // TOKEN MISSING
            return new Response(JSON.stringify({ error: "Token missing" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ token }), {
            headers: { "Content-Type": "application/json" },
        });
    },
};