let NJT_token = null;

async function loadToken() {
    try {
        const res = await fetch("/token");
        const data = await res.json();

        if (data.token) {
            NJT_token = data.token;
            console.log("Token loaded:", NJT_token);
        } else {
            console.error("Token missing or failed to load");
        }
    } catch (err) {
        console.error("Error fetching token: ", err);
    }
}

loadToken();