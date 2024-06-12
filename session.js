const tokenServerURL= import.meta.env.VITE_TOKEN_SERVER_URL;

const startOnboardingSession = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const uniqueId = urlParams.get('uniqueId');
    
    let sessionStartUrl = `${tokenServerURL}/start`
    if (uniqueId) sessionStartUrl +=`?uniqueId=${uniqueId}`;
    
    const response = await fetch(sessionStartUrl);
    if (!response.ok) {
        const sessionData = await response.json();
        throw new Error(sessionData.error);
    }
    
    return await response.json();
}

const finishOnboardingSession = async function(token) {
    // Connect with your backend service to finish the session
    const response = await fetch(`${tokenServerURL}/finish`, {
        method: "POST",
        body: JSON.stringify({token})
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
    }
    
    return await response.json();
}

export {startOnboardingSession, finishOnboardingSession};
